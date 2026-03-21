import Redis from 'ioredis';
import config from '../../config/config';
import { logger } from '../logger/index';

const redisUrl = `redis://${config.redis.password ? `:${config.redis.password}@` : ''}${config.redis.host}:${config.redis.port}`;
interface RedisClientOptions {
  maxRetriesPerRequest: number;
  retryStrategy: (times: number) => number;
}

export const redisClient: Redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number): number => Math.min(times * 50, 2000),
} as RedisClientOptions);

redisClient.on('error', (err: Error) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});