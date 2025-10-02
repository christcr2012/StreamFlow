import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { ULAPService } from '@/server/services/ulapService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;

  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const service = new ULAPService();

  try {
    switch (method) {
      case 'GET': {
        // Get credit balance for a specific key or all keys
        const key = req.query.key as string | undefined;

        if (key) {
          const balance = await service.getBalance(orgId, key);
          return res.status(200).json({ key, balance: balance.toString() });
        }

        // Get all balances (aggregate by key)
        const allEntries = await service.getAllBalances(orgId);
        return res.status(200).json({ balances: allEntries });
      }

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Credits API error:', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

