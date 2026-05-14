import prisma from './prisma';
import {
  Signal,
  ipCountryMismatch,
  phoneInvalidPattern,
  postalCodeMismatch,
  disposableEmailDomain,
  orderValueOutlier,
  repeatCancellationPhone,
  emptyAddressOrName,
} from './fraudSignals';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FraudAction = 'auto_approve' | 'manual_review' | 'auto_cancel';

export interface ScoreResult {
  score: number;
  riskLevel: RiskLevel;
  action: FraudAction;
  signals: Signal[];
}

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 0.85) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}

export function riskLevelToAction(level: RiskLevel): FraudAction {
  if (level === 'critical') return 'auto_cancel';
  if (level === 'high') return 'manual_review';
  return 'auto_approve';
}

/**
 * V1: deterministic rule engine — sum of triggered signal weights, capped at 1.0.
 * Order's customer email/city/postal/address are not yet on the Order table;
 * V1 reads what is available and skips signals that need missing fields.
 * V2 (Sprint 12+) will add Claude API reasoning + DB enrichment.
 */
export async function scoreOrder(orderId: number): Promise<ScoreResult | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: { select: { id: true, phone: true } } },
  });
  if (!order) return null;

  const signals: Signal[] = [
    await ipCountryMismatch({
      id: order.id,
      shopId: order.shopId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      ipAddress: order.ipAddress,
      shop: order.shop,
    }),
    phoneInvalidPattern(order.customerPhone),
    // Order shema'sında city / postal / email / address yok V1; ileri sürümde Shopify customer payload'dan gelir.
    postalCodeMismatch(null, null),
    disposableEmailDomain(null),
    await orderValueOutlier({
      id: order.id,
      shopId: order.shopId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      ipAddress: order.ipAddress,
      shop: order.shop,
    }),
    await repeatCancellationPhone(order.customerPhone, order.shopId),
    emptyAddressOrName(
      {
        id: order.id,
        shopId: order.shopId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        total: order.total,
        ipAddress: order.ipAddress,
        shop: order.shop,
      },
      null,
    ),
  ];

  const score = Math.min(
    1,
    signals.reduce((sum, s) => (s.triggered ? sum + s.weight : sum), 0),
  );
  const riskLevel = scoreToRiskLevel(score);
  const action = riskLevelToAction(riskLevel);

  return { score, riskLevel, action, signals };
}

export async function persistScore(orderId: number, result: ScoreResult): Promise<void> {
  await prisma.fraudScore.upsert({
    where: { orderId },
    create: {
      orderId,
      score: result.score,
      riskLevel: result.riskLevel,
      action: result.action,
      signals: result.signals as unknown as object,
      modelVersion: 'v1',
    },
    update: {
      score: result.score,
      riskLevel: result.riskLevel,
      action: result.action,
      signals: result.signals as unknown as object,
      modelVersion: 'v1',
    },
  });
}
