import express, { Express } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import session from 'express-session';
import RedisStore from 'connect-redis';

import { RedisClientType } from '..';
import { envVariables } from '../utils/env';

export const initMiddleware = (app: Express, redis: RedisClientType) => {
  const redisStore = new RedisStore({
    client: redis,
    prefix: 'session:',
  });

  app
    // The request handler must be the first middleware on the app
    .use(Sentry.Handlers.requestHandler())
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(compression())
    .use(cors())
    .use(helmet())
    .use(
      session({
        store: redisStore,
        resave: false, // required: force lightweight session keep alive (touch)
        saveUninitialized: true, // recommended: only save session when data exists
        secret: envVariables.SESSION_SECRET,
      }),
    );
};
