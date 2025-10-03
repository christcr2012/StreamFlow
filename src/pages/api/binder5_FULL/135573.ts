import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_135573Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 54711
// 1927
// Method: POST
// Path: /api/v1/example/1927

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_135573Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_135573',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 54711
  });
}

export default handler;