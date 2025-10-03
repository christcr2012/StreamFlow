import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_877903Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 123003
// 5179
// Method: POST
// Path: /api/v1/example/5179

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_877903Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_877903',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 123003
  });
}

export default handler;