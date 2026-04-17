/**
 * Blocking Rules API — gelişmiş engelleme kuralları ve bloklama istatistikleri.
 *
 * Endpoints (hepsi authenticate ister; shopId query/body ile gelir, router
 * her istekte shop sahipliğini doğrular):
 *
 *   GET    /blocking/rules?shopId=X           — kuralları listele
 *   POST   /blocking/rules                    — yeni kural (plan gated: advanced_blocking veya rate_limit_blocking, ruleType'a göre)
 *   PUT    /blocking/rules/:id                — kuralı güncelle (plan gated, aynı mantık)
 *   DELETE /blocking/rules/:id                — kuralı sil
 *   POST   /blocking/rules/:id/toggle         — aktif/pasif çevir
 *   GET    /blocking/blocked-orders?shopId=X  — bloklanan siparişler (filtre + sayfalama)
 *   GET    /blocking/stats?shopId=X&days=30   — bloklama istatistikleri
 *   POST   /blocking/test                     — verilen sipariş datasını kurallara karşı test et (kayıt bırakmaz)
 */

import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { BlockingRuleType } from '../../generated/prisma';
import { hasFeature, PlanType } from '../lib/plans';
import * as service from '../lib/blockingService';

const router = Router();

const ADVANCED_TYPES: BlockingRuleType[] = [
  'IP_ADDRESS',
  'IP_RANGE',
  'PHONE_PATTERN',
  'EMAIL_DOMAIN',
  'CUSTOMER_NAME',
];
const RATE_LIMIT_TYPES: BlockingRuleType[] = ['MAX_ORDERS_PER_PHONE', 'MAX_ORDERS_PER_IP'];

function isValidRuleType(v: unknown): v is BlockingRuleType {
  return typeof v === 'string' && Object.values(BlockingRuleType).includes(v as BlockingRuleType);
}

// Belirli ruleType için gerekli feature'ı döner — plan gating için
function requiredFeatureForRuleType(ruleType: BlockingRuleType): 'advanced_blocking' | 'rate_limit_blocking' | null {
  if (ADVANCED_TYPES.includes(ruleType)) return 'advanced_blocking';
  if (RATE_LIMIT_TYPES.includes(ruleType)) return 'rate_limit_blocking';
  return null;
}

async function assertShopOwnership(userId: number, shopId: number): Promise<boolean> {
  const shop = await prisma.shop.findFirst({ where: { id: shopId, userId }, select: { id: true } });
  return !!shop;
}

async function getUserPlan(userId: number): Promise<PlanType | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return user ? (user.plan as PlanType) : null;
}

// GET /blocking/rules?shopId=X
router.get('/rules', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.query['shopId'] as string);
  if (!Number.isFinite(shopId)) { res.status(400).json({ error: 'shopId gerekli' }); return; }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  const rules = await service.listRules(shopId);
  res.json({ rules });
});

// POST /blocking/rules
router.post('/rules', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopId, ruleType, value, reason, isActive } = req.body as {
    shopId?: number;
    ruleType?: string;
    value?: string;
    reason?: string | null;
    isActive?: boolean;
  };

  if (typeof shopId !== 'number' || !Number.isFinite(shopId)) {
    res.status(400).json({ error: 'shopId gerekli' }); return;
  }
  if (!isValidRuleType(ruleType)) {
    res.status(400).json({ error: `Geçersiz ruleType. Geçerli değerler: ${Object.values(BlockingRuleType).join(', ')}` });
    return;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    res.status(400).json({ error: 'value gerekli' }); return;
  }
  if (RATE_LIMIT_TYPES.includes(ruleType)) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) {
      res.status(400).json({ error: 'Rate limit kuralı için value pozitif tamsayı olmalı' }); return;
    }
  }
  if (ruleType === 'PHONE_PATTERN') {
    try { new RegExp(value); } catch { res.status(400).json({ error: 'Geçersiz regex deseni' }); return; }
  }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  const feature = requiredFeatureForRuleType(ruleType);
  if (feature) {
    const plan = await getUserPlan(req.userId!);
    if (!plan || !hasFeature(plan, feature)) {
      res.status(403).json({
        error: 'Bu kural türü planınızda mevcut değil',
        upgrade: true,
        requiredFeature: feature,
      });
      return;
    }
  }

  const rule = await service.createRule(shopId, {
    ruleType,
    value: value.trim(),
    reason: reason ?? null,
    isActive: isActive ?? true,
  });

  res.status(201).json({ rule });
});

// PUT /blocking/rules/:id
router.put('/rules/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  if (!Number.isFinite(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }

  const { shopId, ruleType, value, reason, isActive } = req.body as {
    shopId?: number;
    ruleType?: string;
    value?: string;
    reason?: string | null;
    isActive?: boolean;
  };

  if (typeof shopId !== 'number' || !Number.isFinite(shopId)) {
    res.status(400).json({ error: 'shopId gerekli' }); return;
  }

  if (ruleType !== undefined && !isValidRuleType(ruleType)) {
    res.status(400).json({ error: `Geçersiz ruleType` }); return;
  }
  if (ruleType !== undefined && RATE_LIMIT_TYPES.includes(ruleType) && value !== undefined) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) {
      res.status(400).json({ error: 'Rate limit kuralı için value pozitif tamsayı olmalı' }); return;
    }
  }
  if (ruleType === 'PHONE_PATTERN' && value !== undefined) {
    try { new RegExp(value); } catch { res.status(400).json({ error: 'Geçersiz regex deseni' }); return; }
  }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  if (ruleType !== undefined) {
    const feature = requiredFeatureForRuleType(ruleType);
    if (feature) {
      const plan = await getUserPlan(req.userId!);
      if (!plan || !hasFeature(plan, feature)) {
        res.status(403).json({ error: 'Bu kural türü planınızda mevcut değil', upgrade: true, requiredFeature: feature });
        return;
      }
    }
  }

  const rule = await service.updateRule(id, shopId, { ruleType, value, reason, isActive });
  if (!rule) { res.status(404).json({ error: 'Kural bulunamadı' }); return; }
  res.json({ rule });
});

// DELETE /blocking/rules/:id?shopId=X
router.delete('/rules/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const shopId = parseInt(req.query['shopId'] as string);
  if (!Number.isFinite(id) || !Number.isFinite(shopId)) { res.status(400).json({ error: 'Geçersiz parametre' }); return; }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  const ok = await service.deleteRule(id, shopId);
  if (!ok) { res.status(404).json({ error: 'Kural bulunamadı' }); return; }
  res.json({ success: true });
});

// POST /blocking/rules/:id/toggle
router.post('/rules/:id/toggle', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  const { shopId } = req.body as { shopId?: number };
  if (!Number.isFinite(id) || typeof shopId !== 'number') { res.status(400).json({ error: 'Geçersiz parametre' }); return; }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  const rule = await service.toggleRule(id, shopId);
  if (!rule) { res.status(404).json({ error: 'Kural bulunamadı' }); return; }
  res.json({ rule });
});

// GET /blocking/blocked-orders?shopId=X&from=&to=&page=&limit=
router.get('/blocked-orders', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.query['shopId'] as string);
  if (!Number.isFinite(shopId)) { res.status(400).json({ error: 'shopId gerekli' }); return; }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  const from = req.query['from'] ? new Date(req.query['from'] as string) : undefined;
  const to = req.query['to'] ? new Date(req.query['to'] as string) : undefined;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;

  const result = await service.listBlockedOrders(shopId, { from, to, page, limit });
  res.json(result);
});

// GET /blocking/stats?shopId=X&days=30
router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.query['shopId'] as string);
  if (!Number.isFinite(shopId)) { res.status(400).json({ error: 'shopId gerekli' }); return; }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  const days = Math.min(365, Math.max(1, parseInt(req.query['days'] as string) || 30));
  const stats = await service.getBlockingStats(shopId, days);
  res.json(stats);
});

// GET /blocking/settings?shopId=X
router.get('/settings', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.query['shopId'] as string);
  if (!Number.isFinite(shopId)) { res.status(400).json({ error: 'shopId gerekli' }); return; }

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, userId: req.userId },
    select: { advancedBlockingEnabled: true, maxOrdersPerPhone30d: true, maxOrdersPerIp30d: true },
  });
  if (!shop) { res.status(404).json({ error: 'Shop bulunamadı' }); return; }

  res.json({
    advancedBlockingEnabled: shop.advancedBlockingEnabled,
    maxOrdersPerPhone30d: shop.maxOrdersPerPhone30d,
    maxOrdersPerIp30d: shop.maxOrdersPerIp30d,
  });
});

// PUT /blocking/settings — patch semantic (sadece gönderilen alanlar güncellenir)
router.put('/settings', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopId, advancedBlockingEnabled, maxOrdersPerPhone30d, maxOrdersPerIp30d } = req.body as {
    shopId?: number;
    advancedBlockingEnabled?: boolean;
    maxOrdersPerPhone30d?: number | null;
    maxOrdersPerIp30d?: number | null;
  };

  if (typeof shopId !== 'number' || !Number.isFinite(shopId)) {
    res.status(400).json({ error: 'shopId gerekli' }); return;
  }
  if (advancedBlockingEnabled !== undefined && typeof advancedBlockingEnabled !== 'boolean') {
    res.status(400).json({ error: 'advancedBlockingEnabled boolean olmalı' }); return;
  }
  for (const [field, v] of [
    ['maxOrdersPerPhone30d', maxOrdersPerPhone30d] as const,
    ['maxOrdersPerIp30d', maxOrdersPerIp30d] as const,
  ]) {
    if (v === undefined) continue;
    if (v === null) continue;
    if (!Number.isInteger(v) || v < 1 || v > 1000) {
      res.status(400).json({ error: `${field} null veya 1-1000 arası tamsayı olmalı` }); return;
    }
  }

  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  const data: {
    advancedBlockingEnabled?: boolean;
    maxOrdersPerPhone30d?: number | null;
    maxOrdersPerIp30d?: number | null;
  } = {};
  if (advancedBlockingEnabled !== undefined) data.advancedBlockingEnabled = advancedBlockingEnabled;
  if (maxOrdersPerPhone30d !== undefined) data.maxOrdersPerPhone30d = maxOrdersPerPhone30d;
  if (maxOrdersPerIp30d !== undefined) data.maxOrdersPerIp30d = maxOrdersPerIp30d;

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data,
    select: { advancedBlockingEnabled: true, maxOrdersPerPhone30d: true, maxOrdersPerIp30d: true },
  });

  res.json({ settings: updated });
});

// POST /blocking/test — kurallara karşı dry-run (kayıt bırakmaz)
router.post('/test', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopId, customerName, phoneNumber, ipAddress, postalCode, email } = req.body as {
    shopId?: number;
    customerName?: string;
    phoneNumber?: string;
    ipAddress?: string;
    postalCode?: string;
    email?: string;
  };

  if (typeof shopId !== 'number' || !Number.isFinite(shopId)) {
    res.status(400).json({ error: 'shopId gerekli' }); return;
  }
  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' }); return;
  }

  // Dry-run: checkOrderForBlocks kayıt bırakır; o yüzden test için kuralları elle değerlendirmek lazım.
  // Minimum pratik çözüm: kuralları yükle ve aynı sırayla değerlendir ama yazma.
  const rules = await prisma.blockingRule.findMany({ where: { shopId, isActive: true } });

  const tests: { ruleType: string; ruleId?: number; matched: boolean; value?: string }[] = [];

  // Legacy
  if (phoneNumber) {
    const lp = await prisma.blockedPhone.findFirst({ where: { shopId, phone: phoneNumber } });
    if (lp) tests.push({ ruleType: 'BlockedPhone', ruleId: lp.id, matched: true, value: lp.phone });
  }
  if (postalCode) {
    const lpc = await prisma.blockedPostalCode.findFirst({ where: { shopId, postalCode: postalCode.trim() } });
    if (lpc) tests.push({ ruleType: 'BlockedPostalCode', ruleId: lpc.id, matched: true, value: lpc.postalCode });
  }
  for (const r of rules) {
    let matched = false;
    try {
      if (r.ruleType === 'IP_ADDRESS' && ipAddress) matched = r.value === ipAddress;
      else if (r.ruleType === 'PHONE_PATTERN' && phoneNumber) matched = new RegExp(r.value).test(phoneNumber);
      else if (r.ruleType === 'EMAIL_DOMAIN' && email) matched = email.split('@')[1]?.toLowerCase() === r.value.toLowerCase();
      else if (r.ruleType === 'CUSTOMER_NAME' && customerName) matched = customerName.toLowerCase().includes(r.value.toLowerCase());
    } catch { matched = false; }
    if (matched) tests.push({ ruleType: `BlockingRule:${r.ruleType}`, ruleId: r.id, matched: true, value: r.value });
  }

  const firstMatch = tests[0];
  res.json({
    wouldBlock: !!firstMatch,
    firstMatch: firstMatch ?? null,
    allMatches: tests,
  });
});

export default router;
