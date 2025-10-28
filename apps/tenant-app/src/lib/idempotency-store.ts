/**
 * Idempotency Store - Request Deduplication
 *
 * Current: In-memory store (single instance)
 * Production: Redis/Vercel KV for multi-instance deployments
 *
 * Per GUARDRAILS_INFRA.md:
 * - Methods: POST, PUT
 * - Key format: ${route}|${keyId}|${idempotencyKey}
 * - Value: { bodyHash, status, headers, body, createdAt }
 * - TTL: 24 hours
 * - Body hash: SHA-256 hex of raw request body (UTF-8)
 * - Conflict rule: same key + different bodyHash → 409
 * - Replay rule: same key + same bodyHash → return stored response
 */

import crypto from 'crypto';

export type IdempotencyEntry = {
  bodyHash: string;
  status: number;
  headers?: Record<string, string>;
  body: any;
  createdAt: number;
  expiresAt: number;
};

export type IdempotencyCheckResult =
  | { replay: false }
  | { replay: true; response: { status: number; headers?: Record<string, string>; body: any } }
  | { conflict: true };

// In-memory store (fallback when Redis not configured)
const store = new Map<string, IdempotencyEntry>();

// Redis support
async function getFromRedis(key: string): Promise<IdempotencyEntry | null> {
  const { getRedis } = await import('./redis');
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(`idempotency:${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function setToRedis(key: string, entry: IdempotencyEntry): Promise<void> {
  const { getRedis } = await import('./redis');
  const redis = getRedis();
  if (!redis) return;

  try {
    const ttlSeconds = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await redis.setex(`idempotency:${key}`, ttlSeconds, JSON.stringify(entry));
    }
  } catch (error) {
    console.error('Redis setex error:', error);
  }
}

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt < now) {
        store.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Hash request body using SHA-256
 *
 * Per GUARDRAILS_INFRA.md: SHA-256 hex of raw request body (UTF-8)
 *
 * @param body - Raw request body string
 * @returns SHA-256 hex hash
 */
function hashRequestBody(body: string): string {
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex');
}

/**
 * Check idempotency for a request
 *
 * Per GUARDRAILS_INFRA.md:
 * - Same key + same bodyHash → replay stored response
 * - Same key + different bodyHash → 409 conflict
 * - New key → allow request to proceed
 *
 * @param key - Idempotency key (format: ${route}|${keyId}|${idempotencyKey})
 * @param requestBody - Raw request body string
 * @returns Idempotency check result
 */
export async function checkIdempotency(
  key: string,
  requestBody: string
): Promise<IdempotencyCheckResult> {
  // Try Redis first, fallback to in-memory
  let entry = await getFromRedis(key);
  const usingRedis = entry !== null;

  if (!usingRedis) {
    entry = store.get(key) || null;
  }

  const bodyHash = hashRequestBody(requestBody);

  if (!entry) {
    // First time seeing this key
    return { replay: false };
  }

  const now = Date.now();
  if (entry.expiresAt < now) {
    // Expired entry, treat as new
    store.delete(key);
    return { replay: false };
  }

  if (entry.bodyHash === bodyHash) {
    // Same request body, replay stored response
    return {
      replay: true,
      response: {
        status: entry.status,
        headers: entry.headers,
        body: entry.body,
      },
    };
  }

  // Different request body with same key = conflict (409)
  return { conflict: true };
}

/**
 * Record idempotency entry for a request
 *
 * Per GUARDRAILS_INFRA.md:
 * - TTL: 24 hours (configurable via IDEMPOTENCY_TTL_HOURS env var)
 * - Store: bodyHash, status, headers, body, createdAt, expiresAt
 *
 * @param key - Idempotency key (format: ${route}|${keyId}|${idempotencyKey})
 * @param requestBody - Raw request body string
 * @param response - Response to store (status, headers, body)
 */
export async function recordIdempotency(
  key: string,
  requestBody: string,
  response: { status: number; headers?: Record<string, string>; body: any }
): Promise<void> {
  // Default TTL: 24 hours (per GUARDRAILS_INFRA.md)
  const ttlHours = parseInt(process.env.IDEMPOTENCY_TTL_HOURS || '24', 10);
  const now = Date.now();
  const expiresAt = now + ttlHours * 60 * 60 * 1000;
  const bodyHash = hashRequestBody(requestBody);

  const entry: IdempotencyEntry = {
    bodyHash,
    status: response.status,
    headers: response.headers,
    body: response.body,
    createdAt: now,
    expiresAt,
  };

  // Store in Redis if configured, otherwise in-memory
  if (process.env.REDIS_URL) {
    await setToRedis(key, entry);
  } else {
    store.set(key, entry);
  }
}

/**
 * Generate idempotency key
 *
 * Format per GUARDRAILS_INFRA.md: ${route}|${keyId}|${idempotencyKey}
 *
 * @param route - API route path
 * @param keyId - API key ID or user identifier
 * @param idempotencyKey - Client-provided idempotency key
 * @returns Formatted idempotency key
 */
export function getIdempotencyKey(route: string, keyId: string, idempotencyKey: string): string {
  return `idem:${route}:${keyId}:${idempotencyKey}`;
}

