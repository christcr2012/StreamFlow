import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { inventoryService } from '@/server/services/inventoryService';
import { z } from 'zod';

const AdjustStockSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    item_id: z.string(),
    delta_qty: z.number().int(),
    reason: z.string().min(1),
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

    // Validate full BINDER4_FULL contract
    const validation = AdjustStockSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract item ID
    const itemId = payload.item_id.replace('INV-', '');
    if (!itemId) {
      return res.status(400).json({
        error: 'INVALID_ITEM_ID',
        message: 'Item ID must be in format INV-000001',
      });
    }

    // Adjust stock using inventory service
    const adjustment = await inventoryService.adjustStock(orgId, userId, {
      item_id: itemId,
      quantity_change: payload.delta_qty,
      reason: payload.reason,
      reference: payload.notes,
    });

    await auditService.logBinderEvent({
      action: 'inventory.stock.adjust',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    const adjustmentId = `ADJ-${adjustment.id.substring(0, 6)}`;

    return res.status(200).json({
      status: 'ok',
      result: {
        id: adjustmentId,
        version: 1,
      },
      adjustment: {
        id: adjustmentId,
        item_id: payload.item_id,
        delta_qty: payload.delta_qty,
        reason: payload.reason,
        notes: payload.notes,
        new_quantity: (adjustment.customFields as any)?.quantity || 0,
        adjusted_at: adjustment.createdAt,
        adjusted_by: userId,
      },
      audit_id: `AUD-ADJ-${adjustment.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    await auditService.logBinderEvent({
      action: 'inventory.stock.adjust.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to adjust stock',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
