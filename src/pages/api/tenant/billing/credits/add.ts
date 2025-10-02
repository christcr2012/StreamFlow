import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { ULAPService } from '@/server/services/ulapService';
import { z } from 'zod';

const AddCreditsSchema = z.object({
  key: z.string().min(1),
  amountCents: z.number().int().positive(),
  reason: z.string().min(1),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const service = new ULAPService();

  try {
    switch (method) {
      case 'POST': {
        // Add credits (prepay)
        const validated = AddCreditsSchema.parse(req.body);
        await service.addCredits(
          orgId,
          validated.key,
          BigInt(validated.amountCents),
          validated.reason
        );

        const newBalance = await service.getBalance(orgId, validated.key);
        return res.status(200).json({
          success: true,
          key: validated.key,
          amountAdded: validated.amountCents,
          newBalance: newBalance.toString(),
        });
      }

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Add credits API error:', error);

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

