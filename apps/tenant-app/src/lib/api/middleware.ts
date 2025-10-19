/**
 * Middleware Composition Framework for Tenant App
 *
 * Provides clean composition model for auth, rate limiting, and idempotency.
 * Recovered from legacy src/lib/api/middleware.ts and adapted for tenant-app.
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError } from '@/lib/api/response';

export type Handler = (req: NextRequest, ...args: any[]) => Promise<Response> | Response;

export type Wrapper = (h: Handler) => Handler;

/**
 * Compose multiple middleware wrappers into a single wrapper
 *
 * Wrappers are applied right-to-left (like function composition)
 * Example: compose(A, B, C)(handler) = A(B(C(handler)))
 *
 * @param wrappers - Middleware wrappers to compose
 * @returns Composed wrapper function
 */
export function compose(...wrappers: Wrapper[]): Wrapper {
  return (handler) => wrappers.reduceRight((acc, w) => w(acc), handler);
}

/**
 * Rate Limit Presets per GUARDRAILS_INFRA.md
 *
 * - AUTH: 10s window, 20 requests (login/signup protection)
 * - API: 60s window, 100 requests (general API calls)
 * - ANALYTICS: 600s window, 1000 requests (high-volume analytics)
 */
export const rateLimitPresets = {
  auth: { windowMs: 10_000, max: 20 },
  api: { windowMs: 60_000, max: 100 },
  analytics: { windowMs: 600_000, max: 1000 },
};

/**
 * Rate Limiting Wrapper
 *
 * Applies rate limiting per GUARDRAILS_INFRA.md spec:
 * - Token bucket algorithm
 * - Proper 429 response headers (Retry-After, X-RateLimit-*)
 * - Key format: rate:${preset}:${identifier}:${route}
 *
 * @param preset - Rate limit preset (auth, api, analytics)
 * @returns Wrapper function
 */
export function withRateLimit(preset: keyof typeof rateLimitPresets): Wrapper {
  return (handler) => async (req, ...args) => {
    const { checkRateLimit, getRateLimitKey, getRateLimitHeaders } = await import('@/lib/rate-limiter');

    // Get config with optional env overrides
    const config = { ...rateLimitPresets[preset] };
    if (preset === 'api' && process.env.RATE_LIMIT_API_PER_MINUTE) {
      config.max = parseInt(process.env.RATE_LIMIT_API_PER_MINUTE, 10);
    }
    if (preset === 'auth' && process.env.RATE_LIMIT_AUTH_PER_MINUTE) {
      config.max = parseInt(process.env.RATE_LIMIT_AUTH_PER_MINUTE, 10);
    }
    if (preset === 'analytics' && process.env.RATE_LIMIT_ANALYTICS_PER_10MIN) {
      config.max = parseInt(process.env.RATE_LIMIT_ANALYTICS_PER_10MIN, 10);
    }

    // Determine identifier (cookie token or IP)
    let identifier: string | null = null;
    try {
      const jar = await cookies();
      identifier =
        jar.get('rs_client')?.value ||
        jar.get('client-session')?.value ||
        jar.get('ws_client')?.value ||
        null;
    } catch {
      // Not in Next request scope (tests)
      identifier = null;
    }
    if (!identifier) {
      identifier =
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown';
    }

    const route = new URL(req.url).pathname;
    const key = getRateLimitKey(preset, identifier, route);
    const result = await checkRateLimit(key, config);

    // Add rate limit headers to response
    const rateLimitHeaders = getRateLimitHeaders(result);

    if (!result.allowed) {
      // 429 Too Many Requests with proper headers
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Too many requests. Please try again later.',
            resetAt: new Date(result.resetAt).toISOString(),
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitHeaders,
          },
        }
      );
    }

    // Execute handler and add rate limit headers to successful response
    const response = await handler(req, ...args);

    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  };
}

/**
 * Idempotency Wrapper
 *
 * Requires Idempotency-Key header for POST/PUT/PATCH requests
 * - Same key + same body → replay cached response
 * - Same key + different body → 409 conflict
 * - New key → execute handler and cache response
 *
 * @returns Wrapper function
 */
export function withIdempotencyRequired(): Wrapper {
  return (handler) => async (req, ...args) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const idem = req.headers.get('idempotency-key');
      if (!idem) return jsonError(400, 'ValidationError', 'Idempotency-Key header required');

      const { checkIdempotency, recordIdempotency } = await import('@/lib/idempotency-store');
      const bodyText = await req.clone().text();

      const check = await checkIdempotency(idem, bodyText);

      if ('replay' in check && check.replay) {
        // Replay cached response
        return new Response(JSON.stringify(check.response.body), {
          status: check.response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if ('conflict' in check && check.conflict) {
        // Different body with same key
        return jsonError(409, 'IdempotencyConflict', 'Idempotency key already used with different request body');
      }

      // Execute handler and record response
      const response = await handler(req, ...args);
      const responseClone = response.clone();
      const responseBody = await responseClone.json();
      await recordIdempotency(idem, bodyText, { status: response.status, body: responseBody });

      return response;
    }
    return handler(req, ...args);
  };
}

/**
 * Tenant Authentication Wrapper
 *
 * Validates tenant user session and injects context into request headers:
 * - x-org-id: Organization ID
 * - x-user-id: User ID
 *
 * Uses @cortiware/auth-service for authentication
 *
 * @returns Wrapper function
 */
export function withTenantAuth(): Wrapper {
  return (handler) => async (req, ...args) => {
    const { getAuthContext } = await import('@/lib/auth-context');
    
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return jsonError(401, 'Unauthorized', 'Sign in required');
    }

    // Inject context into request headers for downstream usage
    const headers = new Headers(req.headers);
    headers.set('x-org-id', authContext.orgId);
    if (authContext.userId) {
      headers.set('x-user-id', authContext.userId);
    }

    const newReq = new NextRequest(req, { headers });
    return handler(newReq, ...args);
  };
}

/**
 * Optional Idempotency Wrapper
 *
 * If Idempotency-Key header is provided, use it for deduplication
 * If not provided, allow request to proceed normally
 *
 * @returns Wrapper function
 */
export function withIdempotencyOptional(): Wrapper {
  return (handler) => async (req, ...args) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const idem = req.headers.get('idempotency-key');
      if (!idem) {
        // No idempotency key, proceed normally
        return handler(req, ...args);
      }

      const { checkIdempotency, recordIdempotency } = await import('@/lib/idempotency-store');
      const bodyText = await req.clone().text();

      const check = await checkIdempotency(idem, bodyText);

      if ('replay' in check && check.replay) {
        // Replay cached response
        return new Response(JSON.stringify(check.response.body), {
          status: check.response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if ('conflict' in check && check.conflict) {
        // Different body with same key
        return jsonError(409, 'IdempotencyConflict', 'Idempotency key already used with different request body');
      }

      // Execute handler and record response
      const response = await handler(req, ...args);
      const responseClone = response.clone();
      const responseBody = await responseClone.json();
      await recordIdempotency(idem, bodyText, { status: response.status, body: responseBody });

      return response;
    }
    return handler(req, ...args);
  };
}

