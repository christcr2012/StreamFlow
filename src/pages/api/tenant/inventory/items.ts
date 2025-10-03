import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/middleware/withRateLimit';
import { withIdempotency } from '@/middleware/withIdempotency';
import { inventoryService } from '@/server/services/inventoryService';
import { auditService } from '@/lib/auditService';
import { z } from 'zod';

const CreateInventoryItemSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    uom: z.string().min(1), // Unit of measure
    price_cents: z.number().int().min(0),
    description: z.string().optional(),
    category: z.string().optional(),
    reorder_point: z.number().int().min(0).default(10),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (method === 'POST') {
    try {
      // Validate full BINDER4_FULL contract
      const validation = CreateInventoryItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
      }

      const { request_id, payload, idempotency_key } = validation.data;

      // Create inventory item with BINDER4_FULL payload format
      const itemData = {
        name: payload.name,
        sku: payload.sku,
        category: payload.category || 'general',
        description: payload.description,
        unit_price: payload.price_cents / 100, // Convert cents to dollars
        quantity: 0, // Start with 0 quantity
        reorder_point: payload.reorder_point,
        bu_id: validation.data.bu_id,
        uom: payload.uom,
      };

      const item = await inventoryService.createItem(orgId, userId, itemData);

      await auditService.logBinderEvent({
        action: 'inventory.item.create',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      const itemId = `INV-${item.id.substring(0, 6)}`;

      res.status(201).json({
        status: 'ok',
        result: {
          id: itemId,
          version: 1,
        },
        item: {
          id: itemId,
          sku: payload.sku,
          name: payload.name,
          uom: payload.uom,
          price_cents: payload.price_cents,
          description: payload.description,
          category: itemData.category,
          reorder_point: payload.reorder_point,
          created_at: item.createdAt,
        },
        audit_id: `AUD-INV-${item.id.substring(0, 6)}`,
      });
      return;
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }

      console.error('Create inventory item error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  } else if (method === 'GET') {
    try {
      const { category, bu_id, low_stock, limit, offset } = req.query;

      const result = await inventoryService.listItems(orgId, {
        category: category as string,
        bu_id: bu_id as string,
        low_stock: low_stock === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json({
        status: 'ok',
        result,
      });
      return;
    } catch (error: any) {
      console.error('List inventory items error:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: `Method ${method} not allowed` });
    return;
  }
}

export default withRateLimit(
  RATE_LIMIT_CONFIGS.DEFAULT,
  withIdempotency(
    withAudience('tenant', handler)
  )
);

