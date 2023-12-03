import { Router } from 'express';
import { generateToken } from '../lib/token';
import { catchAsync } from '../lib/catchAsync';

const authRouter = Router();

authRouter.get(
  '/ws',
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
