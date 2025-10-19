/**
 * Redis client for production rate limiting and idempotency
 * Falls back to in-memory stores if Redis is not configured
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  // Support both REDIS_URL and KV_REDIS_URL (Vercel environment variable)
  const redisUrl = process.env.REDIS_URL || process.env.KV_REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL or KV_REDIS_URL not configured, using in-memory stores');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY errors
          return true;
        }
        return false;
      },
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected');
    });

    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
}

