import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import webhookRouter from './routes/webhook';
import confirmRouter from './routes/confirm';
import shopifyRouter from './routes/shopify';
import './workers/smsWorker';

const app = express();
const PORT = process.env['PORT'] || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Webhook: raw Buffer olarak al, HMAC doğrulaması için gerekli
app.use('/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use('/auth', authRouter);
app.use('/webhook', webhookRouter);
app.use('/confirm', confirmRouter);
app.use('/shopify', shopifyRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
