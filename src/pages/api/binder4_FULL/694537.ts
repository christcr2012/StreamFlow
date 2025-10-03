import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_694537Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder4_FULL line 2133
// /tenant/schedule/visits/pause
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_694537Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_694537',
    binder: 'binder4_FULL',
    method: 'POST',
    line: 2133
  });
}

export default handler;