import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_878020Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 208746
// 9262
// Method: POST
// Path: /api/v1/example/9262

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_878020Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_878020',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 208746
  });
}

export default handler;