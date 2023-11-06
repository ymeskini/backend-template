import http from 'http';
import express from 'express';
import * as Sentry from '@sentry/node';
import z from 'zod';

import { __DEV__, envVariables } from './utils/env';
import { initMiddleware } from './middleware';
import { logger } from './utils/logger';
import { globalErrorHandler } from './utils/errorHandler';
import { AppError } from './utils/AppError';
import { makeTypeSafeHandler } from './utils/makeTypeSafeHandler';

const app = express();
const server = http.createServer(app);

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

// keep this before all routes
initMiddleware(app);

// ==== ROUTES ====
app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store').status(200).json({ message: 'OK' });
});

app.get(
  '/hello/:id',
  makeTypeSafeHandler(
    {
      body: z.object({
        name: z.string(),
      }),
      response: z.object({
        message: z.string(),
      }),
    },
    (req, res) => {
      const { name } = req.body;
      res.json({ message: `Hello ${name}` });
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
