/**
 * Fleet Vehicle API - Get, Update, Delete
 * Binder3: Fleet & Assets Management
 * 
 * GET    /api/tenant/fleet/vehicles/[id] - Get vehicle
 * PATCH  /api/tenant/fleet/vehicles/[id] - Update vehicle
 * DELETE /api/tenant/fleet/vehicles/[id] - Delete vehicle
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { fleetVehicleService } from '@/server/services/fleet/fleetVehicleService';
import { auditService } from '@/lib/auditService';

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method, query } = req;
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';
  const vehicleId = query.id as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!vehicleId) {
    res.status(400).json({ error: 'Vehicle ID required' });
    return;
  }

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res, orgId, vehicleId);
        break;
      case 'PATCH':
        await handlePatch(req, res, orgId, userId, vehicleId);
        break;
      case 'DELETE':
        await handleDelete(req, res, orgId, userId, vehicleId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('[Fleet Vehicle API] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  vehicleId: string
): Promise<void> {
  const vehicle = await fleetVehicleService.getById(orgId, vehicleId);

  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }

  res.status(200).json({
    status: 'ok',
    result: vehicle,
  });
}

async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  userId: string,
  vehicleId: string
): Promise<void> {
  const vehicle = await fleetVehicleService.update(orgId, userId, vehicleId, req.body);

  await auditService.logBinderEvent({
    action: 'fleet.vehicle.update',
    tenantId: orgId,
    path: req.url,
    ts: Date.now(),
  });

  res.status(200).json({
    status: 'ok',
    result: vehicle,
  });
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  userId: string,
  vehicleId: string
): Promise<void> {
  const { hard } = req.query;

  await fleetVehicleService.delete(orgId, userId, vehicleId, hard === 'true');

  await auditService.logBinderEvent({
    action: 'fleet.vehicle.delete',
    tenantId: orgId,
    path: req.url,
    ts: Date.now(),
  });

  res.status(204).end();
}

export default withAudience('tenant', handler);

