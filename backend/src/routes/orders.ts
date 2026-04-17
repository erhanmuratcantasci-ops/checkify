import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { OrderStatus } from '../../generated/prisma';
import { requireFeature } from '../middleware/planCheck';

const router = Router();

// GET /orders/stats/rto — RTO (Return to Origin) analizi
router.get('/stats/rto', authenticate, requireFeature('rto'), async (req: AuthRequest, res: Response): Promise<void> => {
  const shops = await prisma.shop.findMany({
    where: { userId: req.userId },
    select: { id: true },
  });

  if (shops.length === 0) {
    res.json({ rtoRate: 0, cancelled: 0, total: 0, trend: [], topPhones: [] });
    return;
  }

  const shopIds = shops.map((s) => s.id);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);

  const [grouped, trendRows, topPhones] = await Promise.all([
    prisma.order.groupBy({
      by: ['status'],
      where: { shopId: { in: shopIds } },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS count
      FROM "Order"
      WHERE "shopId" = ANY(${shopIds})
        AND "status" = 'CANCELLED'
        AND "createdAt" >= ${since30}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.order.groupBy({
      by: ['customerPhone'],
      where: { shopId: { in: shopIds }, status: 'CANCELLED' },
      _count: { _all: true },
      orderBy: { _count: { customerPhone: 'desc' } },
      take: 10,
    }),
  ]);

  const byStatus = Object.fromEntries(grouped.map(g => [g.status, g._count._all]));
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const cancelled = byStatus['CANCELLED'] ?? 0;
  const rtoRate = total > 0 ? Math.round((cancelled / total) * 100 * 10) / 10 : 0;

  // 30 günlük trend (eksik günleri 0 ile doldur)
  const trendMap = new Map<string, number>();
  for (const row of trendRows) {
    trendMap.set(new Date(row.date).toISOString().slice(0, 10), Number(row.count));
  }
  const trend: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: trendMap.get(key) ?? 0 });
  }

  // En çok iptal yapan numaralar (masked)
  const maskedPhones = topPhones.map(p => ({
    phone: p.customerPhone.slice(0, -2).replace(/\d/g, '*') + p.customerPhone.slice(-2),
    count: p._count._all,
  }));

  res.json({ rtoRate, cancelled, total, trend, topPhones: maskedPhones });
});

// GET /orders/stats/daily — son 7 günlük sipariş sayısı
router.get('/stats/daily', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const shops = await prisma.shop.findMany({
    where: { userId: req.userId },
    select: { id: true },
  });

  if (shops.length === 0) {
    res.json({ daily: [] });
    return;
  }

  const shopIds = shops.map((s) => s.id);
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
    SELECT DATE("createdAt") AS date, COUNT(*)::int AS count
    FROM "Order"
    WHERE "shopId" = ANY(${shopIds})
      AND "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Fill in missing days with 0
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = new Date(row.date).toISOString().slice(0, 10);
    map.set(key, Number(row.count));
  }

  const daily: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({ date: key, count: map.get(key) ?? 0 });
  }

  res.json({ daily });
});

// GET /orders/stats/verification — doğrulama oranı
router.get('/stats/verification', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const shops = await prisma.shop.findMany({
    where: { userId: req.userId },
    select: { id: true },
  });

  if (shops.length === 0) {
    res.json({ confirmed: 0, cancelled: 0, pending: 0 });
    return;
  }

  const shopIds = shops.map((s) => s.id);

  const grouped = await prisma.order.groupBy({
    by: ['status'],
    where: { shopId: { in: shopIds } },
    _count: { _all: true },
  });

  const byStatus = Object.fromEntries(grouped.map(g => [g.status, g._count._all]));

  res.json({
    confirmed: byStatus['CONFIRMED'] ?? 0,
    cancelled: byStatus['CANCELLED'] ?? 0,
    pending: byStatus['PENDING'] ?? 0,
  });
});

// GET /orders/stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const shops = await prisma.shop.findMany({
    where: { userId: req.userId },
    select: { id: true },
  });

  if (shops.length === 0) {
    res.json({ total: 0, totalRevenue: 0, byStatus: {} });
    return;
  }

  const shopIds = shops.map((s) => s.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [groupedByStatus, revenueAgg, todayOrders] = await Promise.all([
    prisma.order.groupBy({
      by: ['status'],
      where: { shopId: { in: shopIds } },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { shopId: { in: shopIds }, status: { notIn: ['CANCELLED', 'BLOCKED'] } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: { shopId: { in: shopIds }, createdAt: { gte: today } },
    }),
  ]);

  const byStatus = Object.fromEntries(
    groupedByStatus.map((g) => [g.status, g._count._all])
  );

  res.json({
    total: revenueAgg._count._all,
    totalRevenue: revenueAgg._sum.total ?? 0,
    byStatus,
    todayOrders,
  });
});

// GET /orders
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, page = '1', limit = '20' } = req.query as {
    status?: string;
    page?: string;
    limit?: string;
  };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
    res.status(400).json({ error: `Geçersiz status. Geçerli değerler: ${Object.values(OrderStatus).join(', ')}` });
    return;
  }

  // Kullanıcının shop'larını bul
  const shops = await prisma.shop.findMany({
    where: { userId: req.userId },
    select: { id: true },
  });

  if (shops.length === 0) {
    res.json({ orders: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
    return;
  }

  const shopIds = shops.map((s) => s.id);

  const where = {
    shopId: { in: shopIds },
    ...(status ? { status: status as OrderStatus } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shopifyOrderId: true,
        customerName: true,
        customerPhone: true,
        total: true,
        status: true,
        createdAt: true,
        shop: { select: { id: true, name: true, shopDomain: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders: orders.map((o) => ({
      ...o,
      shopifyOrderId: o.shopifyOrderId?.toString() ?? null,
    })),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// GET /orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Geçersiz id' });
    return;
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      shop: { userId: req.userId },
    },
    include: {
      shop: { select: { id: true, name: true, shopDomain: true } },
      smsLogs: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) {
    res.status(404).json({ error: 'Sipariş bulunamadı' });
    return;
  }

  res.json({
    order: {
      ...order,
      shopifyOrderId: order.shopifyOrderId?.toString() ?? null,
    },
  });
});

// PATCH /orders/:id — status update
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const { status } = req.body as { status?: string };

  if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }
  if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
    res.status(400).json({ error: `Geçersiz status. Geçerli değerler: ${Object.values(OrderStatus).join(', ')}` });
    return;
  }

  const order = await prisma.order.findFirst({
    where: { id, shop: { userId: req.userId } },
  });

  if (!order) { res.status(404).json({ error: 'Sipariş bulunamadı' }); return; }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: status as OrderStatus },
    include: {
      shop: { select: { id: true, name: true, shopDomain: true } },
      smsLogs: { orderBy: { createdAt: 'desc' } },
    },
  });

  res.json({
    order: {
      ...updated,
      shopifyOrderId: updated.shopifyOrderId?.toString() ?? null,
    },
  });
});

// POST /orders/:id/resend-sms — SMS yeniden gönder (sadece PENDING)
router.post('/:id/resend-sms', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }

  const order = await prisma.order.findFirst({
    where: { id, shop: { userId: req.userId } },
  });

  if (!order) { res.status(404).json({ error: 'Sipariş bulunamadı' }); return; }
  if (order.status !== 'PENDING') {
    res.status(400).json({ error: 'Yalnızca bekleyen siparişlere SMS gönderilebilir' });
    return;
  }
  if (!order.confirmToken) {
    res.status(400).json({ error: 'Bu sipariş için onay token bulunamadı' });
    return;
  }

  const { smsQueue } = await import('../lib/queue');
  const baseUrl = process.env['BASE_URL'] || 'http://localhost:3001';

  await smsQueue.add('send-sms', {
    orderId: order.id,
    phone: order.customerPhone,
    customerName: order.customerName,
    total: order.total,
    confirmUrl: `${baseUrl}/confirm/${order.confirmToken}`,
    cancelUrl: `${baseUrl}/confirm/cancel/${order.confirmToken}`,
  });

  res.json({ success: true, message: 'SMS kuyruğa eklendi' });
});

// POST /orders/:id/prepaid-link — ön ödeme linki üret
router.post('/:id/prepaid-link', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }

  const order = await prisma.order.findFirst({
    where: { id, shop: { userId: req.userId } },
    include: { shop: { select: { prepaidEnabled: true, prepaidDiscount: true, name: true } } },
  });

  if (!order) { res.status(404).json({ error: 'Sipariş bulunamadı' }); return; }
  if (order.status !== 'PENDING') {
    res.status(400).json({ error: 'Sadece bekleyen siparişler için ön ödeme linki üretilebilir' }); return;
  }

  const discount = order.shop.prepaidDiscount ?? 5;
  const discountedTotal = order.total * (1 - discount / 100);
  const prepaidUrl = `https://pay.chekkify.com/prepaid/${order.id}?discount=${discount}&amount=${discountedTotal.toFixed(2)}`;

  res.json({
    prepaidUrl,
    originalTotal: order.total,
    discountedTotal: Math.round(discountedTotal * 100) / 100,
    discountPercent: discount,
  });
});


// GET /orders/sms-logs — kullanıcının tüm SMS logları
router.get('/sms-logs', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const status = req.query['status'] as string | undefined;
  const skip = (page - 1) * limit;

  const shops = await prisma.shop.findMany({ where: { userId }, select: { id: true } });
  const shopIds = shops.map(s => s.id);

  const orders = await prisma.order.findMany({ where: { shopId: { in: shopIds } }, select: { id: true } });
  const orderIds = orders.map(o => o.id);

  const where: any = { orderId: { in: orderIds } };
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.sMSLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        order: { select: { id: true, customerName: true, customerPhone: true, shop: { select: { name: true } } } },
      },
    }),
    prisma.sMSLog.count({ where }),
  ]);

  res.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export default router;
