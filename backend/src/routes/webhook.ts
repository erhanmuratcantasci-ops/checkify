import { Router, Request, Response } from 'express';
import crypto, { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { smsQueue } from '../lib/queue';
import { normalizePhone } from '../lib/phoneUtils';

const router = Router();

function verifyHmac(rawBody: Buffer, hmacHeader: string, secret: string): boolean {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
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

  if (!hmacHeader || !Buffer.isBuffer(rawBody)) { res.status(401).json({ error: 'Geçersiz istek' }); return; }

  const shop = shopDomain
    ? await prisma.shop.findFirst({ where: { shopDomain } })
    : await prisma.shop.findFirst();

  if (!shop) { res.status(401).json({ error: 'Shop bulunamadı' }); return; }

  const secret = process.env['SHOPIFY_API_SECRET'] || '';
  if (!secret || !verifyHmac(rawBody, hmacHeader, secret)) { res.status(401).json({ error: 'Geçersiz imza' }); return; }

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

    const customerName = [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(' ') || 'Bilinmiyor';
    const rawPhone = payload.customer?.phone || payload.phone || payload.billing_address?.phone || '';
    const customerPhone = normalizePhone(rawPhone);
    const total = parseFloat(payload.total_price ?? '0');
    const confirmToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: { shopifyOrderId: BigInt(payload.id), customerName, customerPhone, total, status: 'PENDING', shopId: shop.id, confirmToken, tokenExpiresAt },
    });

    console.log(`[webhook] Order oluşturuldu: #${order.id} — ${customerName} (${customerPhone}) — ${total}`);

    const statusToken = randomUUID();
    await prisma.order.update({ where: { id: order.id }, data: { statusToken } });

    const blocked = await prisma.blockedPhone.findFirst({ where: { shopId: shop.id, phone: customerPhone } });
    if (blocked) { console.log(`[webhook] ${customerPhone} blocklist'te — SMS atlanıyor`); return; }

    const postalCode = payload.shipping_address?.zip || payload.billing_address?.zip;
    if (postalCode) {
      const blockedPostal = await prisma.blockedPostalCode.findFirst({ where: { shopId: shop.id, postalCode: postalCode.trim() } });
      if (blockedPostal) { console.log(`[webhook] Posta kodu ${postalCode} blocklist'te — SMS atlanıyor`); return; }
    }

    const baseUrl = process.env['BASE_URL'] || 'http://localhost:3001';
    const DASHBOARD_URL = process.env['DASHBOARD_URL'] || 'https://chekkify.com';
    await smsQueue.add('send-sms', {
      orderId: order.id, phone: customerPhone, customerName, total,
      confirmUrl: `${baseUrl}/confirm/${confirmToken}`,
      cancelUrl: `${baseUrl}/confirm/cancel/${confirmToken}`,
      statusUrl: `${DASHBOARD_URL}/status/${statusToken}`,
    });
  } catch (err) {
    console.error('[webhook] Order kaydedilemedi:', err);
  }
});

// POST /webhook/orders/cancelled
router.post('/orders/cancelled', async (req: Request, res: Response): Promise<void> => {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined;
  const shopDomain = req.headers['x-shopify-shop-domain'] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!hmacHeader || !Buffer.isBuffer(rawBody)) { res.status(401).json({ error: 'Geçersiz istek' }); return; }

  const shop = shopDomain
    ? await prisma.shop.findFirst({ where: { shopDomain } })
    : await prisma.shop.findFirst();

  if (!shop) { res.status(401).json({ error: 'Shop bulunamadı' }); return; }

  const secret = process.env['SHOPIFY_API_SECRET'] || '';
  if (!secret || !verifyHmac(rawBody, hmacHeader, secret)) { res.status(401).json({ error: 'Geçersiz imza' }); return; }

  res.status(200).send('OK');

  try {
    const payload = JSON.parse(rawBody.toString()) as { id: number };
    const shopifyOrderId = BigInt(payload.id);

    const order = await prisma.order.findFirst({ where: { shopifyOrderId, shopId: shop.id } });
    if (!order) { console.warn(`[webhook] orders/cancelled — order bulunamadı: ${shopifyOrderId}`); return; }

    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    console.log(`[webhook] Order iptal edildi: #${order.id} (Shopify: ${shopifyOrderId})`);
  } catch (err) {
    console.error('[webhook] orders/cancelled hatası:', err);
  }
});

// POST /webhook/app/uninstalled
router.post('/app/uninstalled', async (req: Request, res: Response): Promise<void> => {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined;
  const shopDomain = req.headers['x-shopify-shop-domain'] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!hmacHeader || !shopDomain || !Buffer.isBuffer(rawBody)) { res.status(401).json({ error: 'Geçersiz istek' }); return; }

  const secret = process.env['SHOPIFY_WEBHOOK_SECRET'] || '';
  if (!secret || !verifyHmac(rawBody, hmacHeader, secret)) { res.status(401).json({ error: 'Geçersiz imza' }); return; }

  res.status(200).send('OK');

  try {
    await prisma.shop.updateMany({ where: { shopDomain }, data: { accessToken: null } });
    console.log(`[webhook] App kaldırıldı: ${shopDomain} — accessToken silindi`);
  } catch (err) {
    console.error('[webhook] app/uninstalled hatası:', err);
  }
});

export default router;
