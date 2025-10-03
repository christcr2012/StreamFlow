import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_135745Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 180312
// 7908
// Method: POST
// Path: /api/v1/example/7908

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_135745Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_135745',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 180312
  });
}

export default handler;