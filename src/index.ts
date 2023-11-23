import http from 'http';
import express from 'express';
import * as Sentry from '@sentry/node';
import z from 'zod';
import { WebSocketServer } from 'ws';

import { __DEV__, envVariables } from './lib/env';
import { initMiddleware } from './infra/middleware';
import { logger } from './lib/logger';
import { globalErrorHandler } from './lib/errorHandler';
import { AppError } from './lib/AppError';
import { makeTypeSafeHandler } from './lib/makeTypeSafeHandler';
import { RetrieveGithubUserUseCase } from './app/usecases/retrieve-github-user.usecase';
import { GithubUserApiRepository } from './infra/github-user.api.repository';
import { GithubUserSchema } from './domain/github-user';
import { cacheResponse } from './infra/middleware/cacheResponse';
import { RedisRepository } from './infra/redis.repository';
import { rateLimit } from './infra/middleware/rateLimit';
import { RealtimeRepository } from './infra/realtime.gateway';
import { redis } from './infra/modules/redis';
import { catchAsync } from './lib/catchAsync';
import { generateToken } from './lib/token';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const realtimeRepository = new RealtimeRepository(wss, redis);
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
  await realtimeRepository.init();

  // keep this before all routes
  initMiddleware(app, redis);

  // ==== ROUTES ====
  app
    .get(
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
        catchAsync(async (req, res) => {
          const { username } = req.params;
          const githubUser = await retrieveGithubUserUseCase.handle(username);
          res.json(githubUser);
        }),
      ),
    )
    .get('/ws/auth', (_req, res) => {
      // TODO: check in the session if you want to authenticate the user
      // for websocket connection
      res.json({
        status: 'authenticated',
        token: generateToken({
          userId: '123',
        }),
      });
    });
  // ================

  app
    .all('*', (_req, _res, next) => {
      next(new AppError('Not Found', 404));
    })
    .use(Sentry.Handlers.errorHandler())
    .use(globalErrorHandler());

  server.listen(envVariables.PORT, () => {
    logger.info(`Server is running at http://localhost:${envVariables.PORT}`);
  });
};

start();
