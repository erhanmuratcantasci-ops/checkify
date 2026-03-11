import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { addTagToOrder } from '../lib/shopify';
import { sendOrderConfirmationEmail, sendOrderCancellationEmail } from '../lib/mailer';

const router = Router();

// GET /confirm/:token
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  const token = req.params['token'] as string;

  const order = await prisma.order.findUnique({
    where: { confirmToken: token },
    include: { shop: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Geçersiz veya kullanılmış token' });
    return;
  }

  if (!order.tokenExpiresAt || order.tokenExpiresAt < new Date()) {
    res.status(410).json({ error: 'Token süresi dolmuş' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED', confirmToken: null, tokenExpiresAt: null },
    select: { id: true, customerName: true, total: true, status: true },
  });

  // Arka planda: Shopify tag + email
  if (order.shopifyOrderId && order.shop.shopDomain && order.shop.accessToken) {
    addTagToOrder(
      order.shop.shopDomain,
      order.shop.accessToken,
      Number(order.shopifyOrderId),
      'chekkify-confirmed'
    ).catch((err) => console.error('[confirm] Shopify tag eklenemedi:', err));
  }

  // Müşteriye confirmation email gönder — müşteri emailini order üzerinden alabiliyorsak
  // Şimdilik shop sahibine gönder (müşteri email alanı henüz yok)
  const shopUser = await prisma.user.findFirst({
    where: { shops: { some: { id: order.shopId } } },
    select: { email: true, name: true },
  });
  if (shopUser) {
    sendOrderConfirmationEmail(shopUser.email, order.customerName, order.total, order.id)
      .catch(err => console.error('[confirm] Email gönderilemedi:', err));
  }

  res.json({ message: 'Sipariş onaylandı', order: updated });
});

// GET /confirm/cancel/:token
router.get('/cancel/:token', async (req: Request, res: Response): Promise<void> => {
  const token = req.params['token'] as string;

  const order = await prisma.order.findUnique({
    where: { confirmToken: token },
    include: { shop: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Geçersiz veya kullanılmış token' });
    return;
  }

  if (!order.tokenExpiresAt || order.tokenExpiresAt < new Date()) {
    res.status(410).json({ error: 'Token süresi dolmuş' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED', confirmToken: null, tokenExpiresAt: null },
    select: { id: true, customerName: true, total: true, status: true },
  });

  if (order.shopifyOrderId && order.shop.shopDomain && order.shop.accessToken) {
    addTagToOrder(
      order.shop.shopDomain,
      order.shop.accessToken,
      Number(order.shopifyOrderId),
      'chekkify-cancelled'
    ).catch((err) => console.error('[cancel] Shopify tag eklenemedi:', err));
  }

  const shopUserCancel = await prisma.user.findFirst({
    where: { shops: { some: { id: order.shopId } } },
    select: { email: true, name: true },
  });
  if (shopUserCancel) {
    sendOrderCancellationEmail(shopUserCancel.email, order.customerName, order.total, order.id)
      .catch(err => console.error('[cancel] Email gönderilemedi:', err));
  }

  res.json({ message: 'Sipariş iptal edildi', order: updated });
});

// GET /confirm/otp/info/:orderId — public masked phone info
router.get('/otp/info/:orderId', async (req: Request, res: Response): Promise<void> => {
  const orderId = parseInt(req.params['orderId'] as string);
  if (isNaN(orderId)) { res.status(400).json({ error: 'Geçersiz sipariş' }); return; }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerPhone: true, status: true, otpAttempts: true, otpVerified: true },
  });

  if (!order) { res.status(404).json({ error: 'Sipariş bulunamadı' }); return; }

  const masked = order.customerPhone.slice(-2).padStart(order.customerPhone.length, '*');

  res.json({
    maskedPhone: masked,
    status: order.status,
    locked: order.otpAttempts >= 3,
    verified: order.otpVerified,
  });
});

// POST /confirm/otp — OTP doğrulama
router.post('/otp', async (req: Request, res: Response): Promise<void> => {
  const { orderId, otpCode } = req.body as { orderId?: number; otpCode?: string };

  if (!orderId || !otpCode) {
    res.status(400).json({ error: 'orderId ve otpCode gerekli' });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: true },
  });

  if (!order) { res.status(404).json({ error: 'Sipariş bulunamadı' }); return; }

  if (order.otpAttempts >= 3) {
    res.status(429).json({ error: 'Çok fazla başarısız deneme. Sipariş kilitlendi.' });
    return;
  }

  if (order.otpCode !== otpCode) {
    await prisma.order.update({
      where: { id: orderId },
      data: { otpAttempts: { increment: 1 } },
    });
    const remaining = 2 - order.otpAttempts;
    res.status(400).json({ error: `Yanlış kod. ${remaining} deneme hakkınız kaldı.` });
    return;
  }

  // OTP doğru — siparişi onayla
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CONFIRMED', otpVerified: true, confirmToken: null, tokenExpiresAt: null },
    select: { id: true, customerName: true, total: true, status: true },
  });

  // Shopify tag + email arka planda
  if (order.shopifyOrderId && order.shop.shopDomain && order.shop.accessToken) {
    addTagToOrder(
      order.shop.shopDomain,
      order.shop.accessToken,
      Number(order.shopifyOrderId),
      'chekkify-confirmed'
    ).catch((err) => console.error('[otp] Shopify tag eklenemedi:', err));
  }

  res.json({ message: 'Sipariş başarıyla doğrulandı', order: updated });
});

export default router;
