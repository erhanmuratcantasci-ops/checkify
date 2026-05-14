import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { enqueueRecoveryMessage } from '../workers/cartRecoveryWorker';

const router = Router();

router.use(authenticate);

async function getUserShopIds(userId: number): Promise<number[]> {
  const shops = await prisma.shop.findMany({
    where: { userId },
    select: { id: true },
  });
  return shops.map((s) => s.id);
}

function parseDateRange(req: AuthRequest): { from?: Date; to?: Date } {
  const fromStr = req.query['from'] as string | undefined;
  const toStr = req.query['to'] as string | undefined;
  const out: { from?: Date; to?: Date } = {};
  if (fromStr) {
    const d = new Date(fromStr);
    if (!isNaN(d.getTime())) out.from = d;
  }
  if (toStr) {
    const d = new Date(toStr);
    if (!isNaN(d.getTime())) out.to = d;
  }
  return out;
}

// GET /abandoned-carts/stats — recovery rate + $ recovered (7d / 30d)
// Placed BEFORE the /:id route so the literal segment wins.
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  const shopIds = await getUserShopIds(req.userId!);

  if (shopIds.length === 0) {
    res.json({
      window7d: { total: 0, recovered: 0, recoveryRate: 0, recoveredValue: 0 },
      window30d: { total: 0, recovered: 0, recoveryRate: 0, recoveredValue: 0 },
    });
    return;
  }

  const now = new Date();
  const since7 = new Date(now);
  since7.setDate(since7.getDate() - 7);
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 30);

  async function computeWindow(since: Date) {
    const [total, recoveredAgg] = await Promise.all([
      prisma.abandonedCart.count({
        where: { shopId: { in: shopIds }, abandonedAt: { gte: since } },
      }),
      prisma.abandonedCart.aggregate({
        where: {
          shopId: { in: shopIds },
          abandonedAt: { gte: since },
          status: 'recovered',
        },
        _count: { _all: true },
        _sum: { cartValue: true },
      }),
    ]);
    const recovered = recoveredAgg._count._all;
    const recoveredValue = recoveredAgg._sum.cartValue ?? 0;
    const recoveryRate = total > 0 ? Math.round((recovered / total) * 1000) / 10 : 0;
    return { total, recovered, recoveryRate, recoveredValue };
  }

  const [window7d, window30d] = await Promise.all([computeWindow(since7), computeWindow(since30)]);

  res.json({ window7d, window30d });
});

// GET /abandoned-carts — list with status + dateRange filter
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const shopIds = await getUserShopIds(req.userId!);

  const { status, page = '1', limit = '20' } = req.query as {
    status?: string;
    page?: string;
    limit?: string;
  };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  if (shopIds.length === 0) {
    res.json({ carts: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
    return;
  }

  const { from, to } = parseDateRange(req);
  const abandonedAtFilter: { gte?: Date; lte?: Date } = {};
  if (from) abandonedAtFilter.gte = from;
  if (to) abandonedAtFilter.lte = to;

  const allowedStatuses = ['abandoned', 'recovering', 'recovered', 'expired'];
  const where: {
    shopId: { in: number[] };
    status?: string;
    abandonedAt?: { gte?: Date; lte?: Date };
  } = { shopId: { in: shopIds } };
  if (status && allowedStatuses.includes(status)) where.status = status;
  if (from || to) where.abandonedAt = abandonedAtFilter;

  const [carts, total] = await Promise.all([
    prisma.abandonedCart.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { abandonedAt: 'desc' },
      select: {
        id: true,
        cartToken: true,
        customerEmail: true,
        customerPhone: true,
        customerName: true,
        cartValue: true,
        currency: true,
        abandonedAt: true,
        recoveredAt: true,
        recoveredOrderId: true,
        status: true,
        shop: { select: { id: true, name: true } },
        _count: { select: { events: true } },
      },
    }),
    prisma.abandonedCart.count({ where }),
  ]);

  res.json({
    carts,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// GET /abandoned-carts/:id — detail + event timeline
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const shopIds = await getUserShopIds(req.userId!);

  const cart = await prisma.abandonedCart.findFirst({
    where: { id, shopId: { in: shopIds } },
    include: {
      shop: { select: { id: true, name: true } },
      events: { orderBy: { sentAt: 'asc' } },
    },
  });

  if (!cart) {
    res.status(404).json({ error: 'Sepet bulunamadı' });
    return;
  }

  res.json({ cart });
});

// POST /abandoned-carts/:id/send-manual — manual SMS/email push
router.post('/:id/send-manual', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const { channel, template } = req.body as { channel?: string; template?: string };

  if (!channel || !['sms', 'email'].includes(channel)) {
    res.status(400).json({ error: 'Geçersiz kanal (sms | email)' });
    return;
  }

  const tpl = template || 'manual_reminder';

  const shopIds = await getUserShopIds(req.userId!);
  const cart = await prisma.abandonedCart.findFirst({
    where: { id, shopId: { in: shopIds } },
  });
  if (!cart) {
    res.status(404).json({ error: 'Sepet bulunamadı' });
    return;
  }

  await enqueueRecoveryMessage({
    abandonedCartId: cart.id,
    channel: channel as 'sms' | 'email',
    template: tpl,
  });

  res.json({ success: true });
});

// PUT /abandoned-carts/recovery-settings/:shopId — V1 no-op
// (Schema-prep didn't add settings fields to Shop. Endpoint returns 200
// with current defaults so the FE can render a form. TODO: extend Shop
// or add a separate settings table in a follow-up sprint.)
router.put('/recovery-settings/:shopId', async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.params['shopId'] as string);
  if (isNaN(shopId)) {
    res.status(400).json({ error: 'Geçersiz shop id' });
    return;
  }

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, userId: req.userId! },
    select: { id: true, name: true },
  });
  if (!shop) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  res.json({
    shop,
    settings: {
      templates: {
        first_reminder: 'first_reminder',
        second_reminder: 'second_reminder',
        final: 'final',
      },
      timing: {
        firstReminderHours: 1,
        secondReminderHours: 6,
        finalHours: 24,
      },
      persisted: false,
      note: 'V1 settings are read-only defaults; no Shop fields changed.',
    },
  });
});

export default router;
