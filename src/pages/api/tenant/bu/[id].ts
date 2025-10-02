import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { BusinessUnitService } from '@/server/services/businessUnitService';
import { z } from 'zod';

const UpdateBusinessUnitSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  timezone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;
  const buId = req.query.id as string;

  if (!orgId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!buId) {
    return res.status(400).json({ error: 'Business unit ID required' });
  }

  const service = new BusinessUnitService();

  try {
    switch (method) {
      case 'GET': {
        // Get business unit by ID
        const bu = await service.getById(orgId, buId);
        if (!bu) {
          res.status(404).json({ error: 'Business unit not found' });
          return;
        }
        res.status(200).json(bu);
        return;
      }

      case 'PATCH': {
        // Update business unit
        const validated = UpdateBusinessUnitSchema.parse(req.body);
        const bu = await service.update(orgId, userId, buId, validated);
        res.status(200).json(bu);
        return;
      }

      case 'DELETE': {
        // Delete business unit
        await service.delete(orgId, userId, buId);
        res.status(204).end();
        return;
      }

      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Business unit API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

