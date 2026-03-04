import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  MSG91_AUTH_KEY: z.string().min(1, 'MSG91_AUTH_KEY is required'),
  MSG91_TEMPLATE_ID: z.string().min(1, 'MSG91_TEMPLATE_ID is required'),
  MSG91_SENDER_ID: z.string().default('BIZBOTAPP'),

  META_VERIFY_TOKEN: z.string().min(1, 'META_VERIFY_TOKEN is required'),
  META_APP_SECRET: z.string().min(1, 'META_APP_SECRET is required'),
  META_API_VERSION: z.string().default('v18.0'),
  META_ACCESS_TOKEN: z.string().min(1, 'META_ACCESS_TOKEN is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
