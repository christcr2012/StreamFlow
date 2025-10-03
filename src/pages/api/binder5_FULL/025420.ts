import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_025420Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 169014
// 7370
// Method: POST
// Path: /api/v1/example/7370

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_025420Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_025420',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 169014
  });
}

export default handler;