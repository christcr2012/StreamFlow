import { NextRequest, NextResponse } from 'next/server';
import { rateLimitStore } from '@/lib/rate-limit-store';
import { prisma } from '@/lib/prisma';

export type RateLimitConfig = {
  /**
   * Maximum number of requests allowed in the time window
   * @default 100
   */
  limit?: number;

  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;

  /**
   * Key generator function to create unique rate limit keys
   * @default Uses IP address + endpoint
   */
  keyGenerator?: (request: NextRequest) => string;

  /**
   * Skip rate limiting based on request
   * @default false
   */
  skip?: (request: NextRequest) => boolean;

  /**
   * Handler called when rate limit is exceeded
   */
  onLimitExceeded?: (request: NextRequest, retryAfter: number) => void;
};

/**
 * Default key generator using IP address and endpoint
 */
function defaultKeyGenerator(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const endpoint = new URL(request.url).pathname;
  return `ratelimit:${ip}:${endpoint}`;
}

/**
 * Rate limiting middleware wrapper
 * 
 * Usage:
 * ```typescript
 * export const GET = withRateLimit(
 *   async (request) => {
 *     // Your handler logic
 *   },
 *   { limit: 100, windowMs: 60000 }
 * );
 * ```
 */
export function withRateLimit<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  config: RateLimitConfig = {}
): (request: NextRequest, context?: any) => Promise<NextResponse<T>> {
  const {
    limit = 100,
    windowMs = 60000, // 1 minute
    keyGenerator = defaultKeyGenerator,
    skip,
    onLimitExceeded,
  } = config;

  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    // Skip rate limiting if configured
    if (skip && skip(request)) {
      return handler(request, context);
    }

    // Generate rate limit key
    const key = keyGenerator(request);

    // Check rate limit
    const result = rateLimitStore.check(key, limit, windowMs);

    // Set rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    // Rate limit exceeded
    if (!result.allowed) {
      if (result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString());
      }

      // Call onLimitExceeded callback
      if (onLimitExceeded && result.retryAfter) {
        onLimitExceeded(request, result.retryAfter);
      }

      // Log rate limit violation to audit log
      try {
        const ip = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        const endpoint = new URL(request.url).pathname;

        await prisma.auditEvent.create({
          data: {
            action: 'rate_limit_exceeded',
            entityType: 'api_request',
            entityId: key,
            actorType: 'system',
            actorId: ip,
            metadata: {
              endpoint,
              limit,
              windowMs,
              retryAfter: result.retryAfter,
            },
          },
        });
      } catch (error) {
        console.error('Failed to log rate limit violation:', error);
      }

      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers,
        }
      ) as NextResponse<T>;
    }

    // Rate limit not exceeded, proceed with handler
    const response = await handler(request, context);

    // Add rate limit headers to successful response
    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value);
    }

    return response;
  };
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for write operations (10 requests per minute)
   */
  STRICT: { limit: 10, windowMs: 60000 },

  /**
   * Standard rate limit for API endpoints (100 requests per minute)
   */
  STANDARD: { limit: 100, windowMs: 60000 },

  /**
   * Relaxed rate limit for read operations (1000 requests per minute)
   */
  RELAXED: { limit: 1000, windowMs: 60000 },

  /**
   * Per-hour rate limit (10000 requests per hour)
   */
  HOURLY: { limit: 10000, windowMs: 3600000 },
};

