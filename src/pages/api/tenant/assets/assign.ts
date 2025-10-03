import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AssignAssetSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    asset_id: z.string(),
    work_order_id: z.string(),
    assignment_type: z.enum(['required', 'optional', 'consumable']).default('required'),
    quantity: z.number().int().positive().default(1),
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
    const userId = req.headers['x-user-id'] as string || 'user_test';

    const validation = AssignAssetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Verify asset exists
    const asset = await prisma.asset.findFirst({
      where: {
        id: payload.asset_id.replace('AST-', ''),
        orgId,
      },
    });

    if (!asset) {
      return res.status(404).json({
        error: 'ASSET_NOT_FOUND',
        message: 'Asset not found',
      });
    }

    // Verify work order exists
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: payload.work_order_id.replace('WO-', ''),
        orgId,
      },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    // Check if asset is available for assignment
    const currentCustomFields = (asset.customFields as any) || {};
    const currentStatus = currentCustomFields.status || 'available';
    
    if (currentStatus === 'checked_out' && payload.assignment_type !== 'consumable') {
      return res.status(422).json({
        error: 'ASSET_UNAVAILABLE',
        message: 'Asset is currently checked out',
      });
    }

    // Create assignment record
    const assignment = await prisma.note.create({
      data: {
        orgId,
        entityType: 'asset',
        entityId: asset.id,
        userId,
        body: `ASSET ASSIGNED: ${asset.name} assigned to work order ${payload.work_order_id} (${payload.assignment_type}, qty: ${payload.quantity})${payload.notes ? `. Notes: ${payload.notes}` : ''}`,
        isPinned: true,
      },
    });

    // Update asset with assignment info
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        customFields: {
          ...currentCustomFields,
          status: 'assigned',
          assigned_to_work_order: payload.work_order_id,
          assignment_type: payload.assignment_type,
          assigned_quantity: payload.quantity,
          assigned_at: new Date().toISOString(),
          assigned_by: userId,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'assets.assign',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'manager',
        action: 'assign_asset',
        resource: `asset:${asset.id}`,
        meta: {
          asset_id: payload.asset_id,
          work_order_id: payload.work_order_id,
          assignment_type: payload.assignment_type,
          quantity: payload.quantity,
          notes: payload.notes,
        },
      },
    });

    const assignmentId = `ASSIGN-${assignment.id.substring(0, 6)}`;
    const assetIdFormatted = `AST-${asset.id.substring(0, 6)}`;
    const workOrderIdFormatted = `WO-${workOrder.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: assignmentId,
        version: 1,
      },
      asset_assignment: {
        id: assignmentId,
        asset_id: assetIdFormatted,
        asset_name: asset.name,
        work_order_id: workOrderIdFormatted,
        work_order_title: workOrder.title,
        assignment_type: payload.assignment_type,
        quantity: payload.quantity,
        status: 'assigned',
        assigned_by: userId,
        assigned_at: assignment.createdAt,
        notes: payload.notes,
      },
      audit_id: `AUD-ASSIGN-${assignment.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error assigning asset:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to assign asset',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
