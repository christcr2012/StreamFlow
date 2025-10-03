import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_309046Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder3_FULL line 31936
// /tenant/fleet/actions/348
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_309046Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_309046',
    binder: 'binder3_FULL',
    method: 'POST',
    line: 31936
  });
}

export default handler;