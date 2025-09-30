// src/middleware/rateLimit.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// ===== TYPES =====

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// ===== IN-MEMORY STORE =====
// TODO: Replace with Redis for production multi-instance deployments

class RateLimitStore {
  private store = new Map<string, RateLimitRecord>();

  get(key: string): RateLimitRecord | undefined {
    const record = this.store.get(key);
    if (record && Date.now() > record.resetAt) {
      this.store.delete(key);
      return undefined;
    }
    return record;
  }

  set(key: string, record: RateLimitRecord): void {
    this.store.set(key, record);
  }

  increment(key: string, windowMs: number): RateLimitRecord {
    const now = Date.now();
    const existing = this.get(key);

    if (existing) {
      existing.count++;
      return existing;
    }

    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    this.set(key, newRecord);
    return newRecord;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

// Cleanup every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

// ===== RATE LIMIT MIDDLEWARE =====

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void | Promise<void>
  ): Promise<void> => {
    // Get client identifier (IP address)
    const identifier = getClientIdentifier(req);
    const key = `ratelimit:${identifier}:${req.url}`;

    // Get current rate limit record
    const record = store.increment(key, windowMs);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());

    // Check if rate limit exceeded
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        error: 'TooManyRequests',
        message,
        retryAfter,
      }) as any;
    }

    // If we should skip counting this request, decrement after response
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        const statusCode = res.statusCode;
        
        // Decrement if we should skip this type of request
        if (
          (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          const currentRecord = store.get(key);
          if (currentRecord && currentRecord.count > 0) {
            currentRecord.count--;
          }
        }
        
        return originalJson(body);
      } as any;
    }

    // Continue to next middleware/handler
    await next();
  };
}

// ===== HELPER FUNCTIONS =====

function getClientIdentifier(req: NextApiRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket address
  return req.socket.remoteAddress || 'unknown';
}

// ===== PRESET CONFIGURATIONS =====

export const rateLimitPresets = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.',
  },

  // Moderate limits for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many requests. Please slow down.',
  },

  // Strict limits for AI endpoints (expensive operations)
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many AI requests. Please wait before trying again.',
  },

  // Very strict limits for import/export operations
  import: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many import operations. Please try again later.',
  },

  // Lenient limits for general endpoints
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },
};

// ===== MIDDLEWARE WRAPPER =====

export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const limiter = rateLimit(config);
    
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await limiter(req, res, next);

    if (nextCalled && !res.headersSent) {
      await handler(req, res);
    }
  };
}

// ===== EXPORTS =====

export { store as rateLimitStore };

