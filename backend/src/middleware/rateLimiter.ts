import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
});

const SMS_LIMIT_PER_HOUR = 100;

// Her shop için saatte max 100 SMS (Redis fixed window)
export async function checkSmsRateLimit(shopId: number): Promise<{ allowed: boolean; remaining: number }> {
  const key = `sms:rate:shop:${shopId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 3600); // 1 saat
  }
  const remaining = Math.max(0, SMS_LIMIT_PER_HOUR - count);
  return { allowed: count <= SMS_LIMIT_PER_HOUR, remaining };
}

// /auth/login ve /auth/register: IP başına 5 dakikada max 10 deneme
export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek. 5 dakika sonra tekrar deneyin.' },
});

// /webhook: IP başına dakikada max 30 istek
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla webhook isteği.' },
});
