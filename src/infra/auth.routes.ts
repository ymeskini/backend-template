import { Router } from 'express';
import { generateToken } from '../lib/token';
import { catchAsync } from '../lib/catchAsync';
import { rateLimit } from './middleware/rateLimit';

const authRouter = Router();

authRouter.get(
  '/ws',
  rateLimit({ interval: 30, maxHits: 5, type: 'fixed-window' }),
  catchAsync(async (_req, res) => {
    const token = await generateToken({
      userId: '123',
      scopes: [],
    });

    res.json({
      status: 'authenticated',
      token,
    });
  }),
);

export { authRouter };
