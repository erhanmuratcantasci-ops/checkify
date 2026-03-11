import { Router, Request, Response } from 'express';
import crypto, { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { smsQueue } from '../lib/queue';
import { normalizePhone } from '../lib/phoneUtils';

const router = Router();

function verifyHmac(rawBody: Buffer, hmacHeader: string, secret: string): boolean {
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
  const shopDomain = req.headers['x-shopify-shop-domain'] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!hmacHeader || !Buffer.isBuffer(rawBody)) {
    res.status(401).json({ error: 'Geçersiz istek' });
    return;
  }

  // Shop domain'e göre shop bul
  const shop = shopDomain
    ? await prisma.shop.findFirst({ where: { shopDomain } })
    : await prisma.shop.findFirst();

  if (!shop) {
    res.status(401).json({ error: 'Shop bulunamadı' });
    return;
  }

  // Shop'un webhookSecret'ı varsa onu kullan, yoksa env'e bak
  const secret = shop.webhookSecret || process.env['SHOPIFY_WEBHOOK_SECRET'] || '';
  if (!secret || !verifyHmac(rawBody, hmacHeader, secret)) {
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
      billing_address?: { phone?: string; zip?: string };
      shipping_address?: { zip?: string };
      total_price?: string;
    };

    const customerName = [
      payload.customer?.first_name,
      payload.customer?.last_name,
    ]
      .filter(Boolean)
      .join(' ') || 'Bilinmiyor';

    const rawPhone =
      payload.customer?.phone ||
      payload.phone ||
      payload.billing_address?.phone ||
      '';
    const customerPhone = normalizePhone(rawPhone);

    const total = parseFloat(payload.total_price ?? '0');

    const confirmToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        shopifyOrderId: BigInt(payload.id),
        customerName,
        customerPhone,
        total,
        status: 'PENDING',
        shopId: shop.id,
        confirmToken,
        tokenExpiresAt,
      },
    });

    console.log(`[webhook] Order oluşturuldu: #${order.id} — ${customerName} (${customerPhone}) — ${total}`);

    const statusToken = randomUUID();
    await prisma.order.update({
      where: { id: order.id },
      data: { statusToken },
    });

    // Blocklist kontrolü — engelli numara ise SMS gönderme
    const blocked = await prisma.blockedPhone.findFirst({
      where: { shopId: shop.id, phone: customerPhone },
    });
    if (blocked) {
      console.log(`[webhook] ${customerPhone} blocklist'te — SMS atlanıyor`);
      return;
    }

    // Posta kodu blocklist kontrolü
    const postalCode = payload.shipping_address?.zip || payload.billing_address?.zip;
    if (postalCode) {
      const blockedPostal = await prisma.blockedPostalCode.findFirst({
        where: { shopId: shop.id, postalCode: postalCode.trim() },
      });
      if (blockedPostal) {
        console.log(`[webhook] Posta kodu ${postalCode} blocklist'te — SMS atlanıyor`);
        return;
      }
    }

    const baseUrl = process.env['BASE_URL'] || 'http://localhost:3001';
    const DASHBOARD_URL = process.env['DASHBOARD_URL'] || 'https://chekkify.com';
    await smsQueue.add('send-sms', {
      orderId: order.id,
      phone: customerPhone,
      customerName,
      total,
      confirmUrl: `${baseUrl}/confirm/${confirmToken}`,
      cancelUrl: `${baseUrl}/confirm/cancel/${confirmToken}`,
      statusUrl: `${DASHBOARD_URL}/status/${statusToken}`,
    });
  } catch (err) {
    console.error('[webhook] Order kaydedilemedi:', err);
  }
});

export default router;
