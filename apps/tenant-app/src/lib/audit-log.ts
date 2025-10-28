/**
 * Audit logging for tenant-app
 * Phase 2: Database logging with AuditEvent model
 */

import { prisma } from './prisma';

export interface AuditContext {
  providerId?: string;
  developerId?: string;
  tenantId?: string;
  isDirectAccess?: boolean;
  orgId?: string;
}

export async function logLoginSuccess(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  method: string,
  context?: AuditContext
): Promise<void> {
  const contextStr = context ? ` [${formatContext(context)}]` : '';
  console.log(`✅ LOGIN SUCCESS: ${email} (${userId}) from ${ipAddress} via ${method}${contextStr}`);
  
  // Write to database
  try {
    await prisma.auditEvent.create({
      data: {
        actorType: 'user',
        actorId: userId,
        action: 'LOGIN_SUCCESS',
        entityType: 'auth',
        entityId: userId,
        metadata: {
          email,
          method,
          context: context || {}
        },
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Failed to write audit log to database:', error);
  }
}

export async function logLoginFailure(
  email: string,
  ipAddress: string,
  userAgent: string,
  reason: string,
  context?: AuditContext
): Promise<void> {
  const contextStr = context ? ` [${formatContext(context)}]` : '';
  console.log(`❌ LOGIN FAILURE: ${email} from ${ipAddress} - ${reason}${contextStr}`);
  
  // Write to database
  try {
    await prisma.auditEvent.create({
      data: {
        actorType: 'anonymous',
        actorId: null,
        action: 'LOGIN_FAILURE',
        entityType: 'auth',
        entityId: null,
        metadata: {
          email,
          reason,
          context: context || {}
        },
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Failed to write audit log to database:', error);
  }
}

export async function logEmergencyAccess(
  role: 'provider' | 'developer',
  email: string,
  ipAddress: string,
  userAgent: string,
  context?: AuditContext
): Promise<void> {
  const contextStr = context ? ` [${formatContext(context)}]` : '';
  console.warn(`🚨 EMERGENCY ACCESS: ${role} ${email} from ${ipAddress}${contextStr}`);
  
  // Write to database
  try {
    await prisma.auditEvent.create({
      data: {
        actorType: role,
        actorId: role === 'provider' ? context?.providerId || null : context?.developerId || null,
        action: 'EMERGENCY_ACCESS',
        entityType: 'auth',
        entityId: null,
        metadata: {
          email,
          role,
          context: context || {}
        },
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Failed to write audit log to database:', error);
  }
}

export async function logAction(
  action: string,
  userId: string,
  email: string,
  ipAddress: string,
  details: string,
  context?: AuditContext
): Promise<void> {
  const contextStr = context ? ` [${formatContext(context)}]` : '';
  console.log(`📝 ACTION: ${action} by ${email} (${userId}) from ${ipAddress} - ${details}${contextStr}`);
  
  // Write to database
  try {
    await prisma.auditEvent.create({
      data: {
        actorType: 'user',
        actorId: userId,
        action,
        entityType: 'action',
        entityId: null,
        metadata: {
          email,
          details,
          context: context || {}
        },
        ipAddress,
        userAgent: ''
      }
    });
  } catch (error) {
    console.error('Failed to write audit log to database:', error);
  }
}

/**
 * Log data changes for audit trail (for AuditLog model)
 */
export async function logDataChange(
  orgId: string,
  actorUserId: string | null,
  entity: string,
  entityId: string | null,
  field: string | null,
  oldValue: any,
  newValue: any,
  reason?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        orgId,
        actorUserId,
        entity,
        entityId,
        field,
        oldValue: oldValue !== null ? oldValue : null,
        newValue: newValue !== null ? newValue : null,
        reason: reason || null
      }
    });
  } catch (error) {
    console.error('Failed to write data change audit log:', error);
  }
}

function formatContext(context: AuditContext): string {
  const parts: string[] = [];

  if (context.isDirectAccess) {
    parts.push('DIRECT_ACCESS');
  }

  if (context.providerId) {
    parts.push(`provider:${context.providerId}`);
  }

  if (context.developerId) {
    parts.push(`developer:${context.developerId}`);
  }

  if (context.tenantId) {
    parts.push(`tenant:${context.tenantId}`);
  }

  if (context.orgId) {
    parts.push(`org:${context.orgId}`);
  }

  return parts.join(', ');
}


