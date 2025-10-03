import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: Migration — Approve Mapping (04_migration)
const ApproveSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    // Add specific payload fields based on button specification
    id: z.string().optional(),
    name: z.string().optional(),
    data: z.any().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = ApproveSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    // RBAC check based on audience
    const allowedRoles = ['EMPLOYEE', 'MANAGER', 'OWNER'];
    
    if (!allowedRoles.includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
      });
    }

    // Create or update resource
    const resourceId = `${'APP'}-${Date.now()}`;
    
    const resource = await prisma.note.create({
      data: {
        orgId,
        entityType: 'approve',
        entityId: resourceId,
        userId: actor.user_id,
        body: `MIGRATION — APPROVE MAPPING: ${JSON.stringify(payload)}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.migration___approve_mapping',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'migration___approve_mapping',
        resource: `${'approve'}:${resource.id}`,
        meta: payload,
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `${'APP'}-${resource.id.substring(0, 6)}`,
        version: 1,
      },
      approve: {
        id: resource.id,
        resource_id: resourceId,
        ...payload,
        status: 'created',
        created_at: resource.createdAt.toISOString(),
      },
      audit_id: `AUD-${'APP'}-${resource.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error in Migration — Approve Mapping:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process Migration — Approve Mapping',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));