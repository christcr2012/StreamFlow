import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_10652786Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder4_FULL line 2244
// Scheduling — Create Recurrence
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_10652786Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_10652786',
    binder: 'binder4_FULL',
    method: 'POST',
    line: 2244
  });
}

export default handler;