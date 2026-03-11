import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';
import { hasFeature, isShopLimitReached, PlanType } from '../lib/plans';

export function requireFeature(feature: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true },
    });

    if (!user || !hasFeature(user.plan as PlanType, feature)) {
      res.status(403).json({
        error: 'Bu özellik planınızda mevcut değil',
        upgrade: true,
        requiredFeature: feature,
      });
      return;
    }

    next();
  };
}

export async function requireShopSlot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { plan: true, _count: { select: { shops: true } } },
  });

  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }

  if (isShopLimitReached(user.plan as PlanType, user._count.shops)) {
    res.status(403).json({
      error: 'Mağaza limitine ulaştınız',
      upgrade: true,
      currentCount: user._count.shops,
    });
    return;
  }

  next();
}
