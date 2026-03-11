import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireFeature, requireShopSlot } from '../middleware/planCheck';

const router = Router();

router.use(authenticate);

// POST /shops
router.post('/', requireShopSlot, async (req: AuthRequest, res: Response): Promise<void> => {
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
router.post('/:id/blocked-phones', requireFeature('blocklist'), async (req: AuthRequest, res: Response): Promise<void> => {
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

// GET /shops/:id/blocked-postal-codes
router.get('/:id/blocked-postal-codes', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  const blocked = await prisma.blockedPostalCode.findMany({
    where: { shopId: id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ blocked });
});

// POST /shops/:id/blocked-postal-codes
router.post('/:id/blocked-postal-codes', requireFeature('postal_code'), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const { postalCode } = req.body as { postalCode?: string };

  if (!postalCode || typeof postalCode !== 'string') {
    res.status(400).json({ error: 'Posta kodu gerekli' });
    return;
  }

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  try {
    const entry = await prisma.blockedPostalCode.create({
      data: { postalCode: postalCode.trim(), shopId: id },
    });
    res.status(201).json({ entry });
  } catch {
    res.status(409).json({ error: 'Bu posta kodu zaten engellenmiş' });
  }
});

// DELETE /shops/:id/blocked-postal-codes/:postalCode
router.delete('/:id/blocked-postal-codes/:postalCode', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const postalCode = decodeURIComponent(req.params['postalCode'] as string);

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  await prisma.blockedPostalCode.deleteMany({ where: { shopId: id, postalCode } });
  res.json({ success: true });
});

// PATCH /shops/:id/prepaid — ön ödeme ayarlarını güncelle
router.patch('/:id/prepaid', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const { prepaidEnabled, prepaidDiscount } = req.body as { prepaidEnabled?: boolean; prepaidDiscount?: number };

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  const data: { prepaidEnabled?: boolean; prepaidDiscount?: number } = {};
  if (typeof prepaidEnabled === 'boolean') data.prepaidEnabled = prepaidEnabled;
  if (typeof prepaidDiscount === 'number' && [5, 10, 15].includes(prepaidDiscount)) {
    data.prepaidDiscount = prepaidDiscount;
  }

  const updated = await prisma.shop.update({ where: { id }, data });
  res.json({ shop: updated });
});

// PATCH /shops/:id/notification-channel
router.patch('/:id/notification-channel', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const { notificationChannel } = req.body as { notificationChannel?: string };

  if (!notificationChannel || !['sms', 'whatsapp', 'both'].includes(notificationChannel)) {
    res.status(400).json({ error: 'Geçerli kanal: sms, whatsapp, both' });
    return;
  }

  // WhatsApp/both kanalı PRO+ gerektirir
  if ((notificationChannel === 'whatsapp' || notificationChannel === 'both')) {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { plan: true },
    });
    const { hasFeature } = await import('../lib/plans');
    if (!user || !hasFeature(user.plan as 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS', 'whatsapp')) {
      res.status(403).json({ error: 'WhatsApp bildirimleri Pro planı gerektirir', upgrade: true });
      return;
    }
  }

  const shop = await prisma.shop.findFirst({ where: { id, userId: req.userId! } });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  const updated = await prisma.shop.update({ where: { id }, data: { notificationChannel } });
  res.json({ shop: updated });
});

export default router;
