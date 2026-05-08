import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

/**
 * Built for Shopify mandatory GDPR webhooks. All three:
 *  - MUST validate the X-Shopify-Hmac-Sha256 header
 *  - MUST respond 200 within 5 seconds (do real work async)
 *  - Are registered in the Partner panel against
 *    https://api.chekkify.com/webhook/gdpr/{customers/data_request,
 *      customers/redact, shop/redact}
 *
 * Mounted under /webhook/gdpr/* so it shares the express.raw() body parser
 * with the existing /webhook router (HMAC needs the raw bytes).
 */

const router = Router();

function verifyHmac(rawBody: Buffer, hmacHeader: string, secret: string): boolean {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

function check(req: Request, res: Response): { ok: true; body: Buffer } | { ok: false } {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined;
  const rawBody = req.body as Buffer;
  const secret = process.env['SHOPIFY_API_SECRET'] || '';
  if (!hmacHeader || !Buffer.isBuffer(rawBody) || !secret || !verifyHmac(rawBody, hmacHeader, secret)) {
    res.status(401).json({ error: 'Geçersiz imza' });
    return { ok: false };
  }
  return { ok: true, body: rawBody };
}

// POST /webhook/gdpr/customers/data_request
//   Customer is asking for their data. We have customer name/phone on Order
//   rows; we email the shop owner so they can hand-fulfill the request.
router.post('/customers/data_request', async (req: Request, res: Response): Promise<void> => {
  const v = check(req, res);
  if (!v.ok) return;
  res.status(200).send('OK');

  try {
    const payload = JSON.parse(v.body.toString()) as {
      shop_domain?: string;
      customer?: { id?: number; email?: string; phone?: string };
    };
    if (!payload.shop_domain) return;
    const shop = await prisma.shop.findFirst({
      where: { shopDomain: payload.shop_domain },
      select: { id: true, name: true },
    });
    if (!shop) return;
    console.log(
      `[gdpr] data_request for ${payload.shop_domain} customer=${payload.customer?.email ?? payload.customer?.phone ?? '?'}`
    );
    // Real fulfillment is async by policy: a follow-up job emails the shop
    // owner with the matching Order rows. M5 logs only — promotion to a
    // job is part of the legal hardening sprint.
  } catch (err) {
    console.error('[gdpr] data_request handler error:', err);
  }
});

// POST /webhook/gdpr/customers/redact
//   Customer (or merchant on customer's behalf) wants their personal data
//   deleted. We anonymize the matching Order.customerName/Phone rows but
//   keep the order itself for accounting/legal reasons.
router.post('/customers/redact', async (req: Request, res: Response): Promise<void> => {
  const v = check(req, res);
  if (!v.ok) return;
  res.status(200).send('OK');

  try {
    const payload = JSON.parse(v.body.toString()) as {
      shop_domain?: string;
      customer?: { id?: number; email?: string; phone?: string };
      orders_to_redact?: number[];
    };
    if (!payload.shop_domain) return;
    const shop = await prisma.shop.findFirst({
      where: { shopDomain: payload.shop_domain },
      select: { id: true },
    });
    if (!shop) return;

    const where: { shopId: number; OR?: { shopifyOrderId?: bigint; customerPhone?: string }[] } = {
      shopId: shop.id,
    };
    const ors: { shopifyOrderId?: bigint; customerPhone?: string }[] = [];
    if (payload.orders_to_redact?.length) {
      for (const id of payload.orders_to_redact) ors.push({ shopifyOrderId: BigInt(id) });
    }
    if (payload.customer?.phone) ors.push({ customerPhone: payload.customer.phone });
    if (!ors.length) return;
    where.OR = ors;

    const result = await prisma.order.updateMany({
      where,
      data: { customerName: 'redacted', customerPhone: 'redacted', otpCode: null, ipAddress: null },
    });
    console.log(`[gdpr] customers/redact ${payload.shop_domain} → ${result.count} order(s) redacted`);
  } catch (err) {
    console.error('[gdpr] customers/redact handler error:', err);
  }
});

// POST /webhook/gdpr/shop/redact
//   Sent 48 hours after a shop uninstalls — wipe everything we have
//   for that shop. Cascading deletes in the Prisma schema take care of
//   blocking rules / blocked phones / orders / sms logs.
router.post('/shop/redact', async (req: Request, res: Response): Promise<void> => {
  const v = check(req, res);
  if (!v.ok) return;
  res.status(200).send('OK');

  try {
    const payload = JSON.parse(v.body.toString()) as { shop_domain?: string };
    if (!payload.shop_domain) return;
    const shop = await prisma.shop.findFirst({ where: { shopDomain: payload.shop_domain } });
    if (!shop) return;
    await prisma.shop.delete({ where: { id: shop.id } });
    console.log(`[gdpr] shop/redact ${payload.shop_domain} → shop ${shop.id} hard-deleted`);
  } catch (err) {
    console.error('[gdpr] shop/redact handler error:', err);
  }
});

export default router;
