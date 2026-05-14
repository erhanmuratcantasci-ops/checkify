/**
 * Sprint 9 INTEGRATE — server-side pixel injection.
 *
 * Fires Conversions API events to Meta + TikTok (and stubs Google Ads offline
 * conversions for Sprint 12). V1 is single-tenant: pixel ID + access token are
 * read from process.env, so all shops on this instance share one pixel.
 *
 * V2 (Dalga 3 schema-prep) should introduce an IntegrationConfig table and
 * scope these calls per shop.
 *
 * PII rules: Meta and TikTok require SHA-256 hashed email + phone (lowercase,
 * trimmed). Never send raw PII downstream — hashPii() is the only entry point.
 */

import crypto from 'crypto';

export interface PixelOrderContext {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  total: number;
  shopId: number;
}

function hashPii(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase();
  if (!normalised) return undefined;
  return crypto.createHash('sha256').update(normalised).digest('hex');
}

function getMetaConfig(): { pixelId: string; accessToken: string; testEventCode?: string } | null {
  const pixelId = process.env['META_PIXEL_ID'];
  const accessToken = process.env['META_PIXEL_ACCESS_TOKEN'];
  if (!pixelId || !accessToken) return null;
  return {
    pixelId,
    accessToken,
    testEventCode: process.env['META_PIXEL_TEST_EVENT_CODE'] || undefined,
  };
}

function getTikTokConfig(): { pixelId: string; accessToken: string; testEventCode?: string } | null {
  const pixelId = process.env['TIKTOK_PIXEL_ID'];
  const accessToken = process.env['TIKTOK_ACCESS_TOKEN'];
  if (!pixelId || !accessToken) return null;
  return {
    pixelId,
    accessToken,
    testEventCode: process.env['TIKTOK_TEST_EVENT_CODE'] || undefined,
  };
}

async function fireMetaPurchase(order: PixelOrderContext): Promise<void> {
  const cfg = getMetaConfig();
  if (!cfg) {
    console.log('[pixel:meta] skipped — META_PIXEL_ID / META_PIXEL_ACCESS_TOKEN not set');
    return;
  }

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: `order_${order.id}`,
        action_source: 'website',
        user_data: {
          em: hashPii(order.customerEmail) ? [hashPii(order.customerEmail)] : undefined,
          ph: hashPii(order.customerPhone) ? [hashPii(order.customerPhone)] : undefined,
          fn: hashPii(order.customerName.split(' ')[0]) ? [hashPii(order.customerName.split(' ')[0])] : undefined,
        },
        custom_data: {
          currency: 'TRY',
          value: order.total,
          order_id: String(order.id),
        },
      },
    ],
    test_event_code: cfg.testEventCode,
    access_token: cfg.accessToken,
  };

  const url = `https://graph.facebook.com/v18.0/${cfg.pixelId}/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Meta CAPI ${res.status}: ${text.slice(0, 200)}`);
  }
  console.log(`[pixel:meta] Purchase order=${order.id} value=${order.total}`);
}

async function fireTikTokPurchase(order: PixelOrderContext): Promise<void> {
  const cfg = getTikTokConfig();
  if (!cfg) {
    console.log('[pixel:tiktok] skipped — TIKTOK_PIXEL_ID / TIKTOK_ACCESS_TOKEN not set');
    return;
  }

  const body = {
    pixel_code: cfg.pixelId,
    event: 'CompletePayment',
    event_id: `order_${order.id}`,
    timestamp: new Date().toISOString(),
    test_event_code: cfg.testEventCode,
    context: {
      user: {
        email: hashPii(order.customerEmail),
        phone_number: hashPii(order.customerPhone),
      },
    },
    properties: {
      currency: 'TRY',
      value: order.total,
      content_id: String(order.id),
      content_type: 'product',
    },
  };

  const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': cfg.accessToken,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`TikTok Events API ${res.status}: ${text.slice(0, 200)}`);
  }
  console.log(`[pixel:tiktok] CompletePayment order=${order.id} value=${order.total}`);
}

async function fireGoogleAdsPurchase(order: PixelOrderContext): Promise<void> {
  // V1 STUB — Google Ads offline conversion upload deferred to Sprint 12.
  // Requires OAuth + developer token + customer ID; needs proper
  // IntegrationConfig table to scope per-shop credentials.
  const enabled = process.env['GOOGLE_ADS_CONVERSION_ID'];
  if (!enabled) {
    console.log('[pixel:google] skipped — Sprint 12 stub (no GOOGLE_ADS_CONVERSION_ID)');
    return;
  }
  console.log(`[pixel:google] stub — order=${order.id} (Sprint 12 will wire this)`);
}

/**
 * Fire-and-forget — caller should not await individual providers. Each
 * provider is wrapped so one failure does not block the others. Errors are
 * logged but never thrown; webhooks must stay responsive.
 */
export async function firePixelEvents(order: PixelOrderContext): Promise<void> {
  const results = await Promise.allSettled([
    fireMetaPurchase(order),
    fireTikTokPurchase(order),
    fireGoogleAdsPurchase(order),
  ]);
  for (const r of results) {
    if (r.status === 'rejected') {
      console.error('[pixel] provider failed:', r.reason);
    }
  }
}

/**
 * Public introspection — UI lists which providers are configured. Token
 * values are never returned, only a boolean + masked pixel id.
 */
export interface PixelProviderStatus {
  provider: 'meta' | 'tiktok' | 'google';
  enabled: boolean;
  pixelIdMasked: string | null;
  testMode: boolean;
}

function maskId(id: string | undefined): string | null {
  if (!id) return null;
  if (id.length <= 4) return '****';
  return `${id.slice(0, 2)}****${id.slice(-2)}`;
}

export function listPixelProviderStatuses(): PixelProviderStatus[] {
  const meta = getMetaConfig();
  const tt = getTikTokConfig();
  return [
    {
      provider: 'meta',
      enabled: !!meta,
      pixelIdMasked: maskId(meta?.pixelId),
      testMode: !!meta?.testEventCode,
    },
    {
      provider: 'tiktok',
      enabled: !!tt,
      pixelIdMasked: maskId(tt?.pixelId),
      testMode: !!tt?.testEventCode,
    },
    {
      provider: 'google',
      enabled: false,
      pixelIdMasked: maskId(process.env['GOOGLE_ADS_CONVERSION_ID']),
      testMode: false,
    },
  ];
}
