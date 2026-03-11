import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../lib/mailer';
import crypto from 'crypto';
import { z } from 'zod';
import { logSecurityEvent } from '../lib/securityLog';
import { isDisposableEmail } from '../lib/disposableEmails';
// @ts-ignore
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

const router = Router();


// IP başına kayıt sayacı (in-memory, production için Redis kullan)
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const entry = registrationAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    registrationAttempts.set(ip, { count: 1, resetAt: now + dayMs });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

const registerSchema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
  name: z.string().max(100, 'İsim max 100 karakter olabilir').optional(),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(1, 'Şifre zorunlu'),
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, name, password, referralCode } = parsed.data;

  // IP rate limit
  const clientIp = (Array.isArray(req.headers['cf-connecting-ip']) ? req.headers['cf-connecting-ip'][0] : req.headers['cf-connecting-ip']) || req.ip || 'unknown';
  if (!checkIpRateLimit(clientIp)) {
    res.status(429).json({ error: 'Günlük kayıt limitine ulaştınız. 24 saat sonra tekrar deneyin.' });
    return;
  }

  // Disposable email engeli
  if (isDisposableEmail(email)) {
    res.status(400).json({ error: 'Geçici email adresleri kabul edilmemektedir.' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Bu email zaten kayıtlı' });
    return;
  }

  let referrerId: number | undefined;
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: (referralCode as string).toUpperCase() } });
    if (referrer) referrerId = referrer.id;
  }

  const hashed = await bcrypt.hash(password, 10);
  const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  const user = await prisma.user.create({
    data: { email, name, password: hashed, referralCode: newReferralCode, referredByUserId: referrerId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (referrerId) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { smsCredits: { increment: 50 } } }),
      prisma.user.update({ where: { id: referrerId }, data: { smsCredits: { increment: 50 } } }),
      prisma.creditTransaction.create({ data: { userId: user.id, amount: 50, type: 'PURCHASE', description: 'Referral bonusu: Davet kodu kullanıldı' } }),
      prisma.creditTransaction.create({ data: { userId: referrerId, amount: 50, type: 'PURCHASE', description: `Referral bonusu: ${email} davet edildi` } }),
    ]);
  }

  const token = jwt.sign({ userId: user.id }, process.env['JWT_SECRET']!, { expiresIn: '24h' });
  const refreshTokenValue = crypto.randomBytes(40).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Email doğrulama token
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken } });

  const verifyUrl = `https://checkify-production.up.railway.app/auth/verify-email/${emailVerifyToken}`;
  sendVerificationEmail(user.email, user.name ?? user.email, verifyUrl)
    .catch(err => console.error('[auth] Verification email gönderilemedi:', err));

  sendWelcomeEmail(user.email, user.name ?? user.email)
    .catch(err => console.error('[auth] Welcome email gönderilemedi:', err));

  res.status(201).json({ user, token, refreshToken: refreshTokenValue });
});

// POST /auth/google — Google OAuth ile giriş/kayıt
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { email, name } = req.body as { email?: string; name?: string };

  if (!email) {
    res.status(400).json({ error: 'Email gerekli' });
    return;
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
    user = await prisma.user.create({
      data: { email, name: name || null, password: randomPassword },
    });
    sendWelcomeEmail(user.email, user.name ?? user.email)
      .catch(err => console.error('[auth] Welcome email gönderilemedi:', err));
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = jwt.sign({ userId: user.id }, process.env['JWT_SECRET']!, { expiresIn: '24h' });

  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Geçersiz email veya şifre' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await logSecurityEvent(req.ip ?? 'unknown', '/auth/login', `Başarısız giriş: ${email}`);
    res.status(401).json({ error: 'Geçersiz email veya şifre' });
    return;
  }

  // Email doğrulama kontrolü
  if (!user.emailVerified) {
    res.status(403).json({ error: 'Email adresinizi doğrulamanız gerekiyor. Lütfen gelen kutunuzu kontrol edin.', code: 'EMAIL_NOT_VERIFIED' });
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  // 2FA kontrolü (admin için)
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    const preAuthToken = jwt.sign(
      { userId: user.id, scope: '2fa' },
      process.env['JWT_SECRET']!,
      { expiresIn: '5m' }
    );
    res.json({ require2FA: true, preAuthToken });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env['JWT_SECRET']!, { expiresIn: '24h' });
  const refreshTokenValue = crypto.randomBytes(40).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token,
    refreshToken: refreshTokenValue,
  });
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, smsCredits: true, whatsappCredits: true, createdAt: true, lastLoginAt: true, referralCode: true, twoFactorEnabled: true, plan: true, planExpiresAt: true, billingCycle: true, _count: { select: { referredUsers: true } } },
  });

  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }

  res.json({ user: { ...user, referredCount: user._count.referredUsers, _count: undefined } });
});

// PATCH /auth/me
router.patch('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, currentPassword, newPassword } = req.body as {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const existing = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!existing) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }

  const data: { name?: string; email?: string; password?: string } = {};

  if (name !== undefined) data.name = name;

  if (email && email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      res.status(409).json({ error: 'Bu email zaten kullanımda' });
      return;
    }
    data.email = email;
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: 'Mevcut şifre gerekli' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, existing.password);
    if (!valid) {
      res.status(401).json({ error: 'Mevcut şifre yanlış' });
      return;
    }
    data.password = await bcrypt.hash(newPassword, 10);
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data,
    select: { id: true, email: true, name: true, smsCredits: true, createdAt: true, lastLoginAt: true },
  });

  res.json({ user });
});

// DELETE /auth/me
router.delete('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body as { password?: string };

  if (!password) {
    res.status(400).json({ error: 'Şifre doğrulaması gerekli' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) { res.status(401).json({ error: 'Şifre yanlış' }); return; }

  // Cascade: user'a bağlı shop ve order'ları sil
  const shops = await prisma.shop.findMany({ where: { userId: req.userId! }, select: { id: true } });
  const shopIds = shops.map(s => s.id);
  const orders = await prisma.order.findMany({ where: { shopId: { in: shopIds } }, select: { id: true } });
  const orderIds = orders.map(o => o.id);

  await prisma.sMSLog.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { shopId: { in: shopIds } } });
  await prisma.shop.deleteMany({ where: { userId: req.userId! } });
  await prisma.user.delete({ where: { id: req.userId } });

  res.json({ success: true });
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: 'Email gerekli' }); return; }

  const user = await prisma.user.findUnique({ where: { email } });

  // Kullanıcı yoksa bile 200 dön (güvenlik: email enumeration önleme)
  if (!user) {
    res.json({ message: 'Eğer bu email kayıtlıysa sıfırlama linki gönderildi' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const resetUrl = `https://chekkify.com/reset-password/${token}`;
  sendPasswordResetEmail(user.email, user.name ?? user.email, resetUrl)
    .catch(err => console.error('[auth] Reset email gönderilemedi:', err));

  res.json({ message: 'Eğer bu email kayıtlıysa sıfırlama linki gönderildi' });
});

// POST /auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) { res.status(400).json({ error: 'Token ve yeni şifre gerekli' }); return; }
  if (newPassword.length < 6) { res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' }); return; }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) { res.status(400).json({ error: 'Geçersiz veya süresi dolmuş link' }); return; }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
  });

  res.json({ message: 'Şifre başarıyla güncellendi' });
});

// POST /auth/refresh — access token yenile
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token gerekli' });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
    return;
  }

  const newToken = jwt.sign({ userId: stored.userId }, process.env['JWT_SECRET']!, { expiresIn: '24h' });

  // Refresh token'ı yenile (rotation)
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId: stored.userId,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ token: newToken, refreshToken: newRefreshToken });
});

// GET /auth/2fa/setup — QR kod üret
router.get('/2fa/setup', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { email: true, twoFactorEnabled: true },
  });
  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }
  if (user.twoFactorEnabled) { res.status(400).json({ error: '2FA zaten aktif' }); return; }

  const secret = speakeasy.generateSecret({
    name: `Chekkify (${user.email})`,
    length: 20,
  });

  await prisma.user.update({
    where: { id: req.userId },
    data: { twoFactorSecret: secret.base32 },
  });

  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url!);
  res.json({ qrCode: qrDataUrl, secret: secret.base32 });
});

// POST /auth/2fa/enable { token } — doğrula ve aktif et
router.post('/2fa/enable', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ error: 'Token gerekli' }); return; }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorSecret) { res.status(400).json({ error: 'Önce 2FA kurulumu yapın' }); return; }
  if (user.twoFactorEnabled) { res.status(400).json({ error: '2FA zaten aktif' }); return; }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) { res.status(400).json({ error: 'Geçersiz kod' }); return; }

  await prisma.user.update({
    where: { id: req.userId },
    data: { twoFactorEnabled: true },
  });

  res.json({ success: true, message: '2FA aktif edildi' });
});

// POST /auth/2fa/disable — 2FA kapat
router.post('/2fa/disable', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ error: 'Mevcut 2FA kodu gerekli' }); return; }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    res.status(400).json({ error: '2FA zaten devre dışı' }); return;
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!valid) { res.status(400).json({ error: 'Geçersiz kod' }); return; }

  await prisma.user.update({
    where: { id: req.userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  res.json({ success: true, message: '2FA devre dışı bırakıldı' });
});

// POST /auth/2fa/verify { preAuthToken, token } — giriş sırasında 2FA doğrula
router.post('/2fa/verify', async (req: Request, res: Response): Promise<void> => {
  const { preAuthToken, token } = req.body as { preAuthToken?: string; token?: string };
  if (!preAuthToken || !token) {
    res.status(400).json({ error: 'preAuthToken ve token gerekli' }); return;
  }

  let payload: { userId: number; scope: string };
  try {
    payload = jwt.verify(preAuthToken, process.env['JWT_SECRET']!) as { userId: number; scope: string };
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş ön-doğrulama tokeni' }); return;
  }

  if (payload.scope !== '2fa') {
    res.status(401).json({ error: 'Geçersiz token kapsamı' }); return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, createdAt: true, twoFactorSecret: true },
  });
  if (!user?.twoFactorSecret) { res.status(401).json({ error: 'Kullanıcı bulunamadı' }); return; }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!valid) {
    await logSecurityEvent(req.ip ?? 'unknown', '/auth/2fa/verify', `Başarısız 2FA: user #${user.id}`);
    res.status(401).json({ error: 'Geçersiz 2FA kodu' }); return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const authToken = jwt.sign({ userId: user.id }, process.env['JWT_SECRET']!, { expiresIn: '24h' });
  const refreshTokenValue = crypto.randomBytes(40).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    token: authToken,
    refreshToken: refreshTokenValue,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
});

// GET /auth/verify-email/:token
router.get('/verify-email/:token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token as string } });

  if (!user) {
    res.redirect('https://chekkify.com/login?error=invalid_token');
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  res.redirect('https://chekkify.com/login?verified=1');
});

// POST /auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: 'Email gerekli' }); return; }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    res.json({ message: 'Eğer email doğrulanmamışsa yeni link gönderildi' });
    return;
  }

  const newToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: newToken } });

  const verifyUrl = `https://checkify-production.up.railway.app/auth/verify-email/${newToken}`;
  const { sendVerificationEmail } = await import('../lib/mailer');
  sendVerificationEmail(user.email, user.name ?? user.email, verifyUrl)
    .catch(err => console.error('[auth] Verification email gönderilemedi:', err));

  res.json({ message: 'Doğrulama emaili gönderildi' });
});

export default router;
