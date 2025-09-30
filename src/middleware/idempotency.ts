// src/middleware/idempotency.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// ===== TYPES =====

export interface IdempotencyConfig {
  ttlMs?: number;           // Time to live in milliseconds (default: 24 hours)
  headerName?: string;      // Header name for idempotency key (default: X-Idempotency-Key)
  skipMethods?: string[];   // HTTP methods to skip (default: only POST/PUT/PATCH)
}

interface IdempotencyRecord {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: any;
  createdAt: number;
  expiresAt: number;
}

// ===== IN-MEMORY STORE =====
// TODO: Replace with Redis for production multi-instance deployments

class IdempotencyStore {
  private store = new Map<string, IdempotencyRecord>();

  get(key: string): IdempotencyRecord | undefined {
    const record = this.store.get(key);
    if (record && Date.now() > record.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return record;
  }

  set(key: string, record: IdempotencyRecord): void {
    this.store.set(key, record);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const store = new IdempotencyStore();

// Cleanup every 10 minutes
setInterval(() => store.cleanup(), 10 * 60 * 1000);

// ===== IDEMPOTENCY MIDDLEWARE =====

export function idempotency(config: IdempotencyConfig = {}) {
  const {
    ttlMs = 24 * 60 * 60 * 1000, // 24 hours default
    headerName = 'X-Idempotency-Key',
    skipMethods = ['GET', 'HEAD', 'OPTIONS'],
  } = config;

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void | Promise<void>
  ): Promise<void> => {
    // Skip if method should not be idempotent
    if (skipMethods.includes(req.method || 'GET')) {
      return await next();
    }

    // Get idempotency key from header
    const idempotencyKey = req.headers[headerName.toLowerCase()] as string | undefined;

    // If no idempotency key provided, continue without idempotency
    if (!idempotencyKey) {
      return await next();
    }

    // Validate idempotency key format (should be UUID or similar)
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return res.status(400).json({
        error: 'InvalidIdempotencyKey',
        message: 'Idempotency key must be a valid UUID or similar unique identifier',
      }) as any;
    }

    // Create composite key: idempotency key + request hash
    const requestHash = hashRequest(req);
    const compositeKey = `idempotency:${idempotencyKey}:${requestHash}`;

    // Check if we have a cached response
    const cachedRecord = store.get(compositeKey);
    if (cachedRecord) {
      // Return cached response
      res.status(cachedRecord.statusCode);
      
      // Set cached headers
      for (const [key, value] of Object.entries(cachedRecord.headers)) {
        res.setHeader(key, value);
      }
      
      // Add idempotency header to indicate this is a cached response
      res.setHeader('X-Idempotency-Replay', 'true');
      
      return res.json(cachedRecord.body) as any;
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    const originalSetHeader = res.setHeader.bind(res);

    let statusCode = 200;
    const headers: Record<string, string | string[]> = {};

    // Override status method
    res.status = function (code: number) {
      statusCode = code;
      return originalStatus(code);
    } as any;

    // Override setHeader method
    res.setHeader = function (name: string, value: string | string[]) {
      headers[name] = value;
      return originalSetHeader(name, value);
    } as any;

    // Override json method
    res.json = function (body: any) {
      // Only cache successful responses (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        const now = Date.now();
        const record: IdempotencyRecord = {
          statusCode,
          headers,
          body,
          createdAt: now,
          expiresAt: now + ttlMs,
        };
        store.set(compositeKey, record);
      }

      return originalJson(body);
    } as any;

    // Continue to next middleware/handler
    await next();
  };
}

// ===== HELPER FUNCTIONS =====

function isValidIdempotencyKey(key: string): boolean {
  // Check if it's a valid UUID (v4 or similar)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(key)) {
    return true;
  }

  // Allow other formats: alphanumeric, hyphens, underscores, 16-64 chars
  const generalRegex = /^[a-zA-Z0-9_-]{16,64}$/;
  return generalRegex.test(key);
}

function hashRequest(req: NextApiRequest): string {
  // Create hash of request method, path, and body
  const data = {
    method: req.method,
    url: req.url,
    body: req.body,
  };

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');

  return hash.substring(0, 16); // Use first 16 chars for brevity
}

// ===== MIDDLEWARE WRAPPER =====

export function withIdempotency(
  config: IdempotencyConfig = {},
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const middleware = idempotency(config);
    
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await middleware(req, res, next);

    if (nextCalled && !res.headersSent) {
      await handler(req, res);
    }
  };
}

// ===== EXPORTS =====

export { store as idempotencyStore };

