import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import webhookRouter from './routes/webhook';
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
import { loginRateLimiter, webhookRateLimiter, generalRateLimiter, otpRateLimiter } from './middleware/rateLimiter';
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
app.use('/auth', authRouter);
app.use('/webhook', webhookRateLimiter);
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startAdminPasswordRotation();
});
