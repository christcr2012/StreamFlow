import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { LineOfBusinessService } from '@/server/services/lineOfBusinessService';
import { z } from 'zod';

const CreateLineOfBusinessSchema = z.object({
  buId: z.string().uuid().optional(),
  key: z.string().min(1).max(100),
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const service = new LineOfBusinessService();

  try {
    switch (method) {
      case 'GET': {
        // List lines of business
        const buId = req.query.buId as string | undefined;
        const enabled = req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await service.list(orgId, { buId, enabled, limit, offset });
        return res.status(200).json(result);
      }

      case 'POST': {
        // Create/enable line of business
        const validated = CreateLineOfBusinessSchema.parse(req.body);
        const lob = await service.create(orgId, userId, validated);
        return res.status(201).json(lob);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Line of business API error:', error);
    
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

