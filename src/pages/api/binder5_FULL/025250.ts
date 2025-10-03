import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_025250Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 38016
// 1132
// Method: POST
// Path: /api/v1/example/1132

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_025250Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_025250',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 38016
  });
}

export default handler;