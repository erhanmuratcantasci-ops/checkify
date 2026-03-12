import { Router, Response } from 'express';
import { makeSession, shopify } from '../lib/shopify';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// GET /shopify/install?shop=mystore.myshopify.com&shopId=123
router.get('/install', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shop, shopId } = req.query as { shop?: string; shopId?: string };
  if (!shop) { res.status(400).json({ error: 'shop parametresi zorunlu' }); return; }

  const shopDomain = shop.endsWith('.myshopify.com') ? shop : `${shop}.myshopify.com`;
  const state = Buffer.from(JSON.stringify({ userId: req.userId, shopId: shopId ?? null })).toString('base64url');
  const redirectUri = `${process.env['BASE_URL']}/shopify/callback`;
  const scopes = 'read_orders,write_orders';
  const apiKey = process.env['SHOPIFY_API_KEY']!;

  const installUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  res.json({ url: installUrl });
});

// GET /shopify/callback
router.get('/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, shop, state, hmac } = req.query as Record<string, string>;
  if (!code || !shop || !state || !hmac) { res.status(400).send('Eksik parametreler'); return; }

  // HMAC dogrula
  const apiSecret = process.env['SHOPIFY_API_SECRET']!;
  const params = Object.entries(req.query as Record<string, string>)
    .filter(([k]) => k !== 'hmac')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const digest = crypto.createHmac('sha256', apiSecret).update(params).digest('hex');
  if (digest !== hmac) { res.status(401).send('HMAC dogrulama basarisiz'); return; }

  // state decode
  let userId: number;
  let shopId: number | null = null;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    userId = decoded.userId;
    shopId = decoded.shopId ? parseInt(decoded.shopId) : null;
  } catch { res.status(400).send('Gecersiz state'); return; }

  // Token exchange
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

  // Shop adi
  let shopName = shopDomain;
  try {
    const shopRes = await fetch(`https://${shopDomain}/admin/api/2025-07/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });
    const shopData = await shopRes.json() as { shop?: { name: string } };
    if (shopData.shop?.name) shopName = shopData.shop.name;
  } catch { /* domain kullan */ }

  // DB kaydet
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

  // Webhook kaydet
  const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:3001';
  try {
    await fetch(`https://${shopDomain}/admin/api/2025-07/webhooks.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ webhook: { topic: 'orders/create', address: `${baseUrl}/webhook/orders/create`, format: 'json' } }),
    });
  } catch { console.warn(`[shopify] Webhook kaydi basarisiz: ${shopDomain}`); }

  const dashboardUrl = process.env['DASHBOARD_URL'] ?? 'https://chekkify.com';
  res.redirect(`${dashboardUrl}/shops?connected=${encodeURIComponent(dbShop.name)}`);
});

// POST /shopify/register-webhook (geriye donuk uyumluluk)
router.post('/register-webhook', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopDomain, accessToken } = req.body as { shopDomain?: string; accessToken?: string };
  if (!shopDomain || !accessToken) { res.status(400).json({ error: 'shopDomain ve accessToken zorunlu' }); return; }

  let shopName = shopDomain;
  try {
    const shopRes = await fetch(`https://${shopDomain}/admin/api/2025-07/shop.json`, {
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
  try {
    await fetch(`https://${shopDomain}/admin/api/2025-07/webhooks.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ webhook: { topic: 'orders/create', address: `${baseUrl}/webhook/orders/create`, format: 'json' } }),
    });
  } catch { console.warn(`[shopify] Webhook zaten mevcut: ${shopDomain}`); }

  res.json({ message: `${shopName} magaza baglandi`, shop: { id: shop.id, name: shop.name, shopDomain: shop.shopDomain } });
});

// GET /shopify/webhooks
router.get('/webhooks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopDomain } = req.query as { shopDomain?: string };
  if (!shopDomain) { res.status(400).json({ error: 'shopDomain zorunlu' }); return; }

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop?.accessToken) { res.status(404).json({ error: 'Shop bulunamadi veya bagli degil' }); return; }

  const client = new shopify.clients.Rest({ session: makeSession(shopDomain, shop.accessToken) });
  const response = await client.get<{ webhooks: unknown[] }>({ path: 'webhooks' });
  res.json({ webhooks: response.body.webhooks });
});

export default router;
