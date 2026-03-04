import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './modules/auth/auth.routes';
import webhookRoutes from './modules/whatsapp/webhook.routes';
import businessRoutes from './modules/business/business.routes';
import customersRoutes from './modules/customers/customers.routes';
import conversationsRoutes from './modules/conversations/conversations.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app = express();

// ─── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.NODE_ENV === 'development' ? '*' : false }));

// Raw body for webhook signature verification MUST come before JSON parser
app.use('/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    (req as express.Request & { rawBody: Buffer }).rawBody = req.body;
    req.body = JSON.parse(req.body.toString());
  }
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(apiRateLimiter);
app.use('/webhook', webhookRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/customers', customersRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 BizBot server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
