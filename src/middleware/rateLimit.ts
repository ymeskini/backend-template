import { Handler } from 'express';
import { RedisClientType } from '..';
import { AppError } from '../utils/AppError';

const getCurrentTimestampMs = () => new Date().getTime();
const isTypeOfNumber = (value: unknown): value is number =>
  typeof value === 'number';

/**
 * Record a hit against a unique resource that is being
 * rate limited.  Will return -1 when the resource has hit
 * the rate limit.
 * @param sessionId - the unique name of the resource.
 * @param opts - object containing interval and maxHits details:
 *   {
 *     interval: 1,
 *     maxHits: 5
 *   }
 * @returns Promise that resolves to number of hits remaining,
 *   or 0 if the rate limit has been exceeded..
 */
async function hitFixedWindow(
  client: RedisClientType,
  sessionId: string,
  opts: { interval: number; maxHits: number },
): Promise<number> {
  const key = `limiter:fixed-window:${sessionId}`;
  const [hits] = await client
    .multi()
    .incr(key)
    .expire(key, opts.interval)
    .exec();

  if (!isTypeOfNumber(hits)) {
    throw new Error('Redis error');
  }

  let hitsRemaining: number;

  if (hits > opts.maxHits) {
    // Too many hits.
    hitsRemaining = -1;
  } else {
    // Return number of hits remaining.
    hitsRemaining = opts.maxHits - hits;
  }

  return hitsRemaining;
}

const hitSlidingWindow = async (
  client: RedisClientType,
  sessionId: string,
  opts: {
    interval: number;
    maxHits: number;
  },
) => {
  const key = `limiter:window:${sessionId}`;
  const now = getCurrentTimestampMs();
  const transaction = client.multi();

  const [rangeByScore, added, hits] = await transaction
    .zRemRangeByScore(key, '-inf', now - opts.interval)
    .zAdd(key, {
      score: now,
      value: now.toString(),
    })
    .zCard(key)
    .exec();

  if (
    !isTypeOfNumber(rangeByScore) ||
    !isTypeOfNumber(added) ||
    !isTypeOfNumber(hits)
  ) {
    throw new AppError('Redis error', 500);
  }

  if (hits > opts.maxHits) {
    return -1;
  }

  return opts.maxHits - hits;
};

export const rateLimit =
  (
    redis: RedisClientType,
    config: {
      interval: number;
      maxHits: number;
      type: 'fixed-window' | 'sliding-window';
    },
  ): Handler =>
  async (req, res, next) => {
    try {
      const limiter =
        config.type === 'fixed-window' ? hitFixedWindow : hitSlidingWindow;
      const result = await limiter(redis, req.session.id, config);

      if (result === -1) {
        return res.status(429).json({
          message: 'Rate limit exceeded',
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
