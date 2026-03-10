import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /credits
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.userId },
      select: { smsCredits: true },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }

  res.json({ smsCredits: user.smsCredits, transactions });
});

// POST /credits/add — manuel kredi ekleme (admin/test)
router.post('/add', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, description } = req.body as { amount?: number; description?: string };

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Geçerli bir miktar girin (pozitif tam sayı)' });
    return;
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { smsCredits: { increment: amount } },
      select: { id: true, smsCredits: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: req.userId!,
        amount,
        type: 'PURCHASE',
        description: description || `${amount} kredi yüklendi`,
      },
    }),
  ]);

  res.json({ smsCredits: user.smsCredits, message: `${amount} kredi eklendi` });
});

export default router;
