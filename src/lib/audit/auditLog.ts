// ConversionAudit Helper (Binder2 - Option C - Authoritative)
// Tracks all CRM entity conversions and mutations for compliance

import { prisma } from '@/lib/prisma';

export type AuditInput = {
  tenantId: string;
  organizationId?: string | null;
  userId?: string | null;
  action: 'create' | 'update' | 'delete' | 'merge' | 'convert';
  resource: string; // e.g., `organization:${id}`, `contact:${id}`, `opportunity:${id}`
  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Log a CRM audit event to ConversionAudit table
 * 
 * @param input - Audit event details
 * @returns Promise<void>
 * 
 * @example
 * ```typescript
 * await auditLog({
 *   tenantId: orgId,
 *   organizationId: org.id,
 *   userId,
 *   action: 'create',
 *   resource: `organization:${org.id}`,
 *   meta: { payloadShape: 'OrgCreateV1', name: org.name },
 *   ip: req.headers['x-forwarded-for'] as string,
 *   userAgent: req.headers['user-agent'] as string
 * });
 * ```
 */
export async function auditLog(input: AuditInput): Promise<void> {
  const {
    tenantId,
    organizationId = null,
    userId = null,
    action,
    resource,
    meta,
    ip,
    userAgent,
  } = input;

  try {
    await prisma.conversionAudit.create({
      data: {
        tenantId,
        organizationId: organizationId || undefined,
        userId: userId || undefined,
        action,
        resource,
        meta: meta ? (meta as any) : undefined,
        ip: ip || undefined,
        userAgent: userAgent || undefined,
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('[auditLog] Failed to create audit log:', error);
  }
}

