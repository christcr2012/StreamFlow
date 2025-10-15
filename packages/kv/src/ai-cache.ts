/**
 * @cortiware/kv - AI Response Caching Layer
 * 
 * PURPOSE:
 * Provides Redis-backed caching for AI responses to reduce costs and improve performance.
 * Implements cache-aside pattern with automatic TTL management.
 * 
 * FEATURES:
 * - Distributed caching across all instances (via Vercel KV/Redis)
 * - Automatic cache key generation from content hashes
 * - Configurable TTL per cache type
 * - Cache hit/miss metrics tracking
 * - Graceful fallback to in-memory cache if Redis unavailable
 * 
 * COST OPTIMIZATION:
 * - Estimated 20-30% additional AI cost reduction on top of Phase 1 savings
 * - Shares cached responses across all users and instances
 * - Reduces redundant AI API calls for identical queries
 * 
 * USAGE:
 * ```typescript
 * import { getAICachedResponse, setAICachedResponse } from '@cortiware/kv';
 * 
 * const cached = await getAICachedResponse('lead-analysis', leadContent);
 * if (cached) return cached;
 * 
 * const result = await callAI(leadContent);
 * await setAICachedResponse('lead-analysis', leadContent, result);
 * ```
 */

import { createHash } from 'crypto';
import { getKVClient } from './index';

/**
 * AI Cache Types
 * Different cache types can have different TTLs
 */
export type AICacheType =
  | 'lead-analysis'
  | 'rfp-analysis'
  | 'pricing-advice'
  | 'email-response'
  | 'batch-analysis'
  | 'generic';

/**
 * Cache TTL Configuration (in seconds)
 * Longer TTLs for stable content, shorter for dynamic content
 */
const CACHE_TTL: Record<AICacheType, number> = {
  'lead-analysis': 24 * 60 * 60,      // 24 hours - leads don't change often
  'rfp-analysis': 48 * 60 * 60,       // 48 hours - RFPs are stable
  'pricing-advice': 12 * 60 * 60,     // 12 hours - pricing may change
  'email-response': 6 * 60 * 60,      // 6 hours - context-dependent
  'batch-analysis': 24 * 60 * 60,     // 24 hours - batch results stable
  'generic': 24 * 60 * 60,            // 24 hours - default
};

/**
 * Cache Metrics
 * Track cache performance for monitoring
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  lastUpdated: number;
}

// In-memory metrics (reset on restart)
const metrics: Record<AICacheType, CacheMetrics> = {
  'lead-analysis': { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() },
  'rfp-analysis': { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() },
  'pricing-advice': { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() },
  'email-response': { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() },
  'batch-analysis': { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() },
  'generic': { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() },
};

/**
 * Generate cache key from content
 * Uses SHA-256 hash for consistent, collision-resistant keys
 * 
 * @param cacheType - Type of AI cache (determines TTL)
 * @param content - Content to hash (prompt, input data, etc.)
 * @returns Cache key in format: ai:{type}:{hash}
 */
export function generateAICacheKey(cacheType: AICacheType, content: string): string {
  const hash = createHash('sha256').update(content).digest('hex');
  return `ai:${cacheType}:${hash}`;
}

/**
 * Get cached AI response
 * Returns null if not found or expired
 * 
 * @param cacheType - Type of AI cache
 * @param content - Content to hash for cache key
 * @returns Cached response or null
 */
export async function getAICachedResponse<T = any>(
  cacheType: AICacheType,
  content: string
): Promise<T | null> {
  try {
    const kv = getKVClient();
    const key = generateAICacheKey(cacheType, content);
    
    const cached = await kv.get<string>(key);
    
    if (cached) {
      // Cache hit
      metrics[cacheType].hits++;
      metrics[cacheType].lastUpdated = Date.now();
      
      return JSON.parse(cached) as T;
    }
    
    // Cache miss
    metrics[cacheType].misses++;
    metrics[cacheType].lastUpdated = Date.now();
    
    return null;
  } catch (error) {
    // Log error but don't throw - graceful degradation
    console.error(`AI cache get error (${cacheType}):`, error);
    metrics[cacheType].errors++;
    metrics[cacheType].lastUpdated = Date.now();
    
    return null;
  }
}

/**
 * Set cached AI response
 * Stores response with automatic TTL based on cache type
 * 
 * @param cacheType - Type of AI cache (determines TTL)
 * @param content - Content to hash for cache key
 * @param response - AI response to cache
 * @param customTTL - Optional custom TTL in seconds (overrides default)
 */
export async function setAICachedResponse<T = any>(
  cacheType: AICacheType,
  content: string,
  response: T,
  customTTL?: number
): Promise<void> {
  try {
    const kv = getKVClient();
    const key = generateAICacheKey(cacheType, content);
    const ttl = customTTL ?? CACHE_TTL[cacheType];
    
    await kv.set(key, JSON.stringify(response), { ex: ttl });
  } catch (error) {
    // Log error but don't throw - graceful degradation
    console.error(`AI cache set error (${cacheType}):`, error);
    metrics[cacheType].errors++;
    metrics[cacheType].lastUpdated = Date.now();
  }
}

/**
 * Delete cached AI response
 * Useful for cache invalidation
 * 
 * @param cacheType - Type of AI cache
 * @param content - Content to hash for cache key
 */
export async function deleteAICachedResponse(
  cacheType: AICacheType,
  content: string
): Promise<void> {
  try {
    const kv = getKVClient();
    const key = generateAICacheKey(cacheType, content);
    
    await kv.del(key);
  } catch (error) {
    console.error(`AI cache delete error (${cacheType}):`, error);
    metrics[cacheType].errors++;
    metrics[cacheType].lastUpdated = Date.now();
  }
}

/**
 * Check if AI response is cached
 * Useful for cache warming or pre-checking
 * 
 * @param cacheType - Type of AI cache
 * @param content - Content to hash for cache key
 * @returns True if cached, false otherwise
 */
export async function hasAICachedResponse(
  cacheType: AICacheType,
  content: string
): Promise<boolean> {
  try {
    const kv = getKVClient();
    const key = generateAICacheKey(cacheType, content);
    
    return await kv.exists(key);
  } catch (error) {
    console.error(`AI cache exists error (${cacheType}):`, error);
    return false;
  }
}

/**
 * Get cache metrics for monitoring
 * Returns hit rate, miss rate, and error rate
 * 
 * @param cacheType - Type of AI cache (optional, returns all if not specified)
 * @returns Cache metrics
 */
export function getAICacheMetrics(cacheType?: AICacheType): CacheMetrics | Record<AICacheType, CacheMetrics> {
  if (cacheType) {
    return { ...metrics[cacheType] };
  }
  
  // Return all metrics
  return Object.entries(metrics).reduce((acc, [type, metric]) => {
    acc[type as AICacheType] = { ...metric };
    return acc;
  }, {} as Record<AICacheType, CacheMetrics>);
}

/**
 * Calculate cache hit rate
 * 
 * @param cacheType - Type of AI cache
 * @returns Hit rate as percentage (0-100)
 */
export function getAICacheHitRate(cacheType: AICacheType): number {
  const metric = metrics[cacheType];
  const total = metric.hits + metric.misses;
  
  if (total === 0) return 0;
  
  return (metric.hits / total) * 100;
}

/**
 * Reset cache metrics
 * Useful for testing or periodic resets
 * 
 * @param cacheType - Type of AI cache (optional, resets all if not specified)
 */
export function resetAICacheMetrics(cacheType?: AICacheType): void {
  if (cacheType) {
    metrics[cacheType] = { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() };
  } else {
    // Reset all metrics
    Object.keys(metrics).forEach((type) => {
      metrics[type as AICacheType] = { hits: 0, misses: 0, errors: 0, lastUpdated: Date.now() };
    });
  }
}

/**
 * Warm cache with common queries
 * Pre-populate cache with frequently used AI responses
 * 
 * @param cacheType - Type of AI cache
 * @param entries - Array of [content, response] tuples to cache
 */
export async function warmAICache<T = any>(
  cacheType: AICacheType,
  entries: Array<[string, T]>
): Promise<void> {
  const promises = entries.map(([content, response]) =>
    setAICachedResponse(cacheType, content, response)
  );
  
  await Promise.all(promises);
}

/**
 * Batch get cached AI responses
 * Efficiently retrieve multiple cached responses
 * 
 * @param cacheType - Type of AI cache
 * @param contents - Array of content strings to check
 * @returns Array of cached responses (null for cache misses)
 */
export async function batchGetAICachedResponses<T = any>(
  cacheType: AICacheType,
  contents: string[]
): Promise<Array<T | null>> {
  const promises = contents.map((content) =>
    getAICachedResponse<T>(cacheType, content)
  );
  
  return Promise.all(promises);
}

/**
 * Batch set cached AI responses
 * Efficiently store multiple AI responses
 * 
 * @param cacheType - Type of AI cache
 * @param entries - Array of [content, response] tuples to cache
 * @param customTTL - Optional custom TTL in seconds
 */
export async function batchSetAICachedResponses<T = any>(
  cacheType: AICacheType,
  entries: Array<[string, T]>,
  customTTL?: number
): Promise<void> {
  const promises = entries.map(([content, response]) =>
    setAICachedResponse(cacheType, content, response, customTTL)
  );
  
  await Promise.all(promises);
}

