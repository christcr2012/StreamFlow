import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { inventoryService } from '@/server/services/inventoryService';
import { z } from 'zod';

const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  unit_price: z.number().positive(),
  quantity: z.number().int().min(0).default(0),
  reorder_point: z.number().int().min(0).default(10),
  bu_id: z.string().optional(),
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
      const validated = CreateInventoryItemSchema.parse(req.body.payload || req.body);

      const item = await inventoryService.createItem(orgId, userId, validated);

      res.status(201).json({
        status: 'ok',
        result: {
          id: item.id,
          version: 1,
        },
        audit_id: `AUD-INV-${item.id}`,
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

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

