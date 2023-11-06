import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('4444'),
  NODE_ENV: z.string().default('development'),
  SENTRY_DSN: z.string().optional(),
});

export const envVariables = envSchema.parse(process.env);
export const __DEV__ = envVariables.NODE_ENV === 'development';
