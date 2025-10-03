import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_135589Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 66870
// 2506
// Method: POST
// Path: /api/v1/example/2506

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_135589Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_135589',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 66870
  });
}

export default handler;