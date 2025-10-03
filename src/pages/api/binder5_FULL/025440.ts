import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_025440Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 184617
// 8113
// Method: POST
// Path: /api/v1/example/8113

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_025440Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_025440',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 184617
  });
}

export default handler;