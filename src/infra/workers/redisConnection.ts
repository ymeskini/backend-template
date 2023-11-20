import { envVariables } from '../../lib/env';

export const sharedRedisConnection = {
  host: envVariables.REDIS_HOST,
  port: Number(envVariables.REDIS_PORT),
  password: envVariables.REDIS_PASSWORD,
};
