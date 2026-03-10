import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// POST /shops
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, shopDomain } = req.body as { name?: string; shopDomain?: string };

  if (!name) {
    res.status(400).json({ error: 'name zorunludur' });
    return;
  }

  const webhookSecret = crypto.randomBytes(32).toString('hex');

  const shop = await prisma.shop.create({
    data: {
      name,
      shopDomain: shopDomain || null,
      webhookSecret,
      userId: req.userId!,
    },
  });

  res.status(201).json({ shop });
});

// GET /shops
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const shops = await prisma.shop.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ shops });
});

// GET /shops/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);

  const shop = await prisma.shop.findFirst({
    where: { id, userId: req.userId! },
  });

  if (!shop) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  res.json({ shop });
});

// DELETE /shops/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);

  const shop = await prisma.shop.findFirst({
    where: { id, userId: req.userId! },
  });

  if (!shop) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  await prisma.shop.delete({ where: { id } });

  res.json({ success: true });
});

export default router;
