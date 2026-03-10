import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, name, password } = req.body as {
    email?: string;
    name?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'Email ve şifre zorunlu' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Bu email zaten kayıtlı' });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, password: hashed },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = jwt.sign({ userId: user.id }, process.env['JWT_SECRET']!, { expiresIn: '7d' });

  res.status(201).json({ user, token });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email ve şifre zorunlu' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Geçersiz email veya şifre' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Geçersiz email veya şifre' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env['JWT_SECRET']!, { expiresIn: '7d' });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token,
  });
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, createdAt: true, lastLoginAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }

  res.json({ user });
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
    select: { id: true, email: true, name: true, createdAt: true, lastLoginAt: true },
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

export default router;
