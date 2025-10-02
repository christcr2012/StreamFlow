/**
 * Log Odometer API
 * Binder3: Fleet & Assets Management
 * 
 * POST /api/tenant/fleet/odometer - Log odometer reading
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { fleetVehicleService } from '@/server/services/fleet/fleetVehicleService';

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method } = req;
  const { orgId, userId } = req as any;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${method} Not Allowed` });
    return;
  }

  try {
    const { vehicle_id, odometer, logged_at } = req.body;

    if (!vehicle_id || odometer === undefined) {
      res.status(400).json({ error: 'vehicle_id and odometer required' });
      return;
    }

    const vehicle = await fleetVehicleService.logOdometer(
      orgId,
      userId,
      vehicle_id,
      BigInt(odometer),
      logged_at ? new Date(logged_at) : undefined
    );

    res.status(200).json({
      status: 'ok',
      result: vehicle,
    });
  } catch (error: any) {
    console.error('[Log Odometer API] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

