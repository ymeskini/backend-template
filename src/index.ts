import http from 'http';
import express from 'express';
import * as Sentry from '@sentry/node';
import z from 'zod';
import { createClient } from 'redis';

import { __DEV__, envVariables } from './utils/env';
import { initMiddleware } from './middleware';
import { logger } from './utils/logger';
import { globalErrorHandler } from './utils/errorHandler';
import { AppError } from './utils/AppError';
import { makeTypeSafeHandler } from './utils/makeTypeSafeHandler';
import { RetrieveGithubUserUseCase } from './app/usecases/retrieve-github-user.usecase';
import { GithubUserApiRepository } from './infra/github-user.api.repository';
import { GithubUserSchema } from './domain/github-user';
import { cacheResponse } from './middleware/cacheResponse';
import { RedisRepository } from './infra/redis.repository';
import { rateLimit } from './middleware/rateLimit';

const app = express();
const server = http.createServer(app);
const redis = createClient({
  url: envVariables.REDIS_URL,
  password: envVariables.REDIS_PASSWORD,
});

export type RedisClientType = typeof redis;

const redisRepository = new RedisRepository(redis);
const githubUserRepository = new GithubUserApiRepository();
const retrieveGithubUserUseCase = new RetrieveGithubUserUseCase(
  githubUserRepository,
);

Sentry.init({
  enabled: !__DEV__,
  dsn: envVariables.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});

const start = async () => {
  await redis.connect();

  // keep this before all routes
  initMiddleware(app, redis);

  // ==== ROUTES ====
  app.get(
    '/demo/:username',
    rateLimit(redis, {
      interval: 60,
      maxHits: 10,
      type: 'fixed-window',
    }),
    cacheResponse(
      redisRepository,
      (req) => `github-user:${req.params['username']}`,
    ),
    makeTypeSafeHandler(
      {
        params: z.object({
          username: z.string().min(5),
        }),
        response: GithubUserSchema,
      },
      async (req, res, next) => {
        const { username } = req.params;
        const githubUser = await retrieveGithubUserUseCase.handle(username);
        if (githubUser.isErr()) {
          next(githubUser.error);
        } else {
          res.json(githubUser.value);
        }
      },
    ),
  );
  // ================

  app
    .all('*', (_req, _res, next) => {
      next(new AppError('Not Found', 404));
    })
    // The error handler must be before any other error middleware and after all controllers
    .use(Sentry.Handlers.errorHandler())
    .use(globalErrorHandler());

  server.listen(envVariables.PORT, () => {
    logger.info(`Server is running at http://localhost:${envVariables.PORT}`);
  });
};

start();
