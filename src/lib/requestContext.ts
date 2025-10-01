// src/lib/requestContext.ts
// Request context using AsyncLocalStorage for cleaner service layer code
import { AsyncLocalStorage } from 'async_hooks';

// ===== REQUEST CONTEXT TYPE =====

export interface RequestContext {
  requestId: string;
  orgId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  startTime: number;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
}

// ===== ASYNC LOCAL STORAGE =====

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

// ===== CONTEXT FUNCTIONS =====

/**
 * Get current request context
 * Throws error if called outside of request context
 */
export function getContext(): RequestContext {
  const context = asyncLocalStorage.getStore();
  if (!context) {
    throw new Error('Request context not available. Make sure to call runWithContext first.');
  }
  return context;
}

/**
 * Get current request context (safe - returns null if not available)
 */
export function getContextSafe(): RequestContext | null {
  return asyncLocalStorage.getStore() || null;
}

/**
 * Get current org ID from context
 */
export function getOrgId(): string {
  const context = getContext();
  if (!context.orgId) {
    throw new Error('Org ID not available in request context');
  }
  return context.orgId;
}

/**
 * Get current user ID from context
 */
export function getUserId(): string {
  const context = getContext();
  if (!context.userId) {
    throw new Error('User ID not available in request context');
  }
  return context.userId;
}

/**
 * Get current user email from context
 */
export function getUserEmail(): string {
  const context = getContext();
  if (!context.userEmail) {
    throw new Error('User email not available in request context');
  }
  return context.userEmail;
}

/**
 * Get current user role from context
 */
export function getUserRole(): string {
  const context = getContext();
  if (!context.userRole) {
    throw new Error('User role not available in request context');
  }
  return context.userRole;
}

/**
 * Get request ID from context
 */
export function getRequestId(): string {
  const context = getContext();
  return context.requestId;
}

/**
 * Get request duration in milliseconds
 */
export function getRequestDuration(): number {
  const context = getContext();
  return Date.now() - context.startTime;
}

/**
 * Run function with request context
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Run async function with request context
 */
export async function runWithContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Create request context from Next.js request
 */
export function createRequestContext(req: any, user?: { id: string; email: string; orgId?: string; role?: string }): RequestContext {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    requestId,
    orgId: user?.orgId,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    startTime: Date.now(),
    method: req.method,
    path: req.url,
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

/**
 * Update context with user info
 */
export function updateContextWithUser(user: { id: string; email: string; orgId?: string; role?: string }) {
  const context = getContextSafe();
  if (context) {
    context.userId = user.id;
    context.userEmail = user.email;
    context.orgId = user.orgId;
    context.userRole = user.role;
  }
}

/**
 * Middleware to set up request context
 */
export function withRequestContext(handler: (req: any, res: any) => Promise<void>) {
  return async (req: any, res: any) => {
    const context = createRequestContext(req);
    
    // Set request ID header
    res.setHeader('X-Request-ID', context.requestId);

    return runWithContextAsync(context, () => handler(req, res));
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Log with request context
 */
export function logWithContext(message: string, metadata?: Record<string, any>) {
  const context = getContextSafe();
  console.log(JSON.stringify({
    message,
    ...context,
    ...metadata,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Get context for logging
 */
export function getLoggingContext(): Record<string, any> {
  const context = getContextSafe();
  if (!context) return {};

  return {
    requestId: context.requestId,
    orgId: context.orgId,
    userId: context.userId,
    duration: Date.now() - context.startTime,
  };
}

