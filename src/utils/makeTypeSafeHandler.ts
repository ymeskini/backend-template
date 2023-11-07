import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { ParsedQs } from 'qs';

import { catchAsync } from './catchAsync';

export const makeTypeSafeHandler = <
  TQuery extends ParsedQs = any,
  TBody extends Record<string, any> = any,
  TParams extends Record<string, any> = any,
  TResponse = any,
>(
  config: {
    query?: z.Schema<TQuery>;
    body?: z.Schema<TBody>;
    params?: z.Schema<TParams>;
    response?: z.Schema<TResponse>;
  },
  handler: (
    req: Request<TParams, TResponse, TBody, TQuery>,
    res: Response<TResponse>,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler<TParams, TResponse, TBody, TQuery> => {
  return (req, res, next) => {
    const { query, body, params } = req;
    if (config.query) {
      try {
        config.query.parse(query);
      } catch (e) {
        return res.sendStatus(400);
      }
    }
    if (config.body) {
      try {
        config.body.parse(body);
      } catch (e) {
        return res.sendStatus(400);
      }
    }
    if (config.params) {
      try {
        config.params.parse(params);
      } catch (e) {
        return res.sendStatus(400);
      }
    }

    return catchAsync(handler(req, res, next) as any);
  };
};
