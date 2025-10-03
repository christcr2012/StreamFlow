import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_312810Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 149631
// 6447
// Method: POST
// Path: /api/v1/example/6447

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_312810Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_312810',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 149631
  });
}

export default handler;