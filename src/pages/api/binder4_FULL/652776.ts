import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_652776Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder4_FULL line 247
// /tenant/crm/leads/notes
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_652776Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_652776',
    binder: 'binder4_FULL',
    method: 'POST',
    line: 247
  });
}

export default handler;