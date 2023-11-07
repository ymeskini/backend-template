import { NextFunction, Request, RequestHandler, Response } from 'express';

export const catchAsync = <TParams, TResponse, TBody, TQuery>(
  fn: (
    req: Request<TParams, TResponse, TBody, TQuery, Record<string, any>>,
    res: Response<TResponse, Record<string, any>>,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler<TParams, TResponse, TBody, TQuery, Record<string, any>> => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};
