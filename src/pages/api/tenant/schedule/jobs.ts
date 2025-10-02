import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { schedulingService } from '@/server/services/schedulingService';
import { z } from 'zod';

const CreateJobSchema = z.object({
  org_id: z.string().optional(),
  contact_id: z.string().optional(),
  location: z.string().optional(),
  window_start: z.string().datetime(),
  window_end: z.string().datetime(),
  lob: z.string().optional(),
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
    const validated = CreateJobSchema.parse(req.body.payload || req.body);

    const job = await schedulingService.createJob(orgId, userId, validated);

    res.status(201).json({
      status: 'ok',
      result: {
        id: job.id,
        version: 1,
      },
      audit_id: `AUD-JOB-${job.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

