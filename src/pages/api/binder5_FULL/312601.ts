import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_312601Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 1254
// /tenant/migrations/upload
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_312601Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_312601',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 1254
  });
}

export default handler;