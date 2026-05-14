/**
 * Sprint 8 CONVERT — Shopify product fetch helper.
 *
 * Resolves product GIDs (gid://shopify/Product/XXX or numeric id) to display
 * payloads (title, image, price, variants) via Shopify Admin REST.
 * V1: in-memory cache, 1h TTL.
 */

import prisma from './prisma';

export interface ProductDetail {
  id: string;
  title: string;
  image: string | null;
  price: number;
  currency: string;
  variantId: string | null;
}

interface CacheEntry {
  data: ProductDetail;
  expiresAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1h

function cacheKey(shopId: number, productId: string, variantId: string | null): string {
  return `${shopId}:${productId}:${variantId ?? ''}`;
}

function normalizeProductId(raw: string): string {
  // Accept "gid://shopify/Product/123" or "123"
  const m = raw.match(/Product\/(\d+)/);
  return m ? m[1]! : raw;
}

function normalizeVariantId(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/ProductVariant\/(\d+)/);
  return m ? m[1]! : raw;
}

interface ShopifyVariant {
  id: number;
  title?: string;
  price?: string;
}

interface ShopifyProduct {
  id: number;
  title?: string;
  image?: { src?: string } | null;
  variants?: ShopifyVariant[];
}

interface ShopifyProductResponse {
  product?: ShopifyProduct;
}

export async function fetchProductDetail(
  shopId: number,
  productId: string,
  variantId: string | null = null,
): Promise<ProductDetail | null> {
  const key = cacheKey(shopId, productId, variantId);
  const hit = CACHE.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { shopDomain: true, accessToken: true },
  });
  if (!shop?.shopDomain || !shop.accessToken) return null;

  const numericProductId = normalizeProductId(productId);
  const numericVariantId = normalizeVariantId(variantId);

  const url = `https://${shop.shopDomain}/admin/api/2024-01/products/${numericProductId}.json`;
  try {
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': shop.accessToken },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ShopifyProductResponse;
    const product = data.product;
    if (!product) return null;

    const variant =
      product.variants?.find((v) => String(v.id) === numericVariantId) ?? product.variants?.[0];
    const detail: ProductDetail = {
      id: String(product.id),
      title: product.title ?? 'Product',
      image: product.image?.src ?? null,
      price: variant?.price ? parseFloat(variant.price) : 0,
      currency: 'TRY',
      variantId: variant ? String(variant.id) : null,
    };
    CACHE.set(key, { data: detail, expiresAt: Date.now() + TTL_MS });
    return detail;
  } catch (err) {
    console.error('[upsell] shopify product fetch failed:', err);
    return null;
  }
}

export function clearProductCache(): void {
  CACHE.clear();
}
