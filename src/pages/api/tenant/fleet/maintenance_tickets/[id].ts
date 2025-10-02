/**
 * Fleet Maintenance Ticket API - Get, Update, Delete, Close
 * Binder3: Fleet & Assets Management
 * 
 * GET    /api/tenant/fleet/maintenance_tickets/[id] - Get ticket
 * PATCH  /api/tenant/fleet/maintenance_tickets/[id] - Update ticket
 * DELETE /api/tenant/fleet/maintenance_tickets/[id] - Delete ticket
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { maintenanceTicketService } from '@/server/services/fleet/maintenanceTicketService';

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method, query } = req;
  const { orgId, userId } = req as any;
  const ticketId = query.id as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!ticketId) {
    res.status(400).json({ error: 'Ticket ID required' });
    return;
  }

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res, orgId, ticketId);
        break;
      case 'PATCH':
        await handlePatch(req, res, orgId, userId, ticketId);
        break;
      case 'DELETE':
        await handleDelete(req, res, orgId, userId, ticketId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('[Maintenance Ticket API] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  ticketId: string
): Promise<void> {
  const ticket = await maintenanceTicketService.getById(orgId, ticketId);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.status(200).json({
    status: 'ok',
    result: ticket,
  });
}

async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  userId: string,
  ticketId: string
): Promise<void> {
  const ticket = await maintenanceTicketService.update(orgId, userId, ticketId, req.body);

  res.status(200).json({
    status: 'ok',
    result: ticket,
  });
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  userId: string,
  ticketId: string
): Promise<void> {
  await maintenanceTicketService.delete(orgId, userId, ticketId);

  res.status(204).end();
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

