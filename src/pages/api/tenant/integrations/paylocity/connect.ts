import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { integrationService } from '@/server/services/integrationService';
import { z } from 'zod';

const ConnectPaylocitySchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  company_id: z.string().min(1),
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
    const validated = ConnectPaylocitySchema.parse(req.body);

    const integration = await integrationService.connectPaylocity(
      orgId,
      userId,
      validated
    );

    res.status(200).json({
      status: 'ok',
      result: {
        id: integration.id,
        type: integration.type,
        status: integration.status,
      },
      audit_id: `AUD-INT-${integration.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Paylocity connect error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

