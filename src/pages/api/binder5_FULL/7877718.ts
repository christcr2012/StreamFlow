import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_7877718Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 1788
// Federation — Enable Add-on
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_7877718Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_7877718',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 1788
  });
}

export default handler;