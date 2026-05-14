/**
 * Sprint 9 INTEGRATE — Pixels + Google Sheets API.
 *
 * V1 strategy: configuration lives in process.env (single tenant). The
 * endpoints below expose:
 *   - read-only status (which providers are configured, masked IDs)
 *   - OAuth helpers for Google Sheets (to mint a refresh token Erhan can
 *     paste into env)
 *   - manual sync trigger that re-enqueues recent orders to the worker
 *
 * Create/update/delete endpoints are intentionally stubs in V1 — they
 * respond with the env-variable name the operator must set. V2 (Dalga 3
 * schema-prep) introduces a real IntegrationConfig table and these stubs
 * become full CRUD.
 */

import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { listPixelProviderStatuses } from '../lib/pixelInjection';
import {
  SHEETS_COLUMN_HEADERS,
  buildOAuthAuthUrl,
  exchangeOAuthCode,
  getSheetsStatus,
} from '../lib/sheetsExporter';
import { enqueueSheetsExport } from '../lib/queue';

const router = Router();

router.use(authenticate);

// ── Pixels ────────────────────────────────────────────────────────────────

// GET /integrations/pixels — list configured providers (masked)
router.get('/pixels', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    providers: listPixelProviderStatuses(),
    note: 'V1 single-tenant — set provider env vars to enable. See PR body for full list.',
  });
});

// POST /integrations/pixels — V1 stub (returns env-variable instructions)
router.post('/pixels', async (req: AuthRequest, res: Response): Promise<void> => {
  const { provider } = (req.body ?? {}) as { provider?: string };
  if (!provider || !['meta', 'tiktok', 'google'].includes(provider)) {
    res.status(400).json({ error: 'provider must be one of meta, tiktok, google' });
    return;
  }
  const envVars: Record<string, string[]> = {
    meta: ['META_PIXEL_ID', 'META_PIXEL_ACCESS_TOKEN', 'META_PIXEL_TEST_EVENT_CODE (optional)'],
    tiktok: ['TIKTOK_PIXEL_ID', 'TIKTOK_ACCESS_TOKEN', 'TIKTOK_TEST_EVENT_CODE (optional)'],
    google: ['GOOGLE_ADS_CONVERSION_ID (Sprint 12 stub)'],
  };
  res.status(202).json({
    stub: true,
    message: 'V1 — set the following env variables on the backend, then restart',
    provider,
    envVarsToSet: envVars[provider],
  });
});

// PUT /integrations/pixels/:id — V1 stub
router.put('/pixels/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(202).json({
    stub: true,
    message: 'V1 — update pixel config by editing env vars + restart backend',
  });
});

// DELETE /integrations/pixels/:id — V1 stub
router.delete('/pixels/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(202).json({
    stub: true,
    message: 'V1 — disable pixel by unsetting env vars + restart backend',
  });
});

// ── Sheets ────────────────────────────────────────────────────────────────

// GET /integrations/sheets/auth-url — Google OAuth init URL
router.get('/sheets/auth-url', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const redirectUri =
      (req.query['redirect_uri'] as string) ||
      `${process.env['BASE_URL'] || 'http://localhost:3001'}/integrations/sheets/callback`;
    const url = buildOAuthAuthUrl(redirectUri);
    res.json({ url, redirectUri });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /integrations/sheets/callback — exchange code for refresh token
router.post('/sheets/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, redirectUri } = (req.body ?? {}) as { code?: string; redirectUri?: string };
  if (!code) {
    res.status(400).json({ error: 'code required' });
    return;
  }
  try {
    const tokens = await exchangeOAuthCode(
      code,
      redirectUri || `${process.env['BASE_URL'] || 'http://localhost:3001'}/integrations/sheets/callback`,
    );
    // V1: surface the refresh token to the dashboard so Erhan can paste it
    // into the env. V2 will persist it (encrypted) in IntegrationConfig.
    res.json({
      stub: true,
      message: 'Copy refresh_token into GOOGLE_REFRESH_TOKEN env var, then restart backend',
      refreshToken: tokens.refreshToken,
      accessTokenPreview: tokens.accessToken ? `${tokens.accessToken.slice(0, 12)}…` : null,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /integrations/sheets — status + column schema
router.get('/sheets', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    status: getSheetsStatus(),
    columns: SHEETS_COLUMN_HEADERS,
    note: 'V1 single-tenant — set GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN / GOOGLE_SHEET_ID',
  });
});

// POST /integrations/sheets — V1 stub
router.post('/sheets', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(202).json({
    stub: true,
    message: 'V1 — use /integrations/sheets/auth-url + env vars (GOOGLE_OAUTH_*, GOOGLE_REFRESH_TOKEN, GOOGLE_SHEET_ID)',
  });
});

// PUT /integrations/sheets/:id — V1 stub
router.put('/sheets/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(202).json({ stub: true, message: 'V1 — edit env vars + restart backend' });
});

// DELETE /integrations/sheets/:id — V1 stub
router.delete('/sheets/:id', async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(202).json({ stub: true, message: 'V1 — unset env vars + restart backend' });
});

// POST /integrations/sheets/:id/sync — manually re-enqueue recent orders
router.post('/sheets/:id/sync', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const shops = await prisma.shop.findMany({ where: { userId }, select: { id: true } });
  const shopIds = shops.map((s) => s.id);
  if (shopIds.length === 0) {
    res.status(404).json({ error: 'no shops for user' });
    return;
  }
  const orders = await prisma.order.findMany({
    where: { shopId: { in: shopIds }, createdAt: { gte: since } },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  for (const o of orders) {
    await enqueueSheetsExport(o.id);
  }
  res.json({ enqueued: orders.length, sinceDays: 7 });
});

export default router;
