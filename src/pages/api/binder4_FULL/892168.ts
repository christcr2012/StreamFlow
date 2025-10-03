import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_892168Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder4_FULL line 1242
// /tenant/crm/opps/line_items
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_892168Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_892168',
    binder: 'binder4_FULL',
    method: 'POST',
    line: 1242
  });
}

export default handler;