import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /confirm/:token
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  const token = req.params['token'] as string;

  const order = await prisma.order.findUnique({
    where: { confirmToken: token },
  });

  if (!order) {
    res.status(404).json({ error: 'Geçersiz veya kullanılmış token' });
    return;
  }

  if (!order.tokenExpiresAt || order.tokenExpiresAt < new Date()) {
    res.status(410).json({ error: 'Token süresi dolmuş' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CONFIRMED',
      confirmToken: null,
      tokenExpiresAt: null,
    },
    select: { id: true, customerName: true, total: true, status: true },
  });

  res.json({ message: 'Sipariş onaylandı', order: updated });
});

// GET /confirm/cancel/:token
router.get('/cancel/:token', async (req: Request, res: Response): Promise<void> => {
  const token = req.params['token'] as string;

  const order = await prisma.order.findUnique({
    where: { confirmToken: token },
  });

  if (!order) {
    res.status(404).json({ error: 'Geçersiz veya kullanılmış token' });
    return;
  }

  if (!order.tokenExpiresAt || order.tokenExpiresAt < new Date()) {
    res.status(410).json({ error: 'Token süresi dolmuş' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      confirmToken: null,
      tokenExpiresAt: null,
    },
    select: { id: true, customerName: true, total: true, status: true },
  });

  res.json({ message: 'Sipariş iptal edildi', order: updated });
});

export default router;
