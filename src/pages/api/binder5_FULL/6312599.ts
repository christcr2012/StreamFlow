import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_6312599Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 859
// DVIR — Log Fuel
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_6312599Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_6312599',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 859
  });
}

export default handler;