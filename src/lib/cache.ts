// src/lib/cache.ts
// Redis-based caching layer for performance optimization
// TODO: Replace with actual Redis client when Redis is available
// For now, using in-memory cache as fallback

// ===== CACHE INTERFACE =====

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

// ===== IN-MEMORY CACHE (FALLBACK) =====

class InMemoryCache {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
    this.stats.sets++;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.stats.deletes++;
  }

  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

// ===== CACHE SERVICE =====

export class CacheService {
  private backend: InMemoryCache;
  private defaultTTL: number = 3600; // 1 hour
  private prefix: string = 'sf:'; // StreamFlow prefix

  constructor() {
    // TODO: Initialize Redis client when available
    // For now, use in-memory cache
    this.backend = new InMemoryCache();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;
    return this.backend.get<T>(fullKey);
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const fullKey = this.prefix + key;
    await this.backend.set(fullKey, value, ttl || this.defaultTTL);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await this.backend.delete(fullKey);
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const fullPattern = this.prefix + pattern;
    return this.backend.deletePattern(fullPattern);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await this.backend.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.backend.getStats();
  }

  /**
   * Wrap a function with caching
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, options.ttl);
    return result;
  }

  /**
   * Invalidate cache for org
   */
  async invalidateOrg(orgId: string): Promise<number> {
    return this.deletePattern(`org:${orgId}:*`);
  }

  /**
   * Invalidate cache for user
   */
  async invalidateUser(userId: string): Promise<number> {
    return this.deletePattern(`user:${userId}:*`);
  }
}

// ===== CACHE KEYS =====

export const CacheKeys = {
  // Org-related
  org: (orgId: string) => `org:${orgId}`,
  orgSettings: (orgId: string) => `org:${orgId}:settings`,
  orgUsers: (orgId: string) => `org:${orgId}:users`,
  
  // Vertical config
  verticalConfig: (orgId: string) => `org:${orgId}:vertical`,
  
  // AI Power profile
  aiPowerProfile: (orgId: string) => `org:${orgId}:ai:power`,
  
  // Trial config
  trialConfig: (orgId: string) => `org:${orgId}:trial`,
  
  // Credit balance
  creditBalance: (orgId: string) => `org:${orgId}:credits:balance`,
  
  // User
  user: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,
  
  // Adoption discount
  adoptionDiscount: (orgId: string) => `org:${orgId}:adoption:discount`,
  
  // AI model version
  aiModelVersion: (orgId: string, agentType: string) => `org:${orgId}:ai:model:${agentType}`,
  
  // System notices
  systemNotices: (orgId: string) => `org:${orgId}:notices`,
  
  // Provider profitability
  providerProfitability: (orgId: string) => `provider:profitability:${orgId}`,
};

// ===== CACHE TTLs =====

export const CacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// ===== SINGLETON INSTANCE =====

export const cache = new CacheService();

// ===== CACHE WARMING =====

/**
 * Warm cache with frequently accessed data
 */
export async function warmCache(orgId: string) {
  // TODO: Implement cache warming
  // Load frequently accessed data into cache on startup
  console.log(`Warming cache for org ${orgId}...`);
}

/**
 * Invalidate all cache for org (use after major changes)
 */
export async function invalidateOrgCache(orgId: string) {
  await cache.invalidateOrg(orgId);
  console.log(`Invalidated cache for org ${orgId}`);
}

