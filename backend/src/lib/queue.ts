import { Queue } from 'bullmq';

export const redisConnection = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
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
}
