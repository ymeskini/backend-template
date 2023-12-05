import { Router } from 'express';
import { catchAsync } from '../lib/catchAsync';
import { rateLimit } from './middleware/rateLimit';
import { jwtProvider } from '..';

const authRouter = Router();

authRouter.get(
  '/ws',
  rateLimit({ interval: 30, maxHits: 5, type: 'fixed-window' }),
  catchAsync(async (_req, res) => {
    const token = await jwtProvider.generateToken();

    res.json({
      status: 'authenticated',
      token,
    });
  }),
);

export { authRouter };
