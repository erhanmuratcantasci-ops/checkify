import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import webhookRouter from './routes/webhook';
import gdprRouter from './routes/gdpr';
import confirmRouter from './routes/confirm';
import shopifyRouter from './routes/shopify';
import ordersRouter from './routes/orders';
import shopsRouter from './routes/shops';
import smsTemplatesRouter from './routes/smsTemplates';
import creditsRouter from './routes/credits';
import adminRouter from './routes/admin';
import adminAuthRouter from './routes/adminAuth';
import statusRouter from './routes/status';
import plansRouter from './routes/plans';
import blockingRulesRouter from './routes/blockingRules';
import { loginRateLimiter, webhookRateLimiter, generalRateLimiter, otpRateLimiter, refreshRateLimiter } from './middleware/rateLimiter';
import { realIp } from './middleware/cloudflare';
import './workers/smsWorker';
import { startAdminPasswordRotation } from './jobs/adminPasswordRotation';

const app = express();
const PORT = process.env['PORT'] || 3001;

app.use(helmet());
app.set('trust proxy', true); // proxy arkasında IP doğru alınsın
app.use(realIp);
app.use(generalRateLimiter);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://dashboard-two-indol-38.vercel.app',
    'https://chekkify.com',
    'https://www.chekkify.com',
  ],
  credentials: true,
}));

// Webhook: raw Buffer olarak al, HMAC doğrulaması için gerekli
app.use('/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use('/auth/login', loginRateLimiter);
app.use('/auth/register', loginRateLimiter);
app.use('/auth/forgot-password', loginRateLimiter);
app.use('/auth/refresh', refreshRateLimiter);
app.use('/auth', authRouter);
app.use('/webhook', webhookRateLimiter);
// GDPR routes mounted before the generic webhook router so the more-specific
// /webhook/gdpr/* paths bind first. Both share the express.raw() body parser
// declared above; both verify HMAC before doing any work.
app.use('/webhook/gdpr', gdprRouter);
app.use('/webhook', webhookRouter);
app.use('/confirm/otp', otpRateLimiter);
app.use('/confirm', confirmRouter);
app.use('/shopify', shopifyRouter);
app.use('/orders', ordersRouter);
app.use('/shops', shopsRouter);
app.use('/shops/:id/template', smsTemplatesRouter);
app.use('/credits', creditsRouter);
app.use('/admin', adminRouter);
app.use('/admin-auth', adminAuthRouter);
app.use('/plans', plansRouter);
app.use('/blocking', blockingRulesRouter);

app.use('/status', statusRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler — uncaught error → JSON 500 (HTML değil).
// "The string did not match the expected pattern" frontend bug'ı önler.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error('[Global error]', err);
  if (res.headersSent) return next(err);
  const status =
    err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number'
      ? (err as { status: number }).status
      : 500;
  const message =
    err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
      ? (err as { message: string }).message
      : 'Sunucu hatası';
  const code =
    err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : 'INTERNAL_ERROR';
  res.status(status).json({ error: message, code });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startAdminPasswordRotation();
});
