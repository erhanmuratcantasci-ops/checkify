import { Router, Request, Response } from 'express';
import crypto, { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { smsQueue, enqueueFraudScoring } from '../lib/queue';
import { normalizePhone } from '../lib/phoneUtils';
import { checkOrderForBlocks } from '../lib/blockingService';

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
      email?: string;
      browser_ip?: string;
      client_details?: { browser_ip?: string };
      customer?: { first_name?: string; last_name?: string; phone?: string; email?: string };
      phone?: string;
      billing_address?: { phone?: string; zip?: string };
      shipping_address?: { phone?: string; zip?: string };
      total_price?: string;
    };

    const customerName = [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(' ') || 'Bilinmiyor';
    const rawPhone = payload.customer?.phone || payload.phone || payload.billing_address?.phone || payload.shipping_address?.phone || '';
    const customerPhone = normalizePhone(rawPhone);
    const total = parseFloat(payload.total_price ?? '0');
    const postalCode = payload.shipping_address?.zip || payload.billing_address?.zip;
    const customerEmail = payload.customer?.email || payload.email;
    const ipAddress = payload.browser_ip || payload.client_details?.browser_ip;
    const confirmToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: { shopifyOrderId: BigInt(payload.id), customerName, customerPhone, total, status: 'PENDING', shopId: shop.id, confirmToken, tokenExpiresAt, ipAddress: ipAddress ?? null },
    });

    console.log(`[webhook] Order oluşturuldu: #${order.id} — ${customerName} (${customerPhone}) — ${total}`);

    // Sprint 10 PROTECT — schedule async fraud scoring (5s grace per queue config)
    await enqueueFraudScoring(order.id);

    const statusToken = randomUUID();
    await prisma.order.update({ where: { id: order.id }, data: { statusToken } });

    const blockResult = await checkOrderForBlocks(shop.id, {
      customerName,
      phoneNumber: customerPhone,
      ipAddress: ipAddress ?? null,
      postalCode: postalCode ?? null,
      email: customerEmail ?? null,
      shopifyOrderId: String(payload.id),
    });

    if (blockResult.blocked) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'BLOCKED' } });
      console.log('[webhook] Order bloklandı — SMS atlanıyor:', {
        orderId: order.id,
        source: blockResult.source,
        ruleType: blockResult.ruleType,
        ruleId: blockResult.ruleId,
      });
      return;
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
