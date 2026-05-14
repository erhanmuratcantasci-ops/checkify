import { Queue } from 'bullmq';

export const redisConnection = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
  password: process.env['REDIS_PASSWORD'] || undefined,
};

export const smsQueue = new Queue('sms-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export interface SMSJobData {
  orderId: number;
  phone: string;
  customerName: string;
  total: number;
  confirmUrl: string;
  cancelUrl: string;
  statusUrl?: string;
}

// Sprint 10 — fraud scoring queue
export const fraudQueue = new Queue('fraud-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 30000 },
    removeOnComplete: 200,
    removeOnFail: 500,
    delay: 5000, // 5s grace
  },
});

export interface FraudJobData {
  orderId: number;
}

export async function enqueueFraudScoring(orderId: number): Promise<void> {
  await fraudQueue.add('score', { orderId }, { jobId: `fraud:${orderId}` });
}
