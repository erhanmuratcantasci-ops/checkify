import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import webhookRouter from './routes/webhook';
import confirmRouter from './routes/confirm';
import shopifyRouter from './routes/shopify';
import ordersRouter from './routes/orders';
import shopsRouter from './routes/shops';
import smsTemplatesRouter from './routes/smsTemplates';
import { loginRateLimiter, webhookRateLimiter } from './middleware/rateLimiter';
import './workers/smsWorker';

const app = express();
const PORT = process.env['PORT'] || 3001;

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));

// Webhook: raw Buffer olarak al, HMAC doğrulaması için gerekli
app.use('/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use('/auth/login', loginRateLimiter);
app.use('/auth/register', loginRateLimiter);
app.use('/auth', authRouter);
app.use('/webhook', webhookRateLimiter);
app.use('/webhook', webhookRouter);
app.use('/confirm', confirmRouter);
app.use('/shopify', shopifyRouter);
app.use('/orders', ordersRouter);
app.use('/shops', shopsRouter);
app.use('/shops/:id/template', smsTemplatesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
