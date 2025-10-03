import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_053508Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder3_FULL line 64200
// /tenant/verticals/painting/actions/4
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_053508Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_053508',
    binder: 'binder3_FULL',
    method: 'POST',
    line: 64200
  });
}

export default handler;