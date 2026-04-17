import prisma from './prisma';
import { BlockingRuleType, BlockSource, Prisma } from '../../generated/prisma';

export interface OrderCheckData {
  customerName?: string | null;
  phoneNumber?: string | null;
  ipAddress?: string | null;
  postalCode?: string | null;
  email?: string | null;
  shopifyOrderId?: string | null;
}

export type BlockCheckResult =
  | { blocked: false }
  | {
      blocked: true;
      source: BlockSource;
      ruleType: string;
      ruleId?: number;
      reason?: string;
    };

// IPv4 "a.b.c.d" → uint32. IPv6 şu an desteklenmiyor (Shopify browser_ip tipik IPv4).
function ipv4ToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const x = Number(p);
    if (!Number.isInteger(x) || x < 0 || x > 255) return null;
    n = ((n << 8) >>> 0) + x;
  }
  return n >>> 0;
}

function matchCidr(ip: string, cidr: string): boolean {
  const slash = cidr.indexOf('/');
  if (slash === -1) return false;
  const base = cidr.slice(0, slash);
  const bits = Number(cidr.slice(slash + 1));
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const ipN = ipv4ToInt(ip);
  const baseN = ipv4ToInt(base);
  if (ipN === null || baseN === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ipN & mask) === (baseN & mask);
}

async function recordBlockedOrder(
  shopId: number,
  data: OrderCheckData,
  source: BlockSource,
  ruleType: string,
  ruleId: number | undefined,
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.blockedOrder.create({
        data: {
          shopId,
          shopifyOrderId: data.shopifyOrderId ?? null,
          customerName: data.customerName ?? null,
          phoneNumber: data.phoneNumber ?? null,
          ipAddress: data.ipAddress ?? null,
          postalCode: data.postalCode ?? null,
          email: data.email ?? null,
          blockSource: source,
          ruleId: ruleId ?? null,
          ruleType,
        },
      });
      if ((source === 'BLOCKING_RULE' || source === 'RATE_LIMIT') && ruleId !== undefined) {
        await tx.blockingRule.update({
          where: { id: ruleId },
          data: { matchCount: { increment: 1 }, lastMatched: new Date() },
        });
      }
    });
  } catch (err) {
    console.error('[BlockingService] recordBlockedOrder hatası:', err);
  }
}

export async function checkOrderForBlocks(
  shopId: number,
  data: OrderCheckData,
): Promise<BlockCheckResult> {
  const { customerName, phoneNumber, ipAddress, postalCode, email } = data;

  // 1. Legacy BlockedPhone
  if (phoneNumber) {
    const match = await prisma.blockedPhone.findFirst({
      where: { shopId, phone: phoneNumber },
    });
    if (match) {
      console.log('[BlockingService] LEGACY_PHONE match:', { shopId, phoneNumber, ruleId: match.id });
      await recordBlockedOrder(shopId, data, 'LEGACY_PHONE', 'BlockedPhone', match.id);
      return { blocked: true, source: 'LEGACY_PHONE', ruleType: 'BlockedPhone', ruleId: match.id };
    }
  }

  // 2. Legacy BlockedPostalCode
  if (postalCode) {
    const match = await prisma.blockedPostalCode.findFirst({
      where: { shopId, postalCode: postalCode.trim() },
    });
    if (match) {
      console.log('[BlockingService] LEGACY_POSTAL_CODE match:', { shopId, postalCode, ruleId: match.id });
      await recordBlockedOrder(shopId, data, 'LEGACY_POSTAL_CODE', 'BlockedPostalCode', match.id);
      return { blocked: true, source: 'LEGACY_POSTAL_CODE', ruleType: 'BlockedPostalCode', ruleId: match.id };
    }
  }

  // Shop ayarları — advanced blocking kapalıysa rule-based kontrolleri atla
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      advancedBlockingEnabled: true,
      maxOrdersPerPhone30d: true,
      maxOrdersPerIp30d: true,
    },
  });

  if (!shop || !shop.advancedBlockingEnabled) {
    return { blocked: false };
  }

  const rules = await prisma.blockingRule.findMany({
    where: { shopId, isActive: true },
  });

  // 3. IP_ADDRESS exact
  if (ipAddress) {
    const match = rules.find((r) => r.ruleType === 'IP_ADDRESS' && r.value === ipAddress);
    if (match) {
      console.log('[BlockingService] IP_ADDRESS match:', { shopId, ipAddress, ruleId: match.id });
      await recordBlockedOrder(shopId, data, 'BLOCKING_RULE', 'BlockingRule:IP_ADDRESS', match.id);
      return {
        blocked: true,
        source: 'BLOCKING_RULE',
        ruleType: 'BlockingRule:IP_ADDRESS',
        ruleId: match.id,
        reason: match.reason ?? undefined,
      };
    }
  }

  // 4. IP_RANGE (CIDR)
  if (ipAddress) {
    for (const r of rules) {
      if (r.ruleType !== 'IP_RANGE') continue;
      if (matchCidr(ipAddress, r.value)) {
        console.log('[BlockingService] IP_RANGE match:', { shopId, ipAddress, cidr: r.value, ruleId: r.id });
        await recordBlockedOrder(shopId, data, 'BLOCKING_RULE', 'BlockingRule:IP_RANGE', r.id);
        return {
          blocked: true,
          source: 'BLOCKING_RULE',
          ruleType: 'BlockingRule:IP_RANGE',
          ruleId: r.id,
          reason: r.reason ?? undefined,
        };
      }
    }
  }

  // 5. PHONE_PATTERN (regex)
  if (phoneNumber) {
    for (const r of rules) {
      if (r.ruleType !== 'PHONE_PATTERN') continue;
      try {
        const re = new RegExp(r.value);
        if (re.test(phoneNumber)) {
          console.log('[BlockingService] PHONE_PATTERN match:', { shopId, phoneNumber, pattern: r.value, ruleId: r.id });
          await recordBlockedOrder(shopId, data, 'BLOCKING_RULE', 'BlockingRule:PHONE_PATTERN', r.id);
          return {
            blocked: true,
            source: 'BLOCKING_RULE',
            ruleType: 'BlockingRule:PHONE_PATTERN',
            ruleId: r.id,
            reason: r.reason ?? undefined,
          };
        }
      } catch (err) {
        console.error('[BlockingService] Geçersiz PHONE_PATTERN regex:', { ruleId: r.id, pattern: r.value, err });
      }
    }
  }

  // 6. EMAIL_DOMAIN
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      const match = rules.find((r) => r.ruleType === 'EMAIL_DOMAIN' && r.value.toLowerCase() === domain);
      if (match) {
        console.log('[BlockingService] EMAIL_DOMAIN match:', { shopId, domain, ruleId: match.id });
        await recordBlockedOrder(shopId, data, 'BLOCKING_RULE', 'BlockingRule:EMAIL_DOMAIN', match.id);
        return {
          blocked: true,
          source: 'BLOCKING_RULE',
          ruleType: 'BlockingRule:EMAIL_DOMAIN',
          ruleId: match.id,
          reason: match.reason ?? undefined,
        };
      }
    }
  }

  // 7. CUSTOMER_NAME (case-insensitive contains)
  if (customerName) {
    const nameL = customerName.toLowerCase();
    const match = rules.find(
      (r) => r.ruleType === 'CUSTOMER_NAME' && nameL.includes(r.value.toLowerCase()),
    );
    if (match) {
      console.log('[BlockingService] CUSTOMER_NAME match:', { shopId, customerName, ruleId: match.id });
      await recordBlockedOrder(shopId, data, 'BLOCKING_RULE', 'BlockingRule:CUSTOMER_NAME', match.id);
      return {
        blocked: true,
        source: 'BLOCKING_RULE',
        ruleType: 'BlockingRule:CUSTOMER_NAME',
        ruleId: match.id,
        reason: match.reason ?? undefined,
      };
    }
  }

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 8. MAX_ORDERS_PER_PHONE — shop default + rule-level override (value = eşik)
  // Eşik semantiği: count > limit (Order şu an dahil). maxOrdersPerPhone30d=3 → 4. siparişi bloklar.
  if (phoneNumber) {
    const thresholds: { limit: number; ruleId?: number; reason?: string; label: string }[] = [];
    if (shop.maxOrdersPerPhone30d !== null && shop.maxOrdersPerPhone30d > 0) {
      thresholds.push({ limit: shop.maxOrdersPerPhone30d, label: 'Shop:MAX_ORDERS_PER_PHONE' });
    }
    for (const r of rules) {
      if (r.ruleType !== 'MAX_ORDERS_PER_PHONE') continue;
      const limit = parseInt(r.value, 10);
      if (!Number.isFinite(limit) || limit <= 0) continue;
      thresholds.push({ limit, ruleId: r.id, reason: r.reason ?? undefined, label: 'BlockingRule:MAX_ORDERS_PER_PHONE' });
    }

    if (thresholds.length > 0) {
      const count = await prisma.order.count({
        where: { shopId, customerPhone: phoneNumber, createdAt: { gte: since30 } },
      });
      for (const t of thresholds) {
        if (count > t.limit) {
          console.log('[BlockingService] MAX_ORDERS_PER_PHONE match:', { shopId, phoneNumber, count, limit: t.limit, ruleId: t.ruleId });
          await recordBlockedOrder(shopId, data, 'RATE_LIMIT', t.label, t.ruleId);
          return {
            blocked: true,
            source: 'RATE_LIMIT',
            ruleType: t.label,
            ruleId: t.ruleId,
            reason: t.reason,
          };
        }
      }
    }
  }

  // 9. MAX_ORDERS_PER_IP
  if (ipAddress) {
    const thresholds: { limit: number; ruleId?: number; reason?: string; label: string }[] = [];
    if (shop.maxOrdersPerIp30d !== null && shop.maxOrdersPerIp30d > 0) {
      thresholds.push({ limit: shop.maxOrdersPerIp30d, label: 'Shop:MAX_ORDERS_PER_IP' });
    }
    for (const r of rules) {
      if (r.ruleType !== 'MAX_ORDERS_PER_IP') continue;
      const limit = parseInt(r.value, 10);
      if (!Number.isFinite(limit) || limit <= 0) continue;
      thresholds.push({ limit, ruleId: r.id, reason: r.reason ?? undefined, label: 'BlockingRule:MAX_ORDERS_PER_IP' });
    }

    if (thresholds.length > 0) {
      const count = await prisma.order.count({
        where: { shopId, ipAddress, createdAt: { gte: since30 } },
      });
      for (const t of thresholds) {
        if (count > t.limit) {
          console.log('[BlockingService] MAX_ORDERS_PER_IP match:', { shopId, ipAddress, count, limit: t.limit, ruleId: t.ruleId });
          await recordBlockedOrder(shopId, data, 'RATE_LIMIT', t.label, t.ruleId);
          return {
            blocked: true,
            source: 'RATE_LIMIT',
            ruleType: t.label,
            ruleId: t.ruleId,
            reason: t.reason,
          };
        }
      }
    }
  }

  return { blocked: false };
}

// --- CRUD ---

export async function listRules(shopId: number) {
  return prisma.blockingRule.findMany({
    where: { shopId },
    orderBy: [{ ruleType: 'asc' }, { createdAt: 'desc' }],
  });
}

export interface RuleInput {
  ruleType: BlockingRuleType;
  value: string;
  reason?: string | null;
  isActive?: boolean;
}

export async function createRule(shopId: number, input: RuleInput) {
  return prisma.blockingRule.create({
    data: {
      shopId,
      ruleType: input.ruleType,
      value: input.value,
      reason: input.reason ?? null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateRule(
  ruleId: number,
  shopId: number,
  patch: Partial<RuleInput>,
) {
  const rule = await prisma.blockingRule.findFirst({ where: { id: ruleId, shopId } });
  if (!rule) return null;

  const data: Prisma.BlockingRuleUpdateInput = {};
  if (patch.ruleType !== undefined) data.ruleType = patch.ruleType;
  if (patch.value !== undefined) data.value = patch.value;
  if (patch.reason !== undefined) data.reason = patch.reason ?? null;
  if (patch.isActive !== undefined) data.isActive = patch.isActive;

  return prisma.blockingRule.update({ where: { id: ruleId }, data });
}

export async function deleteRule(ruleId: number, shopId: number): Promise<boolean> {
  const rule = await prisma.blockingRule.findFirst({ where: { id: ruleId, shopId } });
  if (!rule) return false;
  await prisma.blockingRule.delete({ where: { id: ruleId } });
  return true;
}

export async function toggleRule(ruleId: number, shopId: number) {
  const rule = await prisma.blockingRule.findFirst({ where: { id: ruleId, shopId } });
  if (!rule) return null;
  return prisma.blockingRule.update({
    where: { id: ruleId },
    data: { isActive: !rule.isActive },
  });
}

export interface ListBlockedOrdersOptions {
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export async function listBlockedOrders(shopId: number, opts: ListBlockedOrdersOptions = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.BlockedOrderWhereInput = { shopId };
  if (opts.from || opts.to) {
    where.blockedAt = {};
    if (opts.from) where.blockedAt.gte = opts.from;
    if (opts.to) where.blockedAt.lte = opts.to;
  }

  const [items, total] = await Promise.all([
    prisma.blockedOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { blockedAt: 'desc' },
    }),
    prisma.blockedOrder.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export interface BlockingStats {
  totalBlocked: number;
  bySource: Record<string, number>;
  byDay: { date: string; count: number }[];
  topRules: { ruleId: number; ruleType: string; value: string; matchCount: number; lastMatched: Date | null }[];
}

export async function getBlockingStats(shopId: number, days = 30): Promise<BlockingStats> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [total, grouped, trendRows, topRules] = await Promise.all([
    prisma.blockedOrder.count({ where: { shopId, blockedAt: { gte: since } } }),
    prisma.blockedOrder.groupBy({
      by: ['blockSource'],
      where: { shopId, blockedAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("blockedAt") AS date, COUNT(*)::int AS count
      FROM "BlockedOrder"
      WHERE "shopId" = ${shopId}
        AND "blockedAt" >= ${since}
      GROUP BY DATE("blockedAt")
      ORDER BY date ASC
    `,
    prisma.blockingRule.findMany({
      where: { shopId, matchCount: { gt: 0 } },
      orderBy: { matchCount: 'desc' },
      take: 5,
      select: { id: true, ruleType: true, value: true, matchCount: true, lastMatched: true },
    }),
  ]);

  const bySource: Record<string, number> = {};
  for (const g of grouped) bySource[g.blockSource] = g._count._all;

  const trendMap = new Map<string, number>();
  for (const row of trendRows) {
    trendMap.set(new Date(row.date).toISOString().slice(0, 10), Number(row.count));
  }
  const byDay: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.push({ date: key, count: trendMap.get(key) ?? 0 });
  }

  return {
    totalBlocked: total,
    bySource,
    byDay,
    topRules: topRules.map((r) => ({
      ruleId: r.id,
      ruleType: r.ruleType,
      value: r.value,
      matchCount: r.matchCount,
      lastMatched: r.lastMatched,
    })),
  };
}
