import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_135601Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 75249
// 2905
// Method: POST
// Path: /api/v1/example/2905

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_135601Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_135601',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 75249
  });
}

export default handler;