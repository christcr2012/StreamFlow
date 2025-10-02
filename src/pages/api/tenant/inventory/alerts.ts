import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { inventoryService } from '@/server/services/inventoryService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${method} not allowed` });
    return;
  }

  try {
    const { bu_id } = req.query;

    const alerts = await inventoryService.getLowStockAlerts(orgId, bu_id as string);

    res.status(200).json({
      status: 'ok',
      result: {
        alerts,
        count: alerts.length,
      },
    });
    return;
  } catch (error: any) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

