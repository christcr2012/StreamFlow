import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { schedulingService } from '@/server/services/schedulingService';
import { z } from 'zod';

const AssignCrewSchema = z.object({
  visit_id: z.string().min(1),
  crew_id: z.string().min(1),
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
    const validated = AssignCrewSchema.parse(req.body.payload || req.body);

    const assignment = await schedulingService.assignCrew(orgId, userId, validated);

    res.status(200).json({
      status: 'ok',
      result: {
        id: assignment.id,
        version: 1,
      },
      audit_id: `AUD-ASG-${assignment.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Assign crew error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

