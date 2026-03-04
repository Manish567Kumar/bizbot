import 'dotenv/config';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import app from './app';

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
