import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_974458Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder11_FULL line 538839
// tenant/{tenant_id}/hydrovac/fleet/action1
// Method: POST
// Path: /api/tenant/{tenant_id}/hydrovac/fleet/action1

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_974458Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_974458',
    binder: 'binder11_FULL',
    method: 'POST',
    line: 538839
  });
}

export default handler;