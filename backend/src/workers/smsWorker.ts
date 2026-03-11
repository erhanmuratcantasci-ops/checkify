import { Worker, Job, DelayedError } from 'bullmq';
import prisma from '../lib/prisma';
import { redisConnection, SMSJobData } from '../lib/queue';
import { validateSMSMessage, validatePhone } from '../middleware/smsValidator';
import { checkSmsRateLimit } from '../middleware/rateLimiter';
import { sendLowCreditEmail } from '../lib/mailer';

const LOW_CREDIT_THRESHOLD = 10;

async function sendSMS(phone: string, message: string): Promise<void> {
  // TODO: Netgsm entegrasyonu buraya gelecek
  console.log(`[SMS] → ${phone}: ${message}`);
}

async function processJob(job: Job<SMSJobData>): Promise<void> {
  const { orderId, phone, customerName, total, confirmUrl, cancelUrl } = job.data;

  // Fetch order + shop early (hours, credit, rate-limit)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      shopId: true,
      shop: { select: { userId: true, smsStartHour: true, smsEndHour: true } },
    },
  });

  // Shop-specific SMS hour check
  const startHour = order?.shop.smsStartHour ?? 9;
  const endHour   = order?.shop.smsEndHour   ?? 21;
  const currHour  = new Date().getHours();

  if (currHour < startHour || currHour >= endHour) {
    const now  = new Date();
    const next = new Date(now);
    next.setHours(startHour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    console.log(`[SMS] Saat ${currHour} — job #${job.id} ${startHour}:00'da yeniden denenecek`);
    await job.moveToDelayed(Date.now() + delay, job.token);
    throw new DelayedError();
  }

  // Telefon validasyonu
  const phoneCheck = validatePhone(phone);
  if (!phoneCheck.valid) {
    console.error(`[SMS] Geçersiz telefon — Order #${orderId}: ${phoneCheck.error}`);
    await prisma.sMSLog.create({
      data: { phone, message: '', status: 'FAILED', errorMessage: phoneCheck.error, orderId },
    });
    throw new Error(phoneCheck.error);
  }

  const message =
    `Merhaba ${customerName}, ${total.toFixed(2)} TL tutarındaki siparişiniz alındı. ` +
    `Onaylamak: ${confirmUrl} | İptal: ${cancelUrl}`;

  // Mesaj validasyonu
  const msgCheck = validateSMSMessage(message);
  if (!msgCheck.valid) {
    console.error(`[SMS] Geçersiz mesaj — Order #${orderId}: ${msgCheck.error}`);
    await prisma.sMSLog.create({
      data: { phone, message, status: 'FAILED', errorMessage: msgCheck.error, orderId },
    });
    throw new Error(msgCheck.error);
  }

  // Shop başına saatlik SMS rate limit + kredi kontrolü
  if (order) {
    const user = await prisma.user.findUnique({
      where: { id: order.shop.userId },
      select: { id: true, smsCredits: true },
    });
    if (!user || user.smsCredits <= 0) {
      const errMsg = 'Yetersiz kredi';
      console.error(`[SMS] Kredi yetersiz — Order #${orderId}: ${errMsg}`);
      await prisma.sMSLog.create({
        data: { phone, message, status: 'FAILED', errorMessage: errMsg, orderId },
      });
      throw new Error(errMsg);
    }

    const rateCheck = await checkSmsRateLimit(order.shopId);
    if (!rateCheck.allowed) {
      const errMsg = `Shop #${order.shopId} saatlik SMS limitine ulaştı (max ${100})`;
      console.error(`[SMS] Rate limit — Order #${orderId}: ${errMsg}`);
      await prisma.sMSLog.create({
        data: { phone, message, status: 'FAILED', errorMessage: errMsg, orderId },
      });
      throw new Error(errMsg);
    }
    console.log(`[SMS] Rate limit — Shop #${order.shopId} bu saat ${100 - rateCheck.remaining}/100 SMS kullandı`);
  }

  await sendSMS(phone, message);

  // SMS logu + kredi düşümü atomik
  if (order) {
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: order.shop.userId },
        data: { smsCredits: { decrement: 1 } },
        select: { id: true, email: true, name: true, smsCredits: true },
      }),
      prisma.sMSLog.create({
        data: { phone, message, status: 'SENT', orderId },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: order.shop.userId,
          amount: -1,
          type: 'USAGE',
          description: `Sipariş #${orderId} için SMS gönderildi`,
        },
      }),
    ]);

    if (updatedUser.smsCredits < LOW_CREDIT_THRESHOLD) {
      sendLowCreditEmail(updatedUser.email, updatedUser.name ?? updatedUser.email, updatedUser.smsCredits)
        .catch(err => console.error('[smsWorker] Low credit email gönderilemedi:', err));
    }
  } else {
    await prisma.sMSLog.create({
      data: { phone, message, status: 'SENT', orderId },
    });
  }

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
