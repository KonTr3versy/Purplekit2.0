import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

// Global for hot reload in development
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

if (config.isDev) {
  globalForRedis.redis = redis;
}

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    logger.info('✅ Connected to Redis');
  } catch (error) {
    // ioredis auto-reconnects, so just log warning
    if ((error as Error).message?.includes('already connecting')) {
      logger.info('✅ Redis already connected');
    } else {
      logger.warn('⚠️ Redis connection issue (will retry)', error);
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Disconnected from Redis');
}

// Cache helpers
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
