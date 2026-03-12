const SHOPIFY_API_VERSION = '2025-07';

export async function addTagToOrder(
  shopDomain: string,
  accessToken: string,
  shopifyOrderId: number,
  tag: string
): Promise<void> {
  const base = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken };

  const getRes = await fetch(`${base}/orders/${shopifyOrderId}.json?fields=id,tags`, { headers });
  const getData = await getRes.json() as { order: { tags: string } };

  const existingTags = getData.order.tags
    ? getData.order.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  if (existingTags.includes(tag)) return;

  const newTags = [...existingTags, tag].join(', ');

  await fetch(`${base}/orders/${shopifyOrderId}.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ order: { id: shopifyOrderId, tags: newTags } }),
  });

  console.log(`[shopify] Tag eklendi: order #${shopifyOrderId} → "${tag}"`);
}
