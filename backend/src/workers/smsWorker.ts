import { Worker, Job, DelayedError } from 'bullmq';
import prisma from '../lib/prisma';
import { redisConnection, SMSJobData } from '../lib/queue';

const DAY_START = 9;  // 09:00
const DAY_END   = 22; // 22:00

function isWorkingHour(): boolean {
  const hour = new Date().getHours();
  return hour >= DAY_START && hour < DAY_END;
}

/** Gece ise, sabah 09:00'a kaç ms kaldığını döner */
function msUntilMorning(): number {
  const now = new Date();
  const morning = new Date(now);
  morning.setHours(DAY_START, 0, 0, 0);
  if (morning <= now) morning.setDate(morning.getDate() + 1);
  return morning.getTime() - now.getTime();
}

async function sendSMS(phone: string, message: string): Promise<void> {
  // TODO: Netgsm entegrasyonu buraya gelecek
  console.log(`[SMS] → ${phone}: ${message}`);
}

async function processJob(job: Job<SMSJobData>): Promise<void> {
  const { orderId, phone, customerName, total, confirmUrl, cancelUrl } = job.data;

  if (!isWorkingHour()) {
    const delay = msUntilMorning();
    const retryAt = new Date(Date.now() + delay).toLocaleTimeString('tr-TR');
    console.log(`[SMS] Gece saati — job #${job.id} ${retryAt}'de yeniden denenecek`);
    await job.moveToDelayed(Date.now() + delay, job.token);
    throw new DelayedError();
  }

  const message =
    `Merhaba ${customerName}, ${total.toFixed(2)} TL tutarındaki siparişiniz alındı. ` +
    `Onaylamak: ${confirmUrl} | İptal: ${cancelUrl}`;

  await sendSMS(phone, message);

  await prisma.sMSLog.create({
    data: {
      phone,
      message,
      status: 'SENT',
      orderId,
    },
  });

  console.log(`[SMS] ✓ Gönderildi — Order #${orderId}, ${phone}`);
}

export const smsWorker = new Worker<SMSJobData>('sms-queue', processJob, {
  connection: redisConnection,
  concurrency: 5,
});

smsWorker.on('failed', (job, err) => {
  console.error(`[SMS] ✗ Job #${job?.id} başarısız:`, err.message);
});

smsWorker.on('completed', (job) => {
  console.log(`[SMS] ✓ Job #${job.id} tamamlandı`);
});
