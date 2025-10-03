import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Quality Control Management
const CreateQualityCheckSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string().optional(),
    project_id: z.string().optional(),
    check_type: z.enum(['pre_work', 'in_progress', 'post_completion', 'random_audit', 'customer_complaint']),
    checklist_template: z.string(),
    inspector: z.string(),
    scheduled_date: z.string(),
    location: z.string(),
    criteria: z.array(z.object({
      item: z.string(),
      requirement: z.string(),
      critical: z.boolean().default(false),
    })),
    priority: z.enum(['routine', 'high', 'urgent']).default('routine'),
    notes: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateQualityCheckSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers and owners can create quality checks',
      });
    }

    // Validate inspector exists
    const inspector = await prisma.user.findFirst({
      where: { id: payload.inspector, orgId },
    });

    if (!inspector) {
      return res.status(404).json({
        error: 'INSPECTOR_NOT_FOUND',
        message: 'Inspector not found',
      });
    }

    // Validate work order or project exists if provided
    if (payload.work_order_id) {
      const workOrder = await prisma.workOrder.findFirst({
        where: { id: payload.work_order_id, orgId },
      });

      if (!workOrder) {
        return res.status(404).json({
          error: 'WORK_ORDER_NOT_FOUND',
          message: 'Work order not found',
        });
      }
    }

    const qualityCheckId = `QC-${Date.now()}`;

    const qualityCheck = await prisma.note.create({
      data: {
        orgId,
        entityType: 'quality_check',
        entityId: qualityCheckId,
        userId: actor.user_id,
        body: `QUALITY CHECK: ${payload.check_type} - ${payload.checklist_template} (${payload.criteria.length} criteria)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.quality.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_quality_check',
        resource: `quality_check:${qualityCheck.id}`,
        meta: { 
          work_order_id: payload.work_order_id,
          project_id: payload.project_id,
          check_type: payload.check_type,
          inspector: payload.inspector,
          scheduled_date: payload.scheduled_date,
          criteria_count: payload.criteria.length 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `QC-${qualityCheck.id.substring(0, 6)}`,
        version: 1,
      },
      quality_check: {
        id: qualityCheck.id,
        quality_check_id: qualityCheckId,
        work_order_id: payload.work_order_id,
        project_id: payload.project_id,
        check_type: payload.check_type,
        checklist_template: payload.checklist_template,
        inspector: payload.inspector,
        inspector_name: inspector.name,
        scheduled_date: payload.scheduled_date,
        location: payload.location,
        criteria: payload.criteria,
        criteria_count: payload.criteria.length,
        critical_criteria_count: payload.criteria.filter(c => c.critical).length,
        priority: payload.priority,
        notes: payload.notes,
        status: 'scheduled',
        created_at: qualityCheck.createdAt.toISOString(),
      },
      audit_id: `AUD-QC-${qualityCheck.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating quality check:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create quality check',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
