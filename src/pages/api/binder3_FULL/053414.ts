import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_053414Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder3_FULL line 505
// /tenant/fleet/maintenance_tickets/close
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_053414Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_053414',
    binder: 'binder3_FULL',
    method: 'POST',
    line: 505
  });
}

export default handler;