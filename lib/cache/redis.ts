import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';
import { logError } from '@/lib/logger';

/**
 * Redis Cache Service
 * Provides caching functionality using Upstash Redis
 */

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Cache TTL configurations (in seconds)
 */
export const CACHE_TTL = {
  PRODUCT_LISTING: 5 * 60, // 5 minutes
  MARKET_STAND_DATA: 10 * 60, // 10 minutes
  USER_PROFILE: 15 * 60, // 15 minutes
  STATIC_CONTENT: 60 * 60, // 1 hour
  USER_SESSION: 24 * 60 * 60, // 24 hours
} as const;

/**
 * Cache key prefixes for organization
 */
export const CACHE_KEYS = {
  PRODUCT: 'product',
  PRODUCTS_LIST: 'products:list',
  PRODUCTS_BY_STAND: 'products:stand',
  PRODUCTS_BY_USER: 'products:user',
  MARKET_STAND: 'stand',
  MARKET_STANDS_LIST: 'stands:list',
  MARKET_STANDS_BY_LOCATION: 'stands:location',
  MARKET_STANDS_BY_USER: 'stands:user',
  USER_PROFILE: 'user:profile',
  USER_SESSION: 'user:session',
} as const;

/**
 * Generate cache key
 */
export function generateCacheKey(prefix: string, ...parts: (string | number | boolean)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Get value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    logError(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.PRODUCT_LISTING
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logError(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    logError(`Cache delete error for key ${key}:`, error);
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logError(`Cache delete pattern error for pattern ${pattern}:`, error);
  }
}

/**
 * Invalidate all product-related caches
 */
export async function invalidateProductCaches(productId?: string): Promise<void> {
  try {
    const patterns = [
      `${CACHE_KEYS.PRODUCTS_LIST}:*`,
      `${CACHE_KEYS.PRODUCTS_BY_STAND}:*`,
      `${CACHE_KEYS.PRODUCTS_BY_USER}:*`,
    ];

    if (productId) {
      patterns.push(generateCacheKey(CACHE_KEYS.PRODUCT, productId));
    }

    await Promise.all(patterns.map(pattern => deleteByPattern(pattern)));
  } catch (error) {
    logError('Product cache invalidation error:', error);
  }
}

/**
 * Invalidate all market stand-related caches
 */
export async function invalidateMarketStandCaches(standId?: string): Promise<void> {
  try {
    const patterns = [
      `${CACHE_KEYS.MARKET_STANDS_LIST}:*`,
      `${CACHE_KEYS.MARKET_STANDS_BY_LOCATION}:*`,
      `${CACHE_KEYS.MARKET_STANDS_BY_USER}:*`,
      `${CACHE_KEYS.PRODUCTS_BY_STAND}:*`, // Also invalidate products by stand
    ];

    if (standId) {
      patterns.push(generateCacheKey(CACHE_KEYS.MARKET_STAND, standId));
    }

    await Promise.all(patterns.map(pattern => deleteByPattern(pattern)));
  } catch (error) {
    logError('Market stand cache invalidation error:', error);
  }
}

/**
 * Invalidate user-related caches
 */
export async function invalidateUserCaches(userId: string): Promise<void> {
  try {
    const patterns = [
      generateCacheKey(CACHE_KEYS.USER_PROFILE, userId),
      `${CACHE_KEYS.PRODUCTS_BY_USER}:${userId}:*`,
      `${CACHE_KEYS.MARKET_STANDS_BY_USER}:${userId}:*`,
    ];

    await Promise.all(patterns.map(pattern => deleteByPattern(pattern)));
  } catch (error) {
    logError('User cache invalidation error:', error);
  }
}

/**
 * Cache-aside pattern helper
 * Checks cache first, if miss, executes function and caches result
 */
export async function cacheAside<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from source
  const data = await fetchFn();

  // Store in cache (don't await to avoid blocking)
  setCached(key, data, ttl).catch(err =>
    logError(`Background cache set failed for key ${key}:`, err)
  );

  return data;
}

/**
 * Batch cache operations for better performance
 */
export async function batchGetCached<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();
    return results as (T | null)[];
  } catch (error) {
    logError('Batch cache get error:', error);
    return keys.map(() => null);
  }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logError('Redis health check failed:', error);
    return false;
  }
}

export { redis };
