import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_5135483Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 239
// WorkOrder — Add Photo
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_5135483Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_5135483',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 239
  });
}

export default handler;