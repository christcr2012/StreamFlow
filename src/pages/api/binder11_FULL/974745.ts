import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_974745Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder11_FULL line 753168
// tenant/{tenant_id}/landscaping/workorders/action1
// Method: POST
// Path: /api/tenant/{tenant_id}/landscaping/workorders/action1

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_974745Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_974745',
    binder: 'binder11_FULL',
    method: 'POST',
    line: 753168
  });
}

export default handler;