import { Router, Request, Response } from 'express';
import { shopify, Session } from '../lib/shopify';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

function makeSession(shopDomain: string, accessToken: string): Session {
  const session = new Session({
    id: shopDomain,
    shop: shopDomain,
    state: '',
    isOnline: false,
  });
  session.accessToken = accessToken;
  session.scope = 'read_orders,write_orders';
  return session;
}

// POST /shopify/register-webhook
// Body: { shopDomain: "mystore.myshopify.com", accessToken: "shpat_..." }
router.post('/register-webhook', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopDomain, accessToken } = req.body as {
    shopDomain?: string;
    accessToken?: string;
  };

  if (!shopDomain || !accessToken) {
    res.status(400).json({ error: 'shopDomain ve accessToken zorunlu' });
    return;
  }

  // Shop'u doğrula: Shopify API'den shop bilgisi çek
  let shopInfo: { name: string; email: string };
  try {
    const client = new shopify.clients.Rest({ session: makeSession(shopDomain, accessToken) });
    const response = await client.get<{ shop: { name: string; email: string } }>({ path: 'shop' });

    shopInfo = response.body.shop;
  } catch {
    res.status(401).json({ error: 'Shop doğrulanamadı. shopDomain veya accessToken hatalı.' });
    return;
  }

  // Shop'u DB'ye kaydet veya güncelle
  const shop = await prisma.shop.upsert({
    where: { shopDomain },
    update: { accessToken, name: shopInfo.name },
    create: {
      shopDomain,
      accessToken,
      name: shopInfo.name,
      userId: req.userId!,
    },
  });

  // Webhook kaydet
  const baseUrl = process.env['BASE_URL'] || 'http://localhost:3001';
  const webhookUrl = `${baseUrl}/webhook/orders/create`;

  try {
    const client = new shopify.clients.Rest({ session: makeSession(shopDomain, accessToken) });

    await client.post({
      path: 'webhooks',
      data: {
        webhook: {
          topic: 'orders/create',
          address: webhookUrl,
          format: 'json',
        },
      },
    });
  } catch {
    // Webhook zaten kayıtlı olabilir — kritik hata değil
    console.warn(`[shopify] Webhook kaydı başarısız veya zaten mevcut: ${shopDomain}`);
  }

  res.json({
    message: `${shopInfo.name} mağazası bağlandı ve webhook kaydedildi`,
    shop: { id: shop.id, name: shop.name, shopDomain: shop.shopDomain },
  });
});

// GET /shopify/webhooks
// Kayıtlı webhook'ları listele
router.get('/webhooks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopDomain } = req.query as { shopDomain?: string };

  if (!shopDomain) {
    res.status(400).json({ error: 'shopDomain zorunlu' });
    return;
  }

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop?.accessToken) {
    res.status(404).json({ error: 'Shop bulunamadı veya bağlı değil' });
    return;
  }

  const client = new shopify.clients.Rest({ session: makeSession(shopDomain, shop.accessToken) });

  const response = await client.get<{ webhooks: unknown[] }>({ path: 'webhooks' });
  res.json({ webhooks: response.body.webhooks });
});

export default router;
