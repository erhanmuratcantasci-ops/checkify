import { Worker, Job, Queue } from 'bullmq';
import prisma from '../lib/prisma';
import { redisConnection } from '../lib/queue';

// ──────────────────────────────────────────────────────────────────────
// Cart Recovery Worker — Sprint 11 RECOVER
//
// Pattern mirrors backend/src/workers/smsWorker.ts (do NOT modify that
// file). Sends abandoned-cart recovery messages via SMS or email. Records
// each delivery as an AbandonedCartEvent row.
//
// For SMS we mirror the smsWorker console-log stub until the real
// transport lands. For email we instantiate Resend at runtime so we
// don't have to touch lib/mailer.ts.
// ──────────────────────────────────────────────────────────────────────

export interface CartRecoveryJobData {
  abandonedCartId: string;
  channel: 'sms' | 'email';
  template: string;
}

export const cartRecoveryQueue = new Queue<CartRecoveryJobData>('cart-recovery-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export async function enqueueRecoveryMessage(data: CartRecoveryJobData): Promise<void> {
  await cartRecoveryQueue.add('send-recovery', data);
}

async function sendRecoverySMS(phone: string, message: string): Promise<void> {
  console.log(`[recover-sms] → ${phone}: ${message}`);
}

async function sendRecoveryEmail(to: string, subject: string, body: string): Promise<void> {
  const key = process.env['RESEND_API_KEY'];
  if (!key) {
    console.log(`[recover-email] (no RESEND_API_KEY) → ${to} :: ${subject}`);
    return;
  }
  const { Resend } = await import('resend');
  const resend = new Resend(key);
  await resend.emails.send({
    from: 'Chekkify <noreply@chekkify.com>',
    to,
    subject,
    html: body,
  });
  console.log(`[recover-email] → ${to} :: ${subject}`);
}

function renderRecoveryMessage(opts: {
  template: string;
  channel: 'sms' | 'email';
  customerName: string;
  cartValue: number;
  currency: string;
  recoverUrl: string;
}): { subject: string; body: string } {
  const { template, channel, customerName, cartValue, currency, recoverUrl } = opts;
  const amount = `${cartValue.toFixed(2)} ${currency}`;
  const greet = customerName || 'Merhaba';

  const TEMPLATES: Record<string, { sms: string; emailSubject: string; emailBody: string }> = {
    first_reminder: {
      sms: `${greet}, ${amount} tutarındaki sepetiniz hâlâ bekliyor. Tamamlamak için: ${recoverUrl}`,
      emailSubject: 'Sepetinizi tamamlamayı unuttunuz mu?',
      emailBody: `<p>${greet},</p><p>${amount} tutarındaki sepetiniz hâlâ bekliyor.</p><p><a href="${recoverUrl}">Sepetimi tamamla</a></p>`,
    },
    second_reminder: {
      sms: `${greet}, sepetinizdeki ürünler stoklarda azalıyor. Hemen tamamlamak için: ${recoverUrl}`,
      emailSubject: 'Sepetinizdeki ürünler tükenmek üzere',
      emailBody: `<p>${greet},</p><p>Sepetinizdeki ürünler stoklarda azalıyor.</p><p><a href="${recoverUrl}">Sepetimi tamamla</a></p>`,
    },
    final: {
      sms: `${greet}, sepetinizi son bir kez hatırlatıyoruz. ${amount} tutarındaki siparişinizi tamamlayın: ${recoverUrl}`,
      emailSubject: 'Son hatırlatma — sepetiniz',
      emailBody: `<p>${greet},</p><p>${amount} tutarındaki siparişinizi tamamlamak için son şans.</p><p><a href="${recoverUrl}">Sepetimi tamamla</a></p>`,
    },
    manual_reminder: {
      sms: `${greet}, ${amount} tutarındaki sepetiniz için: ${recoverUrl}`,
      emailSubject: 'Sepetinizle ilgili bir hatırlatma',
      emailBody: `<p>${greet},</p><p>${amount} tutarındaki sepetiniz için: <a href="${recoverUrl}">Sepetimi tamamla</a></p>`,
    },
  };

  const t = TEMPLATES[template] ?? TEMPLATES['manual_reminder']!;
  if (channel === 'sms') return { subject: '', body: t.sms };
  return { subject: t.emailSubject, body: t.emailBody };
}

async function processJob(job: Job<CartRecoveryJobData>): Promise<void> {
  const { abandonedCartId, channel, template } = job.data;

  const cart = await prisma.abandonedCart.findUnique({
    where: { id: abandonedCartId },
    include: { shop: { select: { id: true, name: true } } },
  });
  if (!cart) {
    console.warn(`[recover] Cart bulunamadı: ${abandonedCartId}`);
    return;
  }
  if (cart.status === 'recovered' || cart.status === 'expired') {
    console.log(`[recover] Cart ${cart.id} ${cart.status} — atlandı`);
    return;
  }

  const baseUrl = process.env['DASHBOARD_URL'] || 'https://chekkify.com';
  const recoverUrl = `${baseUrl}/cart/recover/${cart.cartToken}`;

  const { subject, body } = renderRecoveryMessage({
    template,
    channel,
    customerName: cart.customerName ?? '',
    cartValue: cart.cartValue,
    currency: cart.currency,
    recoverUrl,
  });

  let delivered = false;
  try {
    if (channel === 'sms') {
      if (!cart.customerPhone) {
        console.warn(`[recover] Cart ${cart.id} telefon yok — SMS atlanıyor`);
      } else {
        await sendRecoverySMS(cart.customerPhone, body);
        delivered = true;
      }
    } else {
      if (!cart.customerEmail) {
        console.warn(`[recover] Cart ${cart.id} email yok — email atlanıyor`);
      } else {
        await sendRecoveryEmail(cart.customerEmail, subject, body);
        delivered = true;
      }
    }
  } catch (err) {
    console.error(`[recover] Gönderim hatası — Cart ${cart.id}:`, err);
  }

  await prisma.abandonedCartEvent.create({
    data: {
      abandonedCartId: cart.id,
      channel,
      template,
      delivered,
    },
  });

  if (cart.status === 'abandoned' && delivered) {
    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: { status: 'recovering' },
    });
  }

  console.log(`[recover] Cart ${cart.id} (${channel}/${template}) → delivered=${delivered}`);
}

export const cartRecoveryWorker = new Worker<CartRecoveryJobData>(
  'cart-recovery-queue',
  processJob,
  { connection: redisConnection, concurrency: 5 },
);

cartRecoveryWorker.on('failed', (job, err) => {
  console.error(`[recover] ✗ Job #${job?.id} başarısız:`, err.message);
});

cartRecoveryWorker.on('completed', (job) => {
  console.log(`[recover] ✓ Job #${job.id} tamamlandı`);
});

export async function matchAbandonedCart(cartToken: string | null | undefined, orderId: number): Promise<void> {
  if (!cartToken) return;
  try {
    const cart = await prisma.abandonedCart.findUnique({
      where: { cartToken },
      select: { id: true, status: true },
    });
    if (!cart) return;
    if (cart.status === 'recovered') return;
    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: { status: 'recovered', recoveredAt: new Date(), recoveredOrderId: orderId },
    });
    console.log(`[recover] Cart ${cart.id} matched → Order #${orderId}`);
  } catch (err) {
    console.error('[recover] matchAbandonedCart hatası:', err);
  }
}
