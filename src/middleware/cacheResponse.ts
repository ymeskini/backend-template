import { Handler, Request } from 'express';
import { RedisRepository } from '../infra/redis.repository';

export const cacheResponse =
  <T>(
    redisRepository: RedisRepository,
    keyExtractor: (req: Request) => string,
    ttl = 10,
  ): Handler =>
  async (req, res, next) => {
    const redisKey = redisRepository.keyGenerator(keyExtractor(req));
    const cachedValue = await redisRepository.getJson<T>(redisKey);

    if (cachedValue) {
      return res.json(cachedValue);
    } else {
      const originalJson = res.json;
      res.json = (body) => {
        res.once('finish', async () => {
          await redisRepository.setJson(redisKey, ttl, body);
        });
        return originalJson.call(res, body);
      };
    }

    return next();
  };
