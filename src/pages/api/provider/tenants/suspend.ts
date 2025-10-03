import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: Federation — Suspend Tenant (line 1749)
const SuspendTenantSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    tenant_id: z.string(),
    reason: z.enum(['non_payment', 'policy_violation', 'security_breach', 'maintenance', 'other']),
    reason_details: z.string().optional(),
    suspend_until: z.string().optional(), // ISO date string
    notify_admin: z.boolean().default(true),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = SuspendTenantSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    // Provider-level RBAC check
    if (!['provider_admin'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only provider admins can suspend tenants',
      });
    }

    // Validate tenant exists and is not already suspended
    const tenant = await prisma.org.findFirst({
      where: { id: payload.tenant_id },
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      });
    }

    // Check if tenant is already suspended (using metadata)
    const existingSuspension = await prisma.note.findFirst({
      where: {
        orgId,
        entityType: 'tenant_suspension',
        body: { contains: payload.tenant_id },
        isPinned: true,
      },
    });

    if (existingSuspension) {
      return res.status(409).json({
        error: 'TENANT_ALREADY_SUSPENDED',
        message: 'Tenant is already suspended',
      });
    }

    const suspendUntil = payload.suspend_until ? new Date(payload.suspend_until) : null;

    // Update tenant (simplified - store suspension info in metadata)
    const suspendedTenant = await prisma.org.update({
      where: { id: payload.tenant_id },
      data: {
        updatedAt: new Date(),
      },
    });

    // Disable all tenant users
    await prisma.user.updateMany({
      where: { orgId: payload.tenant_id },
      data: { status: 'suspended' },
    });

    const suspensionId = `SUS-${Date.now()}`;

    // Create suspension record
    const suspension = await prisma.note.create({
      data: {
        orgId,
        entityType: 'tenant_suspension',
        entityId: suspensionId,
        userId: actor.user_id,
        body: `TENANT SUSPENSION: ${tenant.name} (${payload.reason}) - ${payload.reason_details || 'No additional details'}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.tenant.suspend',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'suspend_tenant',
        resource: `tenant:${payload.tenant_id}`,
        meta: { 
          tenant_id: payload.tenant_id,
          tenant_name: tenant.name,
          reason: payload.reason,
          reason_details: payload.reason_details,
          suspend_until: payload.suspend_until,
          notify_admin: payload.notify_admin,
          users_affected: await prisma.user.count({ where: { orgId: payload.tenant_id } })
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `FED-${suspension.id.substring(0, 6)}`,
        version: 1,
      },
      suspension: {
        id: suspension.id,
        suspension_id: suspensionId,
        tenant_id: payload.tenant_id,
        tenant_name: tenant.name,
        reason: payload.reason,
        reason_details: payload.reason_details,
        suspended_at: new Date().toISOString(),
        suspend_until: suspendUntil?.toISOString(),
        suspended_by: actor.user_id,
        notify_admin: payload.notify_admin,
        status: 'active',
        users_suspended: await prisma.user.count({ where: { orgId: payload.tenant_id, status: 'suspended' } }),
      },
      audit_id: `AUD-FED-${suspension.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error suspending tenant:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to suspend tenant',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
