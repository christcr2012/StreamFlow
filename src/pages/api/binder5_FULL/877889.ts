import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_877889Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 114414
// 4770
// Method: POST
// Path: /api/v1/example/4770

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_877889Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_877889',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 114414
  });
}

export default handler;