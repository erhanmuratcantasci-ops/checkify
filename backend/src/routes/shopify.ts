import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

const SHOPIFY_API_VERSION = '2025-07';

async function registerWebhooks(shopDomain: string, accessToken: string, baseUrl: string) {
  const topics = [
    { topic: 'orders/create',    address: `${baseUrl}/webhook/orders/create` },
    { topic: 'orders/cancelled', address: `${baseUrl}/webhook/orders/cancelled` },
    { topic: 'app/uninstalled',  address: `${baseUrl}/webhook/app/uninstalled` },
  ];
  for (const wh of topics) {
    try {
      const res = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
        body: JSON.stringify({ webhook: { topic: wh.topic, address: wh.address, format: 'json' } }),
      });
      const data = await res.json() as { webhook?: { id: number }; errors?: unknown };
      if (data.webhook?.id) {
        console.log(`[shopify] Webhook kayit: ${wh.topic}`);
      } else {
        console.warn(`[shopify] Webhook zaten mevcut veya hata: ${wh.topic}`, data.errors ?? '');
      }
    } catch (err) {
      console.warn(`[shopify] Webhook kayit basarisiz: ${wh.topic}`, err);
    }
  }
}

// GET /shopify/install?shop=mystore.myshopify.com&shopId=123
router.get(`/install`, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shop, shopId } = req.query as { shop?: string; shopId?: string };
  if (!shop) { res.status(400).json({ error: 'shop parametresi zorunlu' }); return; }

  const shopDomain = shop.endsWith('.myshopify.com') ? shop : `${shop}.myshopify.com`;
  const state = Buffer.from(JSON.stringify({ userId: req.userId, shopId: shopId ?? null })).toString('base64url');
  const redirectUri = `${process.env['BASE_URL']}/shopify/callback`;
  const scopes = 'read_orders,write_orders,read_fulfillments,write_fulfillments';
  const apiKey = process.env['SHOPIFY_API_KEY']!;

  const installUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  res.json({ url: installUrl });
});

// GET /shopify/callback
router.get('/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, shop, state, hmac } = req.query as Record<string, string>;
  if (!code || !shop || !state || !hmac) { res.status(400).send('Eksik parametreler'); return; }

  const apiSecret = process.env['SHOPIFY_API_SECRET']!;
  const params = Object.entries(req.query as Record<string, string>)
    .filter(([k]) => k !== 'hmac')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const digest = crypto.createHmac('sha256', apiSecret).update(params).digest('hex');
  if (digest !== hmac) { res.status(401).send('HMAC dogrulama basarisiz'); return; }

  let userId: number;
  let shopId: number | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    userId = decoded.userId;
    shopId = decoded.shopId ? parseInt(decoded.shopId) : null;
  } catch { res.status(400).send('Gecersiz state'); return; }

  const shopDomain = shop as string;
  const apiKey = process.env['SHOPIFY_API_KEY']!;
  let accessToken: string;
  try {
    const tokenRes = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, code }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) throw new Error(tokenData.error ?? 'Token alinamadi');
    accessToken = tokenData.access_token;
  } catch (err) {
    console.error('[shopify oauth] Token exchange hatasi:', err);
    res.status(500).send('Access token alinamadi');
    return;
  }

  let shopName = shopDomain;
  try {
    const shopRes = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const shopData = await shopRes.json() as { shop?: { name: string } };
    if (shopData.shop?.name) shopName = shopData.shop.name;
  } catch { /* domain kullan */ }

  let dbShop: { id: number; name: string; shopDomain: string | null };
  if (shopId) {
    dbShop = await prisma.shop.update({
      where: { id: shopId },
      data: { accessToken, shopDomain, name: shopName },
    });
  } else {
    dbShop = await prisma.shop.upsert({
      where: { shopDomain },
      update: { accessToken, name: shopName },
      create: { shopDomain, accessToken, name: shopName, userId },
    });
  }

  const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:3001';
  await registerWebhooks(shopDomain, accessToken, baseUrl);

  const dashboardUrl = process.env['DASHBOARD_URL'] ?? 'https://chekkify.com';
  res.redirect(`${dashboardUrl}/shops?connected=${encodeURIComponent(dbShop.name)}`);
});

// POST /shopify/register-webhook (geriye donuk uyumluluk)
router.post('/register-webhook', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopDomain, accessToken } = req.body as { shopDomain?: string; accessToken?: string };
  if (!shopDomain || !accessToken) { res.status(400).json({ error: 'shopDomain ve accessToken zorunlu' }); return; }

  let shopName = shopDomain;
  try {
    const shopRes = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const shopData = await shopRes.json() as { shop?: { name: string } };
    if (shopData.shop?.name) shopName = shopData.shop.name;
  } catch { res.status(401).json({ error: 'Shop dogrulanamadi.' }); return; }

  const shop = await prisma.shop.upsert({
    where: { shopDomain },
    update: { accessToken, name: shopName },
    create: { shopDomain, accessToken, name: shopName, userId: req.userId! },
  });

  const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:3001';
  await registerWebhooks(shopDomain, accessToken, baseUrl);

  res.json({ message: `${shopName} magaza baglandi`, shop: { id: shop.id, name: shop.name, shopDomain: shop.shopDomain } });
});

// GET /shopify/webhooks
router.get('/webhooks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopDomain } = req.query as { shopDomain?: string };
  if (!shopDomain) { res.status(400).json({ error: 'shopDomain zorunlu' }); return; }

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop?.accessToken) { res.status(404).json({ error: 'Shop bulunamadi veya bagli degil' }); return; }

  try {
    const whRes = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`, {
      headers: { 'X-Shopify-Access-Token': shop.accessToken },
    });
    const data = await whRes.json() as { webhooks: unknown[] };
    res.json({ webhooks: data.webhooks });
  } catch (err) {
    console.error('[shopify] Webhook listesi alinamadi:', err);
    res.status(500).json({ error: 'Webhook listesi alinamadi' });
  }
});

export default router;
