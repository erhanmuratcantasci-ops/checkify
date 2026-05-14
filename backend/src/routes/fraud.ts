import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { scoreOrder, persistScore } from '../lib/fraudScoring';

const router = Router();

router.use(authenticate);

// GET /fraud/orders — risk-scored order list (shop scope, riskLevel filter)
router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const riskLevel = (req.query['riskLevel'] as string) || undefined;
  const limit = Math.min(parseInt((req.query['limit'] as string) || '50'), 200);

  const shops = await prisma.shop.findMany({ where: { userId }, select: { id: true } });
  const shopIds = shops.map((s) => s.id);

  const scores = await prisma.fraudScore.findMany({
    where: {
      ...(riskLevel ? { riskLevel } : {}),
      order: { shopId: { in: shopIds } },
    },
    include: {
      order: {
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          total: true,
          status: true,
          createdAt: true,
          shop: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  res.json({ scores });
});

// GET /fraud/orders/:id — detail
router.get('/orders/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(String(req.params['id']));
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }

  const score = await prisma.fraudScore.findUnique({
    where: { orderId: id },
    include: {
      order: {
        include: { shop: { select: { id: true, name: true, userId: true } } },
      },
    },
  });
  if (!score) {
    res.status(404).json({ error: 'fraud score not found' });
    return;
  }
  if (score.order.shop.userId !== userId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  res.json({ score });
});

// POST /fraud/orders/:id/review — manual review (approve/cancel)
router.post('/orders/:id/review', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(String(req.params['id']));
  const action = (req.body?.action as string) || '';
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  if (action !== 'approve' && action !== 'cancel') {
    res.status(400).json({ error: 'action must be approve or cancel' });
    return;
  }

  const score = await prisma.fraudScore.findUnique({
    where: { orderId: id },
    include: { order: { include: { shop: { select: { userId: true } } } } },
  });
  if (!score) {
    res.status(404).json({ error: 'fraud score not found' });
    return;
  }
  if (score.order.shop.userId !== userId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const reviewerId = String(userId);
  await prisma.fraudScore.update({
    where: { orderId: id },
    data: {
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      action: action === 'approve' ? 'auto_approve' : 'auto_cancel',
    },
  });
  if (action === 'cancel') {
    await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
  res.json({ success: true });
});

// GET /fraud/stats — last 7d high+critical counts
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const shops = await prisma.shop.findMany({ where: { userId }, select: { id: true } });
  const shopIds = shops.map((s) => s.id);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [high, critical, total] = await Promise.all([
    prisma.fraudScore.count({
      where: { riskLevel: 'high', createdAt: { gte: since }, order: { shopId: { in: shopIds } } },
    }),
    prisma.fraudScore.count({
      where: { riskLevel: 'critical', createdAt: { gte: since }, order: { shopId: { in: shopIds } } },
    }),
    prisma.fraudScore.count({
      where: { createdAt: { gte: since }, order: { shopId: { in: shopIds } } },
    }),
  ]);

  res.json({ high, critical, total, sinceDays: 7 });
});

// POST /fraud/score/:orderId — manuel re-score trigger (admin/debug)
router.post('/score/:orderId', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(String(req.params['orderId']));
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  const order = await prisma.order.findUnique({ where: { id }, include: { shop: true } });
  if (!order || order.shop.userId !== userId) {
    res.status(404).json({ error: 'order not found' });
    return;
  }
  const result = await scoreOrder(id);
  if (!result) {
    res.status(500).json({ error: 'scoring failed' });
    return;
  }
  await persistScore(id, result);
  res.json({ score: result });
});

export default router;
