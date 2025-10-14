/**
 * Client-Side Caching Utility
 * 
 * Provides in-memory caching for frequently accessed data
 * with TTL (time-to-live) support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default TTL: 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get or fetch data with caching
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }
}

// Global cache instance
export const cache = new Cache();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.clearExpired();
  }, 5 * 60 * 1000);
}

/**
 * Cache key generators for common data types
 */
export const cacheKeys = {
  customer: (id: string) => `customer:${id}`,
  customers: (filters?: string) => `customers:${filters || 'all'}`,
  job: (id: string) => `job:${id}`,
  jobs: (filters?: string) => `jobs:${filters || 'all'}`,
  invoice: (id: string) => `invoice:${id}`,
  invoices: (filters?: string) => `invoices:${filters || 'all'}`,
  stats: (type: string) => `stats:${type}`,
  settings: () => 'settings',
  integrations: () => 'integrations',
};

/**
 * Invalidate related cache entries
 */
export function invalidateCache(pattern: string): void {
  const keys = Array.from(cache['cache'].keys());
  for (const key of keys) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Example usage:
 * 
 * // Fetch with caching
 * const customer = await cache.getOrFetch(
 *   cacheKeys.customer(customerId),
 *   async () => {
 *     const response = await fetch(`/api/customers/${customerId}`);
 *     return response.json();
 *   },
 *   10 * 60 * 1000 // 10 minutes TTL
 * );
 * 
 * // Invalidate cache after mutation
 * await updateCustomer(customerId, data);
 * invalidateCache('customer:');
 * invalidateCache('customers:');
 */

/**
 * React hook for cached data fetching
 */
import { useState, useEffect } from 'react';

export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await cache.getOrFetch(key, fetchFn, ttl);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [key, fetchFn, ttl]);

  const refetch = async () => {
    cache.delete(key);
    setIsLoading(true);
    try {
      const result = await cache.getOrFetch(key, fetchFn, ttl);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * LocalStorage-backed cache for persistence
 */
export class PersistentCache {
  private prefix: string;

  constructor(prefix: string = 'cortiware_cache_') {
    this.prefix = prefix;
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry = JSON.parse(item) as CacheEntry<T>;
      const now = Date.now();

      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): void {
    if (typeof window === 'undefined') return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch {
      // LocalStorage full or unavailable
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}

export const persistentCache = new PersistentCache();

