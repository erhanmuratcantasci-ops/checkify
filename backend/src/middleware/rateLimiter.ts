import rateLimit from 'express-rate-limit';

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
