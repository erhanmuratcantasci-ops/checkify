/**
 * Sprint 9 INTEGRATE — Google Sheets export worker.
 *
 * Consumes the `sheets-export-queue` and appends a row per order via the
 * googleapis client. Retries: 3x exponential backoff (queue config). If
 * Sheets config is missing the worker logs + acks (no retry storm).
 */

import { Worker, Job } from 'bullmq';
import { redisConnection, SheetsExportJobData } from '../lib/queue';
import { exportOrderRow, getSheetsStatus } from '../lib/sheetsExporter';

async function processSheetsJob(job: Job<SheetsExportJobData>): Promise<void> {
  const { orderId } = job.data;
  const status = getSheetsStatus();
  if (!status.enabled) {
    console.log(`[sheets-worker] job=${job.id} order=${orderId} — Sheets not configured, ack & skip`);
    return;
  }
  console.log(`[sheets-worker] exporting order=${orderId}`);
  await exportOrderRow(orderId);
}

export function startSheetsExportWorker(): Worker<SheetsExportJobData> {
  const worker = new Worker<SheetsExportJobData>('sheets-export-queue', processSheetsJob, {
    connection: redisConnection,
    concurrency: 3,
  });
  worker.on('failed', (job, err) => {
    console.error(`[sheets-worker] job=${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[sheets-worker] job=${job.id} done`);
  });
  return worker;
}
