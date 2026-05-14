import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  findEligibleOffer,
  recordEvent,
  getOfferStats,
  TriggerType,
  DiscountType,
  UpsellEventType,
} from '../lib/upsellEngine';

const router = Router();

const VALID_TRIGGERS: TriggerType[] = ['pre_purchase', 'post_purchase', 'thank_you'];
const VALID_DISCOUNT_TYPES: DiscountType[] = ['percentage', 'fixed'];
const VALID_EVENTS: UpsellEventType[] = ['shown', 'accepted', 'declined', 'converted'];

// PUBLIC — track event (no auth, called from storefront / dashboard upsell slot)
router.post('/events', async (req: Request, res: Response): Promise<void> => {
  const offerId = String(req.body?.offerId ?? '');
  const eventType = String(req.body?.eventType ?? '') as UpsellEventType;
  const orderId = req.body?.orderId ? Number(req.body.orderId) : null;
  const revenue = req.body?.revenue != null ? Number(req.body.revenue) : null;
  if (!offerId || !VALID_EVENTS.includes(eventType)) {
    res.status(400).json({ error: 'invalid offerId or eventType' });
    return;
  }
  const offer = await prisma.upsellOffer.findUnique({ where: { id: offerId } });
  if (!offer) {
    res.status(404).json({ error: 'offer not found' });
    return;
  }
  await recordEvent(offerId, eventType, orderId, revenue);
  res.json({ success: true });
});

// PUBLIC — render an eligible offer (storefront/form-renderer)
router.get('/render', async (req: Request, res: Response): Promise<void> => {
  const shopId = Number(req.query['shopId']);
  const triggerType = String(req.query['triggerType'] ?? '') as TriggerType;
  if (!shopId || !VALID_TRIGGERS.includes(triggerType)) {
    res.status(400).json({ error: 'invalid shopId or triggerType' });
    return;
  }
  const payload = await findEligibleOffer(shopId, triggerType);
  if (!payload) {
    res.status(404).json({ error: 'no eligible offer' });
    return;
  }
  res.json({ payload });
});

router.use(authenticate);

// GET /upsells — list (shop scope)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const shops = await prisma.shop.findMany({ where: { userId }, select: { id: true } });
  const shopIds = shops.map((s) => s.id);
  const offers = await prisma.upsellOffer.findMany({
    where: { shopId: { in: shopIds } },
    orderBy: [{ shopId: 'asc' }, { priority: 'desc' }],
    include: { _count: { select: { events: true } } },
  });
  res.json({ offers });
});

// POST /upsells — create
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const body = req.body ?? {};
  const shopId = Number(body.shopId);
  const name = String(body.name ?? '').trim();
  const triggerType = String(body.triggerType ?? '') as TriggerType;
  const productId = String(body.productId ?? '').trim();
  const variantId = body.variantId ? String(body.variantId) : null;
  const discount = body.discount != null ? Number(body.discount) : null;
  const discountType = body.discountType
    ? (String(body.discountType) as DiscountType)
    : null;
  const priority = Number.isFinite(Number(body.priority)) ? Number(body.priority) : 0;

  if (!shopId || !name || !VALID_TRIGGERS.includes(triggerType) || !productId) {
    res.status(400).json({ error: 'shopId, name, triggerType, productId required' });
    return;
  }
  if (discountType && !VALID_DISCOUNT_TYPES.includes(discountType)) {
    res.status(400).json({ error: 'discountType must be percentage or fixed' });
    return;
  }
  const shop = await prisma.shop.findFirst({ where: { id: shopId, userId } });
  if (!shop) {
    res.status(403).json({ error: 'shop not found' });
    return;
  }
  const offer = await prisma.upsellOffer.create({
    data: {
      shopId,
      name,
      triggerType,
      productId,
      variantId,
      discount,
      discountType,
      priority,
      isActive: false,
    },
  });
  res.status(201).json({ offer });
});

// GET /upsells/:id — detail + stats
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = String(req.params['id']);
  const offer = await prisma.upsellOffer.findUnique({
    where: { id },
    include: { shop: { select: { userId: true, name: true } } },
  });
  if (!offer) {
    res.status(404).json({ error: 'offer not found' });
    return;
  }
  if (offer.shop.userId !== userId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const stats = await getOfferStats(id);
  res.json({ offer, stats });
});

// PUT /upsells/:id — update
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = String(req.params['id']);
  const offer = await prisma.upsellOffer.findUnique({
    where: { id },
    include: { shop: { select: { userId: true } } },
  });
  if (!offer) {
    res.status(404).json({ error: 'offer not found' });
    return;
  }
  if (offer.shop.userId !== userId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const body = req.body ?? {};
  const data: {
    name?: string;
    triggerType?: TriggerType;
    productId?: string;
    variantId?: string | null;
    discount?: number | null;
    discountType?: DiscountType | null;
    priority?: number;
  } = {};
  if (body.name) data.name = String(body.name).trim();
  if (body.triggerType && VALID_TRIGGERS.includes(body.triggerType)) {
    data.triggerType = body.triggerType;
  }
  if (body.productId) data.productId = String(body.productId);
  if ('variantId' in body) data.variantId = body.variantId ? String(body.variantId) : null;
  if ('discount' in body) data.discount = body.discount != null ? Number(body.discount) : null;
  if ('discountType' in body) {
    data.discountType =
      body.discountType && VALID_DISCOUNT_TYPES.includes(body.discountType)
        ? (body.discountType as DiscountType)
        : null;
  }
  if (body.priority != null) data.priority = Number(body.priority);
  const updated = await prisma.upsellOffer.update({ where: { id }, data });
  res.json({ offer: updated });
});

// DELETE /upsells/:id — soft delete
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = String(req.params['id']);
  const offer = await prisma.upsellOffer.findUnique({
    where: { id },
    include: { shop: { select: { userId: true } } },
  });
  if (!offer) {
    res.status(404).json({ error: 'offer not found' });
    return;
  }
  if (offer.shop.userId !== userId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  await prisma.upsellOffer.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true });
});

// POST /upsells/:id/activate
router.post('/:id/activate', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = String(req.params['id']);
  const offer = await prisma.upsellOffer.findUnique({
    where: { id },
    include: { shop: { select: { userId: true } } },
  });
  if (!offer) {
    res.status(404).json({ error: 'offer not found' });
    return;
  }
  if (offer.shop.userId !== userId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  await prisma.upsellOffer.update({ where: { id }, data: { isActive: true } });
  res.json({ success: true });
});

// GET /upsells/:id/preview — render preview (offer + product)
router.get('/:id/preview', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = String(req.params['id']);
  const offer = await prisma.upsellOffer.findUnique({
    where: { id },
    include: { shop: { select: { userId: true, id: true } } },
  });
  if (!offer) {
    res.status(404).json({ error: 'offer not found' });
    return;
  }
  if (offer.shop.userId !== userId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const payload = await findEligibleOffer(offer.shop.id, offer.triggerType as TriggerType);
  res.json({ payload });
});

// GET /upsells/stats?shopId=
router.get('/stats/:shopId', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const shopId = Number(req.params['shopId']);
  const shop = await prisma.shop.findFirst({ where: { id: shopId, userId } });
  if (!shop) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const offers = await prisma.upsellOffer.findMany({
    where: { shopId },
    select: { id: true, name: true, isActive: true, triggerType: true },
  });
  const stats = await Promise.all(
    offers.map(async (o) => ({ ...o, stats: await getOfferStats(o.id) })),
  );
  res.json({ stats });
});

export default router;
