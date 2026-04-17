export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

export interface PlanConfig {
  price: number;
  yearlyPrice: number;
  shops: number; // -1 = unlimited
  smsCreditsMonthly: number;
  features: string[];
  label: string;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    price: 0,
    yearlyPrice: 0,
    shops: 1,
    smsCreditsMonthly: 50,
    features: ['basic_sms'],
    label: 'Ücretsiz',
  },
  STARTER: {
    price: 99,
    yearlyPrice: 79,
    shops: 3,
    smsCreditsMonthly: 300,
    features: ['basic_sms', 'otp', 'pdf_invoice', 'rate_limit_blocking'],
    label: 'Starter',
  },
  PRO: {
    price: 249,
    yearlyPrice: 199,
    shops: 10,
    smsCreditsMonthly: 1000,
    features: ['basic_sms', 'otp', 'pdf_invoice', 'whatsapp', 'rto', 'blocklist', 'postal_code', 'rate_limit_blocking', 'advanced_blocking'],
    label: 'Pro',
  },
  BUSINESS: {
    price: 499,
    yearlyPrice: 399,
    shops: -1,
    smsCreditsMonthly: 3000,
    features: ['basic_sms', 'otp', 'pdf_invoice', 'whatsapp', 'rto', 'blocklist', 'postal_code', 'rate_limit_blocking', 'advanced_blocking', 'priority_support'],
    label: 'Business',
  },
};

export function hasFeature(plan: PlanType, feature: string): boolean {
  return PLANS[plan].features.includes(feature);
}

export function getShopLimit(plan: PlanType): number {
  return PLANS[plan].shops;
}

export function isShopLimitReached(plan: PlanType, currentShopCount: number): boolean {
  const limit = getShopLimit(plan);
  if (limit === -1) return false;
  return currentShopCount >= limit;
}
