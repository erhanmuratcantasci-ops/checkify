/**
 * Sprint 9 INTEGRATE — Google Sheets v4 exporter.
 *
 * V1 single-tenant: refresh token + sheet id come from env. The auth client
 * is rebuilt on each call so we always pick up rotated creds. V2 will move
 * this to per-shop IntegrationConfig (Dalga 3 schema-prep).
 *
 * Column schema (12 columns, in order — must match dashboard ColumnMapper):
 *   A order_id        B created_at       C customer_name    D phone
 *   E address (V1: '')  F city (V1: '')  G postal_code (V1: '')
 *   H status          I total            J items_json (V1: '[]')
 *   K fraud_score (Dalga 1 join — null if no FraudScore)
 *   L recovered_from_cart (V1: '')
 */

import { google } from 'googleapis';
import prisma from './prisma';

export const SHEETS_COLUMN_HEADERS = [
  'order_id',
  'created_at',
  'customer_name',
  'phone',
  'address',
  'city',
  'postal_code',
  'status',
  'total',
  'items_json',
  'fraud_score',
  'recovered_from_cart',
] as const;

export type SheetsColumn = (typeof SHEETS_COLUMN_HEADERS)[number];

interface SheetsAuthConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sheetId: string;
}

function getSheetsConfig(): SheetsAuthConfig | null {
  const clientId = process.env['GOOGLE_OAUTH_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_OAUTH_CLIENT_SECRET'];
  const refreshToken = process.env['GOOGLE_REFRESH_TOKEN'];
  const sheetId = process.env['GOOGLE_SHEET_ID'];
  if (!clientId || !clientSecret || !refreshToken || !sheetId) return null;
  return { clientId, clientSecret, refreshToken, sheetId };
}

function buildSheetsClient(cfg: SheetsAuthConfig) {
  const oauth2 = new google.auth.OAuth2(cfg.clientId, cfg.clientSecret);
  oauth2.setCredentials({ refresh_token: cfg.refreshToken });
  return google.sheets({ version: 'v4', auth: oauth2 });
}

/**
 * Append a row of cells to the given range. Used by the worker per order
 * and by manual sync endpoints. `range` should include the tab name —
 * e.g. 'Orders!A:L'.
 */
export async function appendRow(sheetId: string, range: string, values: (string | number)[]): Promise<void> {
  const cfg = getSheetsConfig();
  if (!cfg) throw new Error('Sheets not configured — set GOOGLE_OAUTH_CLIENT_ID/SECRET + GOOGLE_REFRESH_TOKEN + GOOGLE_SHEET_ID');
  const sheets = buildSheetsClient(cfg);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

/**
 * Export one order. Idempotency is not enforced at the sheet level — the
 * worker should rely on BullMQ jobId (`sheets:<orderId>`) to dedupe.
 */
export async function exportOrderRow(orderId: number): Promise<void> {
  const cfg = getSheetsConfig();
  if (!cfg) {
    console.log(`[sheets] order=${orderId} skipped — config missing`);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { fraudScore: true },
  });
  if (!order) {
    console.warn(`[sheets] order=${orderId} not found`);
    return;
  }

  const row: (string | number)[] = [
    order.id,
    order.createdAt.toISOString(),
    order.customerName,
    order.customerPhone,
    '', // address — populated in V2 when checkout form fields land on Order
    '', // city
    '', // postal_code
    order.status,
    order.total,
    '[]', // items_json
    order.fraudScore?.score ?? '',
    '', // recovered_from_cart
  ];

  await appendRow(cfg.sheetId, 'Orders!A:L', row);
  console.log(`[sheets] appended order=${orderId} total=${order.total}`);
}

export interface SheetsStatus {
  enabled: boolean;
  sheetIdMasked: string | null;
  hasRefreshToken: boolean;
}

export function getSheetsStatus(): SheetsStatus {
  const cfg = getSheetsConfig();
  const masked = cfg?.sheetId
    ? `${cfg.sheetId.slice(0, 6)}...${cfg.sheetId.slice(-4)}`
    : process.env['GOOGLE_SHEET_ID']
      ? `${(process.env['GOOGLE_SHEET_ID'] as string).slice(0, 6)}...`
      : null;
  return {
    enabled: !!cfg,
    sheetIdMasked: masked,
    hasRefreshToken: !!process.env['GOOGLE_REFRESH_TOKEN'],
  };
}

/**
 * Generate the OAuth consent URL for the Sheets scope. V1 user flow:
 *   1. UI hits GET /integrations/sheets/auth-url
 *   2. user grants consent, Google redirects back with `code`
 *   3. UI posts code → POST /integrations/sheets/callback
 *   4. backend exchanges code for refresh_token, logs it for Erhan to set in env
 */
export function buildOAuthAuthUrl(redirectUri: string): string {
  const clientId = process.env['GOOGLE_OAUTH_CLIENT_ID'];
  if (!clientId) throw new Error('GOOGLE_OAUTH_CLIENT_ID not set');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeOAuthCode(code: string, redirectUri: string): Promise<{ refreshToken: string | null; accessToken: string | null }> {
  const clientId = process.env['GOOGLE_OAUTH_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_OAUTH_CLIENT_SECRET'];
  if (!clientId || !clientSecret) throw new Error('GOOGLE_OAUTH_CLIENT_ID / SECRET not set');

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return {
    refreshToken: tokens.refresh_token ?? null,
    accessToken: tokens.access_token ?? null,
  };
}
