import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_312828Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 163428
// 7104
// Method: POST
// Path: /api/v1/example/7104

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_312828Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_312828',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 163428
  });
}

export default handler;