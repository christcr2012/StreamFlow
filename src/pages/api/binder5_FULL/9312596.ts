import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_9312596Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 400
// WorkOrder — Customer Signature
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_9312596Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_9312596',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 400
  });
}

export default handler;