import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { OrderStatus } from '../../generated/prisma';

const router = Router();

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
      where: { shopId: { in: shopIds }, status: { notIn: ['CANCELLED'] } },
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

export default router;
