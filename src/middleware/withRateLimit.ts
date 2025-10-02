/**
 * Rate Limiting Middleware
 * Binder1: Rate limiting for all routes
 * 
 * Implements token bucket algorithm with per-tenant limits
 * Returns 429 Too Many Requests with Retry-After header
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getUserInfo } from './withAudience';

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: NextApiRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// Default configurations
export const RATE_LIMIT_CONFIGS = {
  DEFAULT: { windowMs: 60000, maxRequests: 60 }, // 60 req/min
  STRICT: { windowMs: 60000, maxRequests: 30 }, // 30 req/min
  RELAXED: { windowMs: 60000, maxRequests: 120 }, // 120 req/min
  AI_HEAVY: { windowMs: 60000, maxRequests: 10 }, // 10 req/min for AI
  BURST: { windowMs: 1000, maxRequests: 10 }, // 10 req/sec burst
};

// ============================================================================
// IN-MEMORY STORE (for development)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Rate limiting middleware
 * 
 * Usage:
 * export default withRateLimit(
 *   RATE_LIMIT_CONFIGS.DEFAULT,
 *   withAudience(AUDIENCE.CLIENT_ONLY, handler)
 * );
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Generate rate limit key
      const key = config.keyGenerator
        ? config.keyGenerator(req)
        : generateDefaultKey(req);

      // Check rate limit
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get or create entry
      let entry = rateLimitStore.get(key);
      
      if (!entry || entry.resetAt < now) {
        // Create new entry
        entry = {
          count: 0,
          resetAt: now + config.windowMs,
        };
        rateLimitStore.set(key, entry);
      }

      // Check if limit exceeded
      if (entry.count >= config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', entry.resetAt);
        res.setHeader('Retry-After', retryAfter);

        return res.status(429).json({
          error: 'TooManyRequests',
          message: 'Rate limit exceeded',
          details: {
            limit: config.maxRequests,
            windowMs: config.windowMs,
            retryAfter,
          },
        });
      }

      // Increment counter
      entry.count++;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', config.maxRequests - entry.count);
      res.setHeader('X-RateLimit-Reset', entry.resetAt);

      // Call handler
      return handler(req, res);
    } catch (error) {
      console.error('Error in withRateLimit:', error);
      return res.status(500).json({
        error: 'Internal',
        message: 'Rate limit check failed',
      });
    }
  };
}

/**
 * Generate default rate limit key (orgId + IP)
 */
function generateDefaultKey(req: NextApiRequest): string {
  const { orgId } = getUserInfo(req);
  const ip = getClientIp(req);
  return `${orgId}:${ip}`;
}

/**
 * Get client IP address
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Per-tenant rate limit key generator
 */
export function perTenantKey(req: NextApiRequest): string {
  const { orgId } = getUserInfo(req);
  return `tenant:${orgId}`;
}

/**
 * Per-user rate limit key generator
 */
export function perUserKey(req: NextApiRequest): string {
  const { orgId, email } = getUserInfo(req);
  return `user:${orgId}:${email}`;
}

/**
 * Per-endpoint rate limit key generator
 */
export function perEndpointKey(req: NextApiRequest): string {
  const { orgId } = getUserInfo(req);
  const endpoint = req.url || 'unknown';
  return `endpoint:${orgId}:${endpoint}`;
}

/**
 * Combined middleware: withRateLimit + withAudience
 */
export function withRateLimitAndAudience(
  config: RateLimitConfig,
  audience: any,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  const { withAudience } = require('./withAudience');
  return withRateLimit(config, withAudience(audience, handler));
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string): {
  count: number;
  remaining: number;
  resetAt: number;
} | null {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return null;
  }

  return {
    count: entry.count,
    remaining: Math.max(0, RATE_LIMIT_CONFIGS.DEFAULT.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a key (for testing)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

