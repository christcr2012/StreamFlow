// src/lib/audit.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma as db } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export interface AuditContext {
  userId?: string;
  orgId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEventData {
  action: string;
  target: string;
  targetId?: string;
  details?: Record<string, any>;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category?: 'GENERAL' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'POLICY_CHANGE' | 'ADMIN_ACTION' | 'SECURITY_EVENT';
  success?: boolean;
  errorMessage?: string;
}

/**
 * Create an audit event record with tamper evidence
 */
export async function createAuditEvent(
  context: AuditContext,
  eventData: AuditEventData
): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      // Get the last audit event for hash chaining
      const lastEvent = await tx.auditEvent.findFirst({
        where: { orgId: context.orgId! },
        orderBy: { createdAt: 'desc' },
        select: { id: true, hash: true },
      });

      // Create event data for hashing
      const eventPayload = {
        orgId: context.orgId!,
        userId: context.userId,
        sessionId: context.sessionId,
        action: eventData.action,
        target: eventData.target,
        targetId: eventData.targetId,
        details: eventData.details || {},
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        severity: eventData.severity || 'INFO',
        category: eventData.category || 'GENERAL',
        success: eventData.success !== false,
        errorMessage: eventData.errorMessage,
        timestamp: new Date().toISOString(),
        previousHash: lastEvent?.hash || 'GENESIS',
      };

      // Generate tamper-evident hash
      const eventHash = await generateEventHash(eventPayload);

      // Create the audit event with hash chain
      await tx.auditEvent.create({
        data: {
          ...eventPayload,
          hash: eventHash,
          previousEventId: lastEvent?.id,
          immutable: true, // Mark as immutable for compliance
        },
      });
    });
  } catch (error) {
    // Log audit failures but don't throw to avoid breaking the main operation
    console.error('Failed to create audit event:', error);
  }
}

/**
 * Generate cryptographic hash for audit event integrity
 */
async function generateEventHash(eventData: any): Promise<string> {
  const crypto = await import('crypto');
  const dataString = JSON.stringify(eventData, Object.keys(eventData).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Extract audit context from API request
 */
export function getAuditContext(req: NextApiRequest): AuditContext {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress;
  
  return {
    ipAddress: ip?.trim(),
    userAgent: req.headers['user-agent'],
    sessionId: req.headers['x-session-id'] as string, // Can be added by frontend
  };
}

/**
 * Audit middleware for API routes
 */
export function withAudit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  config?: {
    action?: string;
    target?: string;
    category?: AuditEventData['category'];
    skipAuditOn?: (req: NextApiRequest) => boolean;
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    let auditContext: AuditContext | null = null;
    let success = true;
    let errorMessage: string | undefined;

    try {
      // Get audit context
      auditContext = getAuditContext(req);
      
      // Get user context if available
      try {
        const user = await getAuthenticatedUser(req);
        if (user) {
          auditContext.userId = user.id;
          auditContext.orgId = user.orgId;
        }
      } catch {
        // Continue without user context if auth fails
      }

      // Skip audit if configured
      if (config?.skipAuditOn?.(req)) {
        return handler(req, res);
      }

      // Execute the handler
      await handler(req, res);
      
    } catch (error: any) {
      success = false;
      errorMessage = error.message || 'Unknown error';
      throw error; // Re-throw to maintain normal error handling
    } finally {
      // Create audit event
      if (auditContext?.orgId && config) {
        const action = config.action || `${req.method?.toLowerCase()}_${config.target}`;
        const target = config.target || 'unknown';
        
        await createAuditEvent(auditContext, {
          action,
          target,
          details: {
            method: req.method,
            url: req.url,
            duration: Date.now() - startTime,
            query: req.query,
            body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
          },
          category: config.category || 'GENERAL',
          success,
          errorMessage,
        });
      }
    }
  };
}

/**
 * Create audit event for important actions (helper)
 */
export async function auditAction(
  req: NextApiRequest,
  eventData: AuditEventData
): Promise<void> {
  const context = getAuditContext(req);
  
  try {
    const user = await getAuthenticatedUser(req);
    if (user) {
      context.userId = user.id;
      context.orgId = user.orgId;
    }
  } catch {
    // Continue without user context
  }

  if (context.orgId) {
    await createAuditEvent(context, eventData);
  }
}

/**
 * Sanitize request body for audit logging
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Policy enforcement helper
 */
export async function enforceSecurityPolicy(
  orgId: string,
  policyCategory: string,
  action: string,
  context?: Record<string, any>
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get applicable policies
    const policies = await db.securityPolicy.findMany({
      where: {
        orgId,
        category: policyCategory as any,
        enabled: true,
      },
    });

    // Apply policy logic based on category and action
    for (const policy of policies) {
      const config = policy.config as any;
      
      // Example policy enforcement - can be extended
      if (policyCategory === 'AUTHENTICATION' && policy.name === 'Password Policy') {
        if (action === 'password_change' && context?.password) {
          const password = context.password;
          
          if (config.minLength && password.length < config.minLength) {
            return { allowed: false, reason: `Password must be at least ${config.minLength} characters` };
          }
          
          if (config.requireUppercase && !/[A-Z]/.test(password)) {
            return { allowed: false, reason: 'Password must contain uppercase letters' };
          }
          
          if (config.requireLowercase && !/[a-z]/.test(password)) {
            return { allowed: false, reason: 'Password must contain lowercase letters' };
          }
          
          if (config.requireNumbers && !/\d/.test(password)) {
            return { allowed: false, reason: 'Password must contain numbers' };
          }
          
          if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return { allowed: false, reason: 'Password must contain special characters' };
          }
        }
      }
      
      if (policyCategory === 'SECURITY' && policy.name === 'Session Management') {
        if (action === 'session_check' && context?.sessionDuration) {
          const maxDuration = config.maxSessionDuration * 60 * 1000; // Convert minutes to ms
          if (context.sessionDuration > maxDuration) {
            return { allowed: false, reason: 'Session expired due to maximum duration limit' };
          }
        }
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Policy enforcement error:', error);
    // Fail secure - deny access if policy check fails
    return { allowed: false, reason: 'Policy enforcement error' };
  }
}