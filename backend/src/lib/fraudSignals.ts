import prisma from './prisma';
import { isDisposableEmail } from './disposableEmails';

export interface Signal {
  key: string;
  weight: number;
  triggered: boolean;
  detail?: Record<string, unknown>;
}

interface OrderWithShop {
  id: number;
  shopId: number;
  customerName: string;
  customerPhone: string;
  total: number;
  ipAddress: string | null;
  shop: { id: number; phone: string | null };
}

// IP TR olmayan + shop TR-only → +0.3
export async function ipCountryMismatch(order: OrderWithShop): Promise<Signal> {
  const ip = order.ipAddress;
  if (!ip) return { key: 'ip_country_mismatch', weight: 0.3, triggered: false };
  // Lightweight TR IP detection — known TR blocks won't help without geo API.
  // V1: flag only obvious non-IPv4 / private / IPv6 anomalies.
  const isObviousLocal = ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.');
  return {
    key: 'ip_country_mismatch',
    weight: 0.3,
    triggered: isObviousLocal,
    detail: { ip, reason: isObviousLocal ? 'private/local IP' : 'public' },
  };
}

// TR telefon formatı: +90 5XX XXX XX XX (10 hane sonrası, 5 ile başlamalı)
const TR_PHONE_RE = /^(\+?90)?[\s-]?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export function phoneInvalidPattern(phone: string): Signal {
  const stripped = phone.replace(/[\s\-()]/g, '');
  const valid = TR_PHONE_RE.test(stripped);
  return {
    key: 'phone_invalid_pattern',
    weight: 0.25,
    triggered: !valid,
    detail: { phone, valid },
  };
}

// City / postal code lookup — V1 basit map (Istanbul 34xxx, Ankara 06xxx, etc.)
const CITY_POSTAL_PREFIX: Record<string, string[]> = {
  istanbul: ['34'],
  ankara: ['06'],
  izmir: ['35'],
  bursa: ['16'],
  antalya: ['07'],
};

export function postalCodeMismatch(city: string | null, postal: string | null): Signal {
  if (!city || !postal) return { key: 'postal_code_mismatch', weight: 0.2, triggered: false };
  const normalized = city.toLocaleLowerCase('tr-TR').trim();
  const prefixes = CITY_POSTAL_PREFIX[normalized];
  if (!prefixes) return { key: 'postal_code_mismatch', weight: 0.2, triggered: false }; // unknown city, skip
  const match = prefixes.some((p) => postal.startsWith(p));
  return {
    key: 'postal_code_mismatch',
    weight: 0.2,
    triggered: !match,
    detail: { city: normalized, postal, expectedPrefix: prefixes },
  };
}

// Disposable email — re-uses backend/src/lib/disposableEmails.ts
export function disposableEmailDomain(email: string | null): Signal {
  if (!email) return { key: 'disposable_email_domain', weight: 0.15, triggered: false };
  const triggered = isDisposableEmail(email);
  return {
    key: 'disposable_email_domain',
    weight: 0.15,
    triggered,
    detail: { email },
  };
}

// Shop avg 3x üstü → +0.1
export async function orderValueOutlier(order: OrderWithShop): Promise<Signal> {
  const agg = await prisma.order.aggregate({
    where: { shopId: order.shopId, id: { not: order.id } },
    _avg: { total: true },
  });
  const avg = agg._avg.total ?? 0;
  if (avg <= 0) return { key: 'order_value_outlier', weight: 0.1, triggered: false };
  const ratio = order.total / avg;
  return {
    key: 'order_value_outlier',
    weight: 0.1,
    triggered: ratio >= 3,
    detail: { orderTotal: order.total, shopAvg: avg, ratio: Number(ratio.toFixed(2)) },
  };
}

// Aynı telefondan 30 günde iptal sayısı >=3 → +0.4
export async function repeatCancellationPhone(phone: string, shopId: number): Promise<Signal> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const count = await prisma.order.count({
    where: {
      shopId,
      customerPhone: phone,
      status: 'CANCELLED',
      createdAt: { gte: since },
    },
  });
  return {
    key: 'repeat_cancellation_phone',
    weight: 0.4,
    triggered: count >= 3,
    detail: { phone, shopId, cancellations30d: count },
  };
}

// Name veya address eksik → +0.2
export function emptyAddressOrName(order: OrderWithShop, address: string | null): Signal {
  const empty = !order.customerName?.trim() || !address?.trim();
  return {
    key: 'empty_address_or_name',
    weight: 0.2,
    triggered: empty,
    detail: { nameLen: order.customerName?.length ?? 0, addressLen: address?.length ?? 0 },
  };
}
