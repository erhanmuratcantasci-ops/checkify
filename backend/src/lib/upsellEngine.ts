/**
 * Sprint 8 CONVERT — upsell rule engine.
 *
 * V1: deterministic, priority-DESC pick of first matching active offer per shop +
 * trigger type. A/B testing + multi-offer chain → V2 (Sprint 11.5).
 */

import prisma from './prisma';
import { fetchProductDetail, ProductDetail } from './shopifyProductFetch';

export type TriggerType = 'pre_purchase' | 'post_purchase' | 'thank_you';
export type DiscountType = 'percentage' | 'fixed';
export type UpsellEventType = 'shown' | 'accepted' | 'declined' | 'converted';

export interface UpsellRenderPayload {
  offerId: string;
  triggerType: TriggerType;
  product: ProductDetail;
  originalPrice: number;
  discountedPrice: number;
  discount: number | null;
  discountType: DiscountType | null;
}

export function applyDiscount(
  price: number,
  discount: number | null,
  discountType: DiscountType | null,
): number {
  if (!discount || !discountType) return price;
  if (discountType === 'percentage') {
    return Math.max(0, price - (price * discount) / 100);
  }
  return Math.max(0, price - discount);
}

export async function findEligibleOffer(
  shopId: number,
  triggerType: TriggerType,
): Promise<UpsellRenderPayload | null> {
  const offers = await prisma.upsellOffer.findMany({
    where: { shopId, triggerType, isActive: true },
    orderBy: { priority: 'desc' },
    take: 1,
  });
  const offer = offers[0];
  if (!offer) return null;

  const product = await fetchProductDetail(shopId, offer.productId, offer.variantId);
  if (!product) return null;

  const originalPrice = product.price;
  const discounted = applyDiscount(
    originalPrice,
    offer.discount,
    (offer.discountType as DiscountType | null) ?? null,
  );

  return {
    offerId: offer.id,
    triggerType,
    product,
    originalPrice,
    discountedPrice: discounted,
    discount: offer.discount,
    discountType: (offer.discountType as DiscountType | null) ?? null,
  };
}

export async function recordEvent(
  offerId: string,
  eventType: UpsellEventType,
  orderId: number | null = null,
  revenue: number | null = null,
): Promise<void> {
  await prisma.upsellEvent.create({
    data: { upsellOfferId: offerId, eventType, orderId, revenue },
  });
}

export interface OfferStats {
  shown: number;
  accepted: number;
  declined: number;
  converted: number;
  totalRevenue: number;
  conversionRate: number; // accepted / shown
}

export async function getOfferStats(offerId: string): Promise<OfferStats> {
  const events = await prisma.upsellEvent.findMany({
    where: { upsellOfferId: offerId },
    select: { eventType: true, revenue: true },
  });
  let shown = 0, accepted = 0, declined = 0, converted = 0, totalRevenue = 0;
  for (const e of events) {
    if (e.eventType === 'shown') shown++;
    else if (e.eventType === 'accepted') accepted++;
    else if (e.eventType === 'declined') declined++;
    else if (e.eventType === 'converted') {
      converted++;
      totalRevenue += e.revenue ?? 0;
    }
  }
  const conversionRate = shown > 0 ? accepted / shown : 0;
  return { shown, accepted, declined, converted, totalRevenue, conversionRate };
}
