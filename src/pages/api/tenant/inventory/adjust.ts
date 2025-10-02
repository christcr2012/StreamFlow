import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/middleware/withRateLimit';
import { withIdempotency } from '@/middleware/withIdempotency';
import { inventoryService } from '@/server/services/inventoryService';
import { z } from 'zod';

const AdjustStockSchema = z.object({
  item_id: z.string().min(1),
  quantity_change: z.number().int(),
  reason: z.string().min(1),
  reference: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${method} not allowed` });
    return;
  }

  try {
    const validated = AdjustStockSchema.parse(req.body.payload || req.body);

    const item = await inventoryService.adjustStock(orgId, userId, validated);

    res.status(200).json({
      status: 'ok',
      result: {
        id: item.id,
        version: 1,
      },
      audit_id: `AUD-STK-${item.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message === 'Insufficient stock') {
      res.status(400).json({ error: 'Insufficient stock' });
      return;
    }

    console.error('Adjust stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withRateLimit(
  RATE_LIMIT_CONFIGS.DEFAULT,
  withIdempotency(
    withAudience(AUDIENCE.CLIENT_ONLY, handler)
  )
);

