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
      'onaylandi'
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
      'iptal-edildi'
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

export default router;
