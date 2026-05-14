import cron from 'node-cron';
import prisma from './prisma';
import { enqueueRecoveryMessage } from '../workers/cartRecoveryWorker';

// ──────────────────────────────────────────────────────────────────────
// Sprint 11 RECOVER — cart recovery scheduler
//
// Cron: every 15 minutes. Scans abandoned carts <24h old and dispatches
// the next reminder in the sequence based on how long ago the cart was
// abandoned. We rely on AbandonedCartEvent rows for idempotency — each
// template is sent at most once per cart.
//
// Sequence:
//   T+1h  → first_reminder  (SMS)
//   T+6h  → second_reminder (SMS)
//   T+24h → final           (email)
// ──────────────────────────────────────────────────────────────────────

interface RecoveryStep {
  minHoursSinceAbandon: number;
  template: 'first_reminder' | 'second_reminder' | 'final';
  channel: 'sms' | 'email';
}

const SEQUENCE: RecoveryStep[] = [
  { minHoursSinceAbandon: 1, template: 'first_reminder', channel: 'sms' },
  { minHoursSinceAbandon: 6, template: 'second_reminder', channel: 'sms' },
  { minHoursSinceAbandon: 24, template: 'final', channel: 'email' },
];

const MAX_ABANDONED_AGE_MS = 24 * 60 * 60 * 1000;

export async function findCartsToRecover(): Promise<void> {
  const now = Date.now();
  const cutoff = new Date(now - MAX_ABANDONED_AGE_MS);

  const carts = await prisma.abandonedCart.findMany({
    where: {
      status: { in: ['abandoned', 'recovering'] },
      abandonedAt: { gte: cutoff },
    },
    include: {
      events: { select: { template: true } },
    },
    take: 500,
  });

  for (const cart of carts) {
    const ageMs = now - cart.abandonedAt.getTime();
    const ageHours = ageMs / (60 * 60 * 1000);
    const sentTemplates = new Set(cart.events.map((e) => e.template));

    let next: RecoveryStep | null = null;
    for (const step of SEQUENCE) {
      if (ageHours >= step.minHoursSinceAbandon && !sentTemplates.has(step.template)) {
        next = step;
      }
    }
    if (!next) continue;

    const effectiveChannel: 'sms' | 'email' =
      next.channel === 'email' && !cart.customerEmail && cart.customerPhone
        ? 'sms'
        : next.channel === 'sms' && !cart.customerPhone && cart.customerEmail
          ? 'email'
          : next.channel;

    if (effectiveChannel === 'sms' && !cart.customerPhone) continue;
    if (effectiveChannel === 'email' && !cart.customerEmail) continue;

    try {
      await enqueueRecoveryMessage({
        abandonedCartId: cart.id,
        channel: effectiveChannel,
        template: next.template,
      });
    } catch (err) {
      console.error(`[recover-cron] enqueue hatası — Cart ${cart.id}:`, err);
    }
  }

  await prisma.abandonedCart.updateMany({
    where: {
      status: { in: ['abandoned', 'recovering'] },
      abandonedAt: { lt: cutoff },
    },
    data: { status: 'expired' },
  });
}

let task: ReturnType<typeof cron.schedule> | null = null;

export function startCartRecoveryScheduler(): void {
  if (task) return;
  task = cron.schedule('*/15 * * * *', () => {
    findCartsToRecover().catch((err) => console.error('[recover-cron] tick hatası:', err));
  });
  console.log('[recover-cron] Scheduler başlatıldı — her 15 dakikada bir');
}

export function stopCartRecoveryScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
