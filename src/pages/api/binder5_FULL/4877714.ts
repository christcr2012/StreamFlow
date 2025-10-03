import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_4877714Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 777
// DVIR — Submit DVIR
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_4877714Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_4877714',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 777
  });
}

export default handler;