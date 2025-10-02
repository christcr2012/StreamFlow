import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;

  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (method) {
      case 'GET': {
        // Get pricing catalog
        const catalog = await prisma.pricingCatalogItem.findMany({
          orderBy: { key: 'asc' },
        });

        return res.status(200).json({ catalog });
      }

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Pricing API error:', error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

