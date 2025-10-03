import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UsePartSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    item_id: z.string(),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }).optional(),
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

    const validation = UsePartSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;
    const workOrderId = payload.work_order_id.replace('WO-', '');
    const itemId = payload.item_id.replace('INV-', '');

    // Verify work order exists and user has access
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, orgId },
      include: { assignments: true },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    const isAssigned = workOrder.assignments.some(
      assignment => assignment.employeeId === userId && !assignment.unassignedAt
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: 'NOT_ASSIGNED',
        message: 'User is not assigned to this work order',
      });
    }

    // Verify inventory item exists and has sufficient stock
    const inventoryItem = await prisma.asset.findFirst({
      where: {
        id: itemId,
        orgId,
        category: 'inventory',
      },
    });

    if (!inventoryItem) {
      return res.status(404).json({
        error: 'ITEM_NOT_FOUND',
        message: 'Inventory item not found',
      });
    }

    const currentStock = (inventoryItem.customFields as any)?.quantity || 0;
    if (currentStock < payload.quantity) {
      return res.status(422).json({
        error: 'INSUFFICIENT_STOCK',
        message: `Only ${currentStock} units available`,
      });
    }

    // Update inventory stock
    const newStock = currentStock - payload.quantity;
    await prisma.asset.update({
      where: { id: itemId },
      data: {
        customFields: {
          ...((inventoryItem.customFields as any) || {}),
          quantity: newStock,
        },
      },
    });

    // Create parts usage record using Note model
    const partsUsage = await prisma.note.create({
      data: {
        orgId,
        entityType: 'workorder',
        entityId: workOrderId,
        userId,
        body: `Parts Used: ${inventoryItem.name} - Used ${payload.quantity} units${payload.notes ? `. Notes: ${payload.notes}` : ''}`,
        isPinned: true, // Pin parts usage notes
      },
    });

    await auditService.logBinderEvent({
      action: 'workorder.parts.use',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'use_part',
        resource: `workorder:${workOrderId}`,
        meta: {
          item_id: payload.item_id,
          quantity: payload.quantity,
          new_stock: newStock,
          notes: payload.notes,
          location: payload.location,
        },
      },
    });

    const usageId = `USAGE-${partsUsage.id.substring(0, 6)}`;
    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: usageId,
        version: 1,
      },
      parts_usage: {
        id: usageId,
        work_order_id: workOrderIdFormatted,
        item_id: payload.item_id,
        item_name: inventoryItem.name,
        quantity: payload.quantity,
        remaining_stock: newStock,
        notes: payload.notes,
        used_by: userId,
        used_at: partsUsage.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-USAGE-${partsUsage.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error using part:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to use part',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
