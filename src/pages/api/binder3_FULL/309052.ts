import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_309052Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder3_FULL line 36288
// /tenant/fleet/actions/476
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_309052Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_309052',
    binder: 'binder3_FULL',
    method: 'POST',
    line: 36288
  });
}

export default handler;