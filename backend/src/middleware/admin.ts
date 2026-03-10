import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';

export async function adminOnly(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token gerekli' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let userId: number;
  try {
    const payload = jwt.verify(token, process.env['JWT_SECRET']!) as { userId: number };
    userId = payload.userId;
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  });

  if (!user?.isAdmin) {
    res.status(403).json({ error: 'Yetkisiz erişim' });
    return;
  }

  req.userId = userId;
  next();
}
