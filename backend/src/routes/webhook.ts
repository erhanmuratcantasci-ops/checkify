import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

const router = Router();

function verifyShopifyHmac(rawBody: Buffer, hmacHeader: string): boolean {
  const secret = process.env['SHOPIFY_WEBHOOK_SECRET'];
  if (!secret) return false;

  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

// POST /webhook/orders/create
router.post('/orders/create', async (req: Request, res: Response): Promise<void> => {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!hmacHeader || !Buffer.isBuffer(rawBody) || !verifyShopifyHmac(rawBody, hmacHeader)) {
    res.status(401).json({ error: 'Geçersiz imza' });
    return;
  }

  // Shopify 5 saniye içinde 200 bekler — hemen dön
  res.status(200).send('OK');

  try {
    const payload = JSON.parse(rawBody.toString()) as {
      id: number;
      customer?: { first_name?: string; last_name?: string; phone?: string };
      phone?: string;
      billing_address?: { phone?: string };
      total_price?: string;
    };

    const customerName = [
      payload.customer?.first_name,
      payload.customer?.last_name,
    ]
      .filter(Boolean)
      .join(' ') || 'Bilinmiyor';

    const customerPhone =
      payload.customer?.phone ||
      payload.phone ||
      payload.billing_address?.phone ||
      '';

    const total = parseFloat(payload.total_price ?? '0');

    const shop = await prisma.shop.findFirst();
    if (!shop) {
      console.error('[webhook] Shop bulunamadı, order kaydedilemedi');
      return;
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        total,
        status: 'PENDING',
        shopId: shop.id,
      },
    });

    console.log(`[webhook] Order oluşturuldu: #${order.id} — ${customerName} (${customerPhone}) — ${total}`);
  } catch (err) {
    console.error('[webhook] Order kaydedilemedi:', err);
  }
});

export default router;
