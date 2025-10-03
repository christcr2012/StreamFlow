import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_229998Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder3_FULL line 31018
// /tenant/fleet/actions/321
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_229998Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_229998',
    binder: 'binder3_FULL',
    method: 'POST',
    line: 31018
  });
}

export default handler;