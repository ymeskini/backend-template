import { z } from 'zod';

const envSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  EMAIL_SUPPORT: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('4444'),
  POSTMARK_API_KEY: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_PORT: z.string().default('6379'),
  SENTRY_DSN: z.string().optional(),
  SESSION_SECRET: z.string(),
});

export const envVariables = envSchema.parse(process.env);
export const __DEV__ = envVariables.NODE_ENV === 'development';
