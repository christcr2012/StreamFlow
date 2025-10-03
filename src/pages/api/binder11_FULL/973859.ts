import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_973859Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder11_FULL line 87791
// tenant/{tenant_id}/fencing/fleet/action1
// Method: POST
// Path: /api/tenant/{tenant_id}/fencing/fleet/action1

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_973859Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_973859',
    binder: 'binder11_FULL',
    method: 'POST',
    line: 87791
  });
}

export default handler;