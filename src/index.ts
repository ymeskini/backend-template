import http from 'http';
import express from 'express';
import * as Sentry from '@sentry/node';
import { WebSocketServer } from 'ws';
import { MongoClient } from 'mongodb';

import { __DEV__, envVariables } from './lib/env';
import { initMiddleware } from './infra/middleware';
import { logger } from './lib/logger';
import { globalErrorHandler } from './infra/middleware/errorHandler';
import { AppError } from './lib/AppError';
import { RealtimeRepository } from './infra/realtime.gateway';
import { redis } from './infra/modules/redis';
import { authRouter } from './infra/auth.routes';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const mongoClient = new MongoClient(envVariables.MONGO_DB_URL);
const realtimeRepository = new RealtimeRepository(wss, redis);

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
  await mongoClient.connect();
  await redis.connect();
  await realtimeRepository.init();

  // keep this before all routes
  initMiddleware(app, redis);

  // ==== ROUTES ====
  app.use('/auth', authRouter);
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
