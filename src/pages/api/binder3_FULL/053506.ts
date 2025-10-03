import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_053506Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder3_FULL line 62638
// /tenant/verticals/rolloff/actions/2
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_053506Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_053506',
    binder: 'binder3_FULL',
    method: 'POST',
    line: 62638
  });
}

export default handler;