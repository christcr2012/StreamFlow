import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { billingService } from '@/server/services/billingService';
import { z } from 'zod';

const RecordPaymentSchema = z.object({
  invoice_id: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().default('stripe'),
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
    const validated = RecordPaymentSchema.parse(req.body.payload || req.body);

    const payment = await billingService.recordPayment(orgId, userId, validated);

    res.status(201).json({
      status: 'ok',
      result: {
        id: payment.id,
        version: 1,
      },
      audit_id: `AUD-PAY-${payment.id}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

