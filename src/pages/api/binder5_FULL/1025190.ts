import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_1025190Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 1552
// Federation — Create Provider Account
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_1025190Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_1025190',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 1552
  });
}

export default handler;