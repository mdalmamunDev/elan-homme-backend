import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redis.url);

// const redis = new Redis({
//   host: config.redis.host,
//   port: config.redis.port,
// });

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redis;
