/**
 * Close Maintenance Ticket API
 * Binder3: Fleet & Assets Management
 * 
 * POST /api/tenant/fleet/maintenance_tickets/close - Close ticket
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { maintenanceTicketService } from '@/server/services/fleet/maintenanceTicketService';

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
    const { ticket_id, resolution_notes, closed_at } = req.body;

    if (!ticket_id) {
      res.status(400).json({ error: 'ticket_id required' });
      return;
    }

    const ticket = await maintenanceTicketService.close(orgId, userId, ticket_id, {
      resolutionNotes: resolution_notes,
      closedAt: closed_at,
    });

    res.status(200).json({
      status: 'ok',
      result: ticket,
    });
  } catch (error: any) {
    console.error('[Close Ticket API] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

