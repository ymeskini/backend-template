import express, { Express } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';

export const initMiddleware = (app: Express) => {
  app
    // The request handler must be the first middleware on the app
    .use(Sentry.Handlers.requestHandler())
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(compression())
    .use(cors())
    .use(helmet());
};
