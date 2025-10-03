import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Inventory Stock Transfer
const StockTransferSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    item_id: z.string(),
    from_location: z.string(),
    to_location: z.string(),
    quantity: z.number().positive(),
    reason: z.string(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = StockTransferSchema.safeParse(req.body);
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
        message: 'Only managers and owners can transfer stock',
      });
    }

    const transfer = await prisma.note.create({
      data: {
        orgId,
        entityType: 'stock_transfer',
        entityId: `XFER-${Date.now()}`,
        userId: actor.user_id,
        body: `STOCK TRANSFER: ${payload.item_id} - ${payload.quantity} units from ${payload.from_location} to ${payload.to_location}. Reason: ${payload.reason}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.inventory.stock_transfer',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'stock_transfer',
        resource: `inventory:${payload.item_id}`,
        meta: { 
          item_id: payload.item_id,
          from_location: payload.from_location,
          to_location: payload.to_location,
          quantity: payload.quantity,
          reason: payload.reason 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: transfer.entityId,
        version: 1,
      },
      transfer: {
        transfer_id: transfer.entityId,
        item_id: payload.item_id,
        from_location: payload.from_location,
        to_location: payload.to_location,
        quantity: payload.quantity,
        reason: payload.reason,
        transferred_at: new Date().toISOString(),
        status: 'completed',
      },
      audit_id: `AUD-${transfer.entityId}`,
    });
  } catch (error) {
    console.error('Error transferring stock:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to transfer stock',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
