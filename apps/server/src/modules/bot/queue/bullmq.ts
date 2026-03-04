import { Queue, Worker, QueueEvents, type Job } from 'bullmq';
import { env } from '../../../config/env';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port) || 6379,
};

// ─── Queues ───────────────────────────────────────────────────────────────────

export const broadcastQueue = new Queue('broadcasts', { connection });
export const reminderQueue = new Queue('reminders', { connection });
export const analyticsQueue = new Queue('analytics', { connection });

// ─── Job Types ────────────────────────────────────────────────────────────────

export interface BroadcastJobData {
  businessId: string;
  phoneNumberId: string;
  customerIds: string[];
  message: string;
  type: 'text' | 'template';
  templateName?: string;
}

export interface ReminderJobData {
  businessId: string;
  phoneNumberId: string;
  customerPhone: string;
  message: string;
}

export interface AnalyticsJobData {
  businessId: string;
  date: string; // ISO date string
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export function startBroadcastWorker(): Worker {
  return new Worker<BroadcastJobData>(
    'broadcasts',
    async (job: Job<BroadcastJobData>) => {
      const { sendTextMessage } = await import('../../../modules/whatsapp/whatsapp.service');
      const { prisma } = await import('../../../config/database');

      for (const customerId of job.data.customerIds) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { phone: true },
        });
        if (!customer) continue;

        await sendTextMessage({
          phoneNumberId: job.data.phoneNumberId,
          to: customer.phone.replace('+', ''),
          message: job.data.message,
        });

        // Throttle: 1 message per 50ms to stay within Meta rate limits
        await new Promise((r) => setTimeout(r, 50));
      }
    },
    { connection, concurrency: 2 },
  );
}

export function startAnalyticsWorker(): Worker {
  return new Worker<AnalyticsJobData>(
    'analytics',
    async (job: Job<AnalyticsJobData>) => {
      const { aggregateDailyAnalytics } = await import('../../analytics/analytics.service');
      await aggregateDailyAnalytics(job.data.businessId, new Date(job.data.date));
    },
    { connection, concurrency: 5 },
  );
}

// ─── Schedule daily analytics ─────────────────────────────────────────────────

export async function scheduleDailyAnalytics(): Promise<void> {
  await analyticsQueue.add(
    'daily-aggregate',
    { businessId: '*', date: new Date().toISOString() },
    {
      repeat: { pattern: '0 1 * * *' }, // 1 AM daily
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  );
}
