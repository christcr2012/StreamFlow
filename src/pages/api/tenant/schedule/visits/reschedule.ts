import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { schedulingService } from '@/server/services/schedulingService';
import { z } from 'zod';

const RescheduleVisitSchema = z.object({
  visit_id: z.string().min(1),
  new_time: z.string().datetime(),
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
    const validated = RescheduleVisitSchema.parse(req.body.payload || req.body);

    const visit = await schedulingService.rescheduleVisit(orgId, userId, validated);

    res.status(200).json({
      status: 'ok',
      result: {
        id: visit.id,
        version: 1,
      },
      audit_id: `AUD-VIS-${visit.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Reschedule visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

