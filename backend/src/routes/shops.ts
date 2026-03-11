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

// PATCH /shops/:id/schedule — SMS saat aralığını güncelle
router.patch('/:id/schedule', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const { smsStartHour, smsEndHour } = req.body as { smsStartHour?: number; smsEndHour?: number };

  if (
    typeof smsStartHour !== 'number' || typeof smsEndHour !== 'number' ||
    smsStartHour < 0 || smsStartHour > 23 ||
    smsEndHour < 0 || smsEndHour > 23 ||
    smsStartHour >= smsEndHour
  ) {
    res.status(400).json({ error: 'Geçersiz saat aralığı' });
    return;
  }

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  const updated = await prisma.shop.update({
    where: { id },
    data: { smsStartHour, smsEndHour },
  });

  res.json({ shop: updated });
});

// GET /shops/:id/blocked-phones
router.get('/:id/blocked-phones', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  const blocked = await prisma.blockedPhone.findMany({
    where: { shopId: id },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ blocked });
});

// POST /shops/:id/blocked-phones
router.post('/:id/blocked-phones', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const { phone } = req.body as { phone?: string };

  if (!phone || typeof phone !== 'string') {
    res.status(400).json({ error: 'Telefon numarası gerekli' });
    return;
  }

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  try {
    const entry = await prisma.blockedPhone.create({
      data: { phone: phone.trim(), shopId: id },
    });
    res.status(201).json({ entry });
  } catch {
    res.status(409).json({ error: 'Bu numara zaten engellenmiş' });
  }
});

// DELETE /shops/:id/blocked-phones/:phone
router.delete('/:id/blocked-phones/:phone', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const phone = decodeURIComponent(req.params['phone'] as string);

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  await prisma.blockedPhone.deleteMany({ where: { shopId: id, phone } });

  res.json({ success: true });
});

export default router;
