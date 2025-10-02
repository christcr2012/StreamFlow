import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { schedulingService } from '@/server/services/schedulingService';
import { z } from 'zod';

const CompleteVisitSchema = z.object({
  visit_id: z.string().min(1),
  completed_at: z.string().datetime().optional(),
  notes: z.string().optional(),
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
    const validated = CompleteVisitSchema.parse(req.body.payload || req.body);

    const visit = await schedulingService.completeVisit(
      orgId,
      userId,
      validated.visit_id,
      validated.completed_at,
      validated.notes
    );

    res.status(200).json({
      status: 'ok',
      result: {
        id: visit.id,
        version: visit.version,
      },
      audit_id: `AUD-VIS-${visit.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Complete visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

