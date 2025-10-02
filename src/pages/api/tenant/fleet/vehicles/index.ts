/**
 * Fleet Vehicles API - List & Create
 * Binder3: Fleet & Assets Management
 * 
 * GET  /api/tenant/fleet/vehicles - List vehicles
 * POST /api/tenant/fleet/vehicles - Create vehicle
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

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res, orgId);
        break;
      case 'POST':
        await handlePost(req, res, orgId, userId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('[Fleet Vehicles API] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string
): Promise<void> {
  const { buId, status, limit, offset } = req.query;

  const vehicles = await fleetVehicleService.list(orgId, {
    buId: buId as string | undefined,
    status: status as string | undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  });

  res.status(200).json({
    status: 'ok',
    result: vehicles,
  });
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  userId: string
): Promise<void> {
  const vehicle = await fleetVehicleService.create(orgId, userId, req.body);

  res.status(201).json({
    status: 'ok',
    result: vehicle,
  });
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

