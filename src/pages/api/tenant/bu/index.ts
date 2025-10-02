import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { BusinessUnitService } from '@/server/services/businessUnitService';
import { z } from 'zod';

const CreateBusinessUnitSchema = z.object({
  name: z.string().min(1).max(200),
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

  if (!orgId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const service = new BusinessUnitService();

  try {
    switch (method) {
      case 'GET': {
        // List business units
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await service.list(orgId, { limit, offset });
        return res.status(200).json(result);
      }

      case 'POST': {
        // Create business unit
        const validated = CreateBusinessUnitSchema.parse(req.body);
        const bu = await service.create(orgId, userId, validated);
        return res.status(201).json(bu);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Business unit API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

