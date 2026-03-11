import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { adminJwt, AdminRequest } from '../middleware/adminAuth';

const router = Router();

function signAdminToken(email: string): string {
  const secret = process.env['ADMIN_JWT_SECRET']!;
  return jwt.sign({ adminEmail: email, scope: 'admin' }, secret, { expiresIn: '8h' });
}

// POST /admin-auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email ve şifre gerekli' });
    return;
  }

  const adminEmail = process.env['ADMIN_EMAIL'];
  if (!adminEmail || email.toLowerCase() !== adminEmail.toLowerCase()) {
    res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
    return;
  }

  const cred = await prisma.adminCredential.findUnique({ where: { email: adminEmail } });
  if (!cred) {
    res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
    return;
  }

  const valid = await bcrypt.compare(password, cred.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
    return;
  }

  const token = signAdminToken(adminEmail);
  res.json({ adminToken: token, email: adminEmail, expiresIn: '8h' });
});

// POST /admin-auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Çıkış yapıldı' });
});

// GET /admin-auth/me
router.get('/me', adminJwt, (req: AdminRequest, res: Response): void => {
  res.json({ email: req.adminEmail });
});

// POST /admin-auth/reset-password
router.post('/reset-password', adminJwt, async (req: AdminRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Yeni şifre en az 8 karakter olmalı' });
    return;
  }

  const adminEmail = req.adminEmail!;
  const cred = await prisma.adminCredential.findUnique({ where: { email: adminEmail } });
  if (!cred) {
    res.status(404).json({ error: 'Admin bulunamadı' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, cred.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Mevcut şifre hatalı' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.adminCredential.update({
    where: { email: adminEmail },
    data: { passwordHash: newHash },
  });

  res.json({ message: 'Şifre güncellendi' });
});

export default router;
