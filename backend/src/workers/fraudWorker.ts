import { Worker, Job } from 'bullmq';
import { redisConnection, FraudJobData } from '../lib/queue';
import { scoreOrder, persistScore } from '../lib/fraudScoring';

async function processFraudJob(job: Job<FraudJobData>): Promise<void> {
  const { orderId } = job.data;
  console.log(`[fraud] scoring order #${orderId}`);
  const result = await scoreOrder(orderId);
  if (!result) {
    console.warn(`[fraud] order #${orderId} not found, skipping`);
    return;
  }
  await persistScore(orderId, result);
  console.log(
    `[fraud] order #${orderId} → score=${result.score.toFixed(2)} risk=${result.riskLevel} action=${result.action}`,
  );
}

export function startFraudWorker(): Worker<FraudJobData> {
  const worker = new Worker<FraudJobData>('fraud-queue', processFraudJob, {
    connection: redisConnection,
    concurrency: 5,
  });
  worker.on('failed', (job, err) => {
    console.error(`[fraud] job #${job?.id} failed:`, err.message);
  });
  return worker;
}
