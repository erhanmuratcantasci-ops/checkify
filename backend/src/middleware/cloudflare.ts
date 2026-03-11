import { Request, Response, NextFunction } from 'express';

// Cloudflare'den gelen gerçek müşteri IP'sini req.ip'ye yaz
export function realIp(req: Request, _res: Response, next: NextFunction): void {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') {
    // Express'in req.ip'yi override etmek için socket üzerinden set et
    Object.defineProperty(req, 'ip', { value: cfIp, writable: true, configurable: true });
  }
  next();
}
