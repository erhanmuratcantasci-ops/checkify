import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

const ALLOWED_VARS = ['{isim}', '{siparis_no}', '{link}', '{tutar}', '{prepaid_link}'];
const DEFAULT_TEMPLATE = 'Merhaba {isim}, {siparis_no} numaralı siparişinizi onaylamak için: {link}';

function validateTemplate(template: string): string | null {
  const found = template.match(/\{[^}]+\}/g) || [];
  const invalid = found.filter(v => !ALLOWED_VARS.includes(v));
  if (invalid.length > 0) {
    return `Geçersiz değişkenler: ${invalid.join(', ')}. İzin verilenler: ${ALLOWED_VARS.join(', ')}`;
  }
  return null;
}

// GET /shops/:id/template
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.params['id'] as string);

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, userId: req.userId! },
    select: { id: true, name: true, smsTemplate: true },
  });

  if (!shop) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  res.json({ template: shop.smsTemplate || DEFAULT_TEMPLATE });
});

// PUT /shops/:id/template
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.params['id'] as string);
  const { template } = req.body as { template?: string };

  if (!template || typeof template !== 'string') {
    res.status(400).json({ error: 'template zorunludur' });
    return;
  }

  const error = validateTemplate(template);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, userId: req.userId! },
  });

  if (!shop) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { smsTemplate: template },
    select: { id: true, name: true, smsTemplate: true },
  });

  res.json({ template: updated.smsTemplate });
});

export default router;
