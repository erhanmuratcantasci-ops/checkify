import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import Redis from 'ioredis';
import { logSecurityEvent } from '../lib/securityLog';
import { Request, Response } from 'express';

const redis = new Redis({
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
});

function getClientKey(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) {
    // Cloudflare header zaten client başına unique, exact match yeterli.
    return cf;
  }
  // Fallback: express-rate-limit'in IPv6-safe helper'ı (/56 subnet aggregation).
  return req.ip ? ipKeyGenerator(req.ip) : 'unknown';
}

const SMS_LIMIT_PER_HOUR = 100;

export async function checkSmsRateLimit(shopId: number): Promise<{ allowed: boolean; remaining: number }> {
  const key = `sms:rate:shop:${shopId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 3600);
  }
  const remaining = Math.max(0, SMS_LIMIT_PER_HOUR - count);
  return { allowed: count <= SMS_LIMIT_PER_HOUR, remaining };
}

// Genel: 100 istek/15 dakika per IP
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek. Lütfen bekleyin.' },
  keyGenerator: (req: Request) => getClientKey(req),
  handler: (req: Request, res: Response) => {
    const ip = getClientKey(req);
    logSecurityEvent(ip, req.path, 'Genel rate limit aşıldı').catch(() => {});
    res.status(429).json({ error: 'Çok fazla istek. Lütfen bekleyin.' });
  },
});

// Auth: 5 istek/15 dakika per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' },
  keyGenerator: (req: Request) => getClientKey(req),
  handler: (req: Request, res: Response) => {
    const ip = getClientKey(req);
    logSecurityEvent(ip, req.path, 'Auth rate limit aşıldı').catch(() => {});
    res.status(429).json({ error: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' });
  },
});

// OTP: 10 istek/15 dakika per IP (IP bazlı brute force koruması)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla OTP denemesi. 15 dakika sonra tekrar deneyin.' },
  keyGenerator: (req: Request) => getClientKey(req),
  handler: (req: Request, res: Response) => {
    const ip = getClientKey(req);
    logSecurityEvent(ip, req.path, 'OTP rate limit aşıldı — olası brute force').catch(() => {});
    res.status(429).json({ error: 'Çok fazla OTP denemesi. 15 dakika sonra tekrar deneyin.' });
  },
});

// Webhook: 60 istek/dakika per IP
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla webhook isteği.' },
  keyGenerator: (req: Request) => getClientKey(req),
  handler: (req: Request, res: Response) => {
    const ip = getClientKey(req);
    logSecurityEvent(ip, req.path, 'Webhook rate limit aşıldı').catch(() => {});
    res.status(429).json({ error: 'Çok fazla webhook isteği.' });
  },
});
