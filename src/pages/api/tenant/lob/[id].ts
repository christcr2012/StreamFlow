import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { LineOfBusinessService } from '@/server/services/lineOfBusinessService';
import { z } from 'zod';

const UpdateLineOfBusinessSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;
  const lobId = req.query.id as string;

  if (!orgId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!lobId) {
    return res.status(400).json({ error: 'Line of business ID required' });
  }

  const service = new LineOfBusinessService();

  try {
    switch (method) {
      case 'GET': {
        // Get line of business by ID
        const lob = await service.getById(orgId, lobId);
        if (!lob) {
          res.status(404).json({ error: 'Line of business not found' });
          return;
        }
        res.status(200).json(lob);
        return;
      }

      case 'PATCH': {
        // Update line of business
        const validated = UpdateLineOfBusinessSchema.parse(req.body);
        const lob = await service.update(orgId, userId, lobId, validated);
        res.status(200).json(lob);
        return;
      }

      case 'DELETE': {
        // Delete/disable line of business
        await service.delete(orgId, userId, lobId);
        res.status(204).end();
        return;
      }

      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Line of business API error:', error);
    
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

