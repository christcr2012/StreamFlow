/**
 * @cortiware/kv
 * Shared KV/Redis utilities for Cortiware monorepo
 * 
 * Supports both Vercel KV and generic Redis connections
 */

import { kv as vercelKv } from '@vercel/kv';

/**
 * KV Client Interface
 * Abstracts Vercel KV or Redis operations
 */
export interface KVClient {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
}

/**
 * Vercel KV Client (default)
 * Uses @vercel/kv package with environment variables:
 * - KV_URL or KV_REST_API_URL (connection URL)
 * - KV_TOKEN or KV_REST_API_TOKEN (auth token)
 *
 * Supports both old (KV_REST_API_*) and new (KV_*) naming conventions
 */
class VercelKVClient implements KVClient {
  async get<T = string>(key: string): Promise<T | null> {
    return vercelKv.get<T>(key);
  }

  async set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<void> {
    if (options?.ex) {
      await vercelKv.set(key, value, { ex: options.ex });
    } else if (options?.px) {
      await vercelKv.set(key, value, { px: options.px });
    } else {
      await vercelKv.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await vercelKv.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await vercelKv.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await vercelKv.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return vercelKv.ttl(key);
  }
}

/**
 * In-Memory Fallback Client
 * Used when KV is not configured (development/testing)
 */
class InMemoryKVClient implements KVClient {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  async get<T = string>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<void> {
    let expiresAt: number | undefined;
    
    if (options?.ex) {
      expiresAt = Date.now() + options.ex * 1000;
    } else if (options?.px) {
      expiresAt = Date.now() + options.px;
    }
    
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2; // Key doesn't exist
    if (!entry.expiresAt) return -1; // No expiry set
    
    const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

/**
 * Get KV client instance
 * Returns Vercel KV if configured, otherwise in-memory fallback
 */
let kvClient: KVClient | null = null;

export function getKVClient(): KVClient {
  if (kvClient) return kvClient;

  // Check if Vercel KV is configured
  // Support both old (KV_REST_API_*) and new (KV_*) variable names
  const hasVercelKV =
    (process.env.KV_REST_API_URL || process.env.KV_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.KV_TOKEN);

  if (hasVercelKV) {
    console.log('✅ Using Vercel KV for distributed storage');
    kvClient = new VercelKVClient();
  } else {
    console.warn('⚠️  Vercel KV not configured, using in-memory fallback (not suitable for production)');
    kvClient = new InMemoryKVClient();
  }

  return kvClient;
}

/**
 * Nonce Store Operations
 * Used for SSO ticket replay protection
 */
export async function storeNonce(nonce: string, expirySeconds: number = 120): Promise<void> {
  const kv = getKVClient();
  await kv.set(`nonce:${nonce}`, '1', { ex: expirySeconds });
}

export async function checkNonce(nonce: string): Promise<boolean> {
  const kv = getKVClient();
  return kv.exists(`nonce:${nonce}`);
}

export async function deleteNonce(nonce: string): Promise<void> {
  const kv = getKVClient();
  await kv.del(`nonce:${nonce}`);
}

/**
 * Cleanup expired nonces (for in-memory fallback only)
 * Vercel KV handles expiry automatically
 */
export async function cleanupExpiredNonces(): Promise<void> {
  // No-op for Vercel KV (handles expiry automatically)
  // In-memory client handles expiry on access
}

/**
 * Session Store Operations
 * Used for refresh tokens and session management
 */
export async function storeSession(
  sessionId: string,
  data: any,
  expirySeconds: number = 86400 // 24 hours
): Promise<void> {
  const kv = getKVClient();
  await kv.set(`session:${sessionId}`, JSON.stringify(data), { ex: expirySeconds });
}

export async function getSession<T = any>(sessionId: string): Promise<T | null> {
  const kv = getKVClient();
  const data = await kv.get<string>(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const kv = getKVClient();
  await kv.del(`session:${sessionId}`);
}

export async function refreshSession(sessionId: string, expirySeconds: number = 86400): Promise<void> {
  const kv = getKVClient();
  await kv.expire(`session:${sessionId}`, expirySeconds);
}

/**
 * Rate Limiting Operations
 * Used for auth endpoint protection
 */
export async function incrementRateLimit(
  key: string,
  windowSeconds: number = 900 // 15 minutes
): Promise<number> {
  const kv = getKVClient();
  const rateLimitKey = `ratelimit:${key}`;
  
  const current = await kv.get<string>(rateLimitKey);
  const count = current ? parseInt(current, 10) + 1 : 1;
  
  await kv.set(rateLimitKey, count.toString(), { ex: windowSeconds });
  
  return count;
}

export async function getRateLimit(key: string): Promise<number> {
  const kv = getKVClient();
  const current = await kv.get<string>(`ratelimit:${key}`);
  return current ? parseInt(current, 10) : 0;
}

export async function resetRateLimit(key: string): Promise<void> {
  const kv = getKVClient();
  await kv.del(`ratelimit:${key}`);
}

/**
 * AI Caching Operations
 * Export all AI cache functions for use across apps
 */
export * from './ai-cache';

