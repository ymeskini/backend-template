import { ErrorRequestHandler, Response } from 'express';
import { STATUS_CODES } from 'http';

import { AppError } from './AppError';
import { __DEV__ } from './env';
import { logger } from './logger';
import { JsonWebTokenError } from 'jsonwebtoken';

const sendErrorDev = (err: AppError, res: Response) => {
  logger.info(err);
  res.status(err.statusCode).json({
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      error: STATUS_CODES[err.statusCode],
    });
  } else {
    // don't leak the error to the client
    logger.error(err);
    res.status(500).json({
      statusCode: 500,
      message: STATUS_CODES[500],
    });
  }
};

export const globalErrorHandler =
  (): ErrorRequestHandler =>
  // don't remove _next in parameters otherwise the middleware won't work
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err, _, res, _next) => {
    err.statusCode = err.statusCode || 500;
    const error = { ...err };

    if (err instanceof JsonWebTokenError) {
      error.statusCode = 401;
      error.isOperational = true;
    }

    if (__DEV__) {
      sendErrorDev(error, res);
    } else {
      sendErrorProd(error, res);
    }
  };
