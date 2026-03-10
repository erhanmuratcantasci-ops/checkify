import { shopifyApi, ApiVersion, LogSeverity, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

export { Session };

export const shopify = shopifyApi({
  apiKey: process.env['SHOPIFY_API_KEY'] || '',
  apiSecretKey: process.env['SHOPIFY_API_SECRET'] || '',
  scopes: ['read_orders', 'write_orders'],
  hostName: (process.env['BASE_URL'] || 'http://localhost:3001').replace(/^https?:\/\//, ''),
  apiVersion: ApiVersion.January25,
  isEmbeddedApp: false,
  logger: { level: LogSeverity.Warning },
});

export function makeSession(shopDomain: string, accessToken: string): Session {
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

export async function addTagToOrder(
  shopDomain: string,
  accessToken: string,
  shopifyOrderId: number,
  tag: string
): Promise<void> {
  const client = new shopify.clients.Rest({ session: makeSession(shopDomain, accessToken) });

  // Mevcut tag'leri oku
  const { body } = await client.get<{ order: { tags: string } }>({
    path: `orders/${shopifyOrderId}`,
    query: { fields: 'id,tags' },
  });

  const existingTags = body.order.tags
    ? body.order.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  if (existingTags.includes(tag)) return; // zaten var

  const newTags = [...existingTags, tag].join(', ');

  await client.put({
    path: `orders/${shopifyOrderId}`,
    data: { order: { id: shopifyOrderId, tags: newTags } },
  });

  console.log(`[shopify] Tag eklendi: order #${shopifyOrderId} → "${tag}"`);
}
