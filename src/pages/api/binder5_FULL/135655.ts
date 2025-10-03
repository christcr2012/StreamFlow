import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_135655Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 115464
// 4820
// Method: POST
// Path: /api/v1/example/4820

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_135655Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_135655',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 115464
  });
}

export default handler;