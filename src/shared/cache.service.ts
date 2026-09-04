import { config } from '../config';
import redis from './redis';

export const getOrSetCache = async <T>(
  key: string,
  callback: () => Promise<T>
): Promise<{ data: T; cached: boolean }> => {
  const cached = await redis.get(key);

  if (cached) {
    return {
      data: JSON.parse(cached),
      cached: true,
    };
  }

  const freshData = await callback();

  await redis.setex(key, config.redis.ttl, JSON.stringify(freshData));

  return {
    data: freshData,
    cached: false,
  };
};
