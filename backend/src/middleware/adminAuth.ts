import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminRequest extends Request {
  adminEmail?: string;
}

export function adminJwt(req: AdminRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin token gerekli' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env['ADMIN_JWT_SECRET'];

  if (!secret) {
    res.status(500).json({ error: 'Sunucu yapılandırma hatası' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { adminEmail: string; scope: string };
    if (payload.scope !== 'admin') {
      res.status(403).json({ error: 'Yetkisiz erişim' });
      return;
    }
    req.adminEmail = payload.adminEmail;
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş admin token' });
  }
}
