import express, { Express } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import session from 'express-session';
import RedisStore from 'connect-redis';

import { __DEV__, envVariables } from '../../lib/env';
import { RedisClientType } from '../modules/redis';

export const initMiddleware = (app: Express, redis: RedisClientType) => {
  const redisStore = new RedisStore({
    client: redis,
    prefix: 'session:',
  });

  app
    .set('trust proxy', 1)
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
        // those options are critical when updating the session
        // and a request is made during the session update (in parallel)
        // when you want to be sure that the session is updated before
        // use this snippet in the handler
        // req.session.save(function(err) {
        //    res.send('OK')
        // })
        resave: false, // required: force lightweight session keep alive (touch)
        saveUninitialized: false, // recommended: only save session when data exists
        secret: envVariables.SESSION_SECRET,
        cookie: {
          secure: !__DEV__,
          httpOnly: true,
          sameSite: 'strict',
        },
      }),
    );
};
