import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PLANS, PlanType } from '../lib/plans';

const router = Router();

// GET /plans — tüm planları listele
router.get('/', async (_req, res: Response): Promise<void> => {
  res.json({ plans: PLANS });
});

// GET /plans/current — kullanıcının aktif planı
router.get('/current', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { plan: true, planExpiresAt: true, billingCycle: true },
  });

  if (!user) { res.status(404).json({ error: 'Kullanıcı bulunamadı' }); return; }

  res.json({
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    billingCycle: user.billingCycle,
    config: PLANS[user.plan as PlanType],
  });
});

// POST /plans/upgrade { plan, billingCycle }
router.post('/upgrade', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { plan, billingCycle = 'monthly' } = req.body as { plan?: string; billingCycle?: string };

  if (!plan || !['FREE', 'STARTER', 'PRO', 'BUSINESS'].includes(plan)) {
    res.status(400).json({ error: 'Geçerli plan: FREE, STARTER, PRO, BUSINESS' });
    return;
  }
  if (!['monthly', 'yearly'].includes(billingCycle)) {
    res.status(400).json({ error: 'billingCycle: monthly veya yearly' });
    return;
  }

  const days = billingCycle === 'yearly' ? 365 : 30;
  const expiresAt = plan === 'FREE' ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { plan: plan as PlanType, billingCycle, planExpiresAt: expiresAt },
      select: { id: true, email: true, plan: true, billingCycle: true, planExpiresAt: true },
    }),
    prisma.subscription.create({
      data: {
        userId: req.userId!,
        plan: plan as PlanType,
        billingCycle,
        expiresAt,
      },
    }),
  ]);

  res.json({ user, config: PLANS[plan as PlanType], message: `${plan} planına geçildi` });
});

export default router;
