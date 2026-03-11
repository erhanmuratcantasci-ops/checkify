import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /status/:token — public order status
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  const token = req.params['token'] as string;

  const order = await prisma.order.findUnique({
    where: { statusToken: token },
    select: {
      id: true,
      customerName: true,
      total: true,
      status: true,
      createdAt: true,
      shop: { select: { name: true } },
    },
  });

  if (!order) {
    res.status(404).json({ error: 'Sipariş bulunamadı' });
    return;
  }

  res.json({ order: { ...order, shopName: order.shop.name, shop: undefined } });
});

export default router;
