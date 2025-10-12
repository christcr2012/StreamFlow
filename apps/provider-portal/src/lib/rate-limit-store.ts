/**
 * Rate Limit Store
 * 
 * In-memory rate limiting store with sliding window algorithm.
 * For production, replace with Redis-based implementation.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a key has exceeded the rate limit
   * @param key - Unique identifier (e.g., "user:email@example.com:endpoint:/api/plans")
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and retry information
   */
  check(key: string, limit: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    // No entry or expired entry
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt,
      };
    }

    // Entry exists and not expired
    if (entry.count < limit) {
      entry.count++;
      this.store.set(key, entry);
      return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
      };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current stats for monitoring
   */
  getStats(): { totalKeys: number; activeKeys: number } {
    const now = Date.now();
    let activeKeys = 0;
    for (const entry of this.store.values()) {
      if (entry.resetAt > now) {
        activeKeys++;
      }
    }
    return {
      totalKeys: this.store.size,
      activeKeys,
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
export const rateLimitStore = new RateLimitStore();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    rateLimitStore.destroy();
  });
}

