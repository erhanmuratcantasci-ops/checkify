import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { adminOnly } from '../middleware/admin';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /admin/users — tüm kullanıcılar + shop sayısı
router.get('/users', adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      smsCredits: true,
      isAdmin: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { shops: true } },
    },
  });

  res.json({
    users: users.map(u => ({
      ...u,
      shopCount: u._count.shops,
      _count: undefined,
    })),
  });
});

// PATCH /admin/users/:id — isAdmin toggle veya güncelleme
router.patch('/users/:id', adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }

  const { isAdmin } = req.body as { isAdmin?: boolean };

  if (typeof isAdmin !== 'boolean') {
    res.status(400).json({ error: 'isAdmin boolean olmalı' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isAdmin },
    select: { id: true, email: true, name: true, isAdmin: true, smsCredits: true },
  });

  res.json({ user });
});

// POST /admin/users/:id/credits — kullanıcıya manuel kredi yükle
router.post('/users/:id/credits', adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }

  const { amount, description } = req.body as { amount?: number; description?: string };

  if (!amount || typeof amount !== 'number' || amount === 0) {
    res.status(400).json({ error: 'Geçerli bir miktar girin' });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { smsCredits: { increment: amount } },
      select: { id: true, email: true, name: true, smsCredits: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: id,
        amount,
        type: amount > 0 ? 'PURCHASE' : 'USAGE',
        description: description || `Admin tarafından ${amount > 0 ? 'yüklendi' : 'düşüldü'}: ${amount} kredi`,
      },
    }),
  ]);

  res.json({ user, message: `${amount} kredi ${amount > 0 ? 'eklendi' : 'düşüldü'}` });
});

// GET /admin/users/:id — kullanıcı detayı
router.get('/users/:id', adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, smsCredits: true,
      isAdmin: true, createdAt: true, lastLoginAt: true,
      _count: { select: { shops: true } },
      shops: { include: { _count: { select: { orders: true } } } },
    },
  });
  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }

  const orderCount = user.shops.reduce((sum, s) => sum + s._count.orders, 0);
  res.json({ user: { ...user, shopCount: user._count.shops, orderCount, shops: undefined, _count: undefined } });
});

// DELETE /admin/users/:id — kullanıcı sil
router.delete('/users/:id', adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Geçersiz id' }); return; }

  if (req.userId === id) { res.status(400).json({ error: 'Kendinizi silemezsiniz' }); return; }

  await prisma.user.delete({ where: { id } });
  res.json({ message: 'Kullanıcı silindi' });
});

// GET /admin/shops — tüm mağazalar
router.get('/shops', adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, shopDomain: true, createdAt: true,
      user: { select: { id: true, email: true, name: true } },
      _count: { select: { orders: true } },
    },
  });

  res.json({
    shops: shops.map(s => ({ ...s, orderCount: s._count.orders, _count: undefined })),
  });
});

// GET /admin/stats — platform geneli istatistikler
router.get('/stats', adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  const [totalUsers, totalOrders, totalSMS, totalCredits] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.sMSLog.count({ where: { status: 'SENT' } }),
    prisma.user.aggregate({ _sum: { smsCredits: true } }),
  ]);

  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  res.json({
    totalUsers,
    totalOrders,
    totalSMSSent: totalSMS,
    totalCreditsInSystem: totalCredits._sum.smsCredits ?? 0,
    ordersByStatus: Object.fromEntries(ordersByStatus.map(g => [g.status, g._count._all])),
  });
});

export default router;
