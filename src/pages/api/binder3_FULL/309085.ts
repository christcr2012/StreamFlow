import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_309085Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder3_FULL line 62562
// /tenant/verticals/mechanic/actions/10
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_309085Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_309085',
    binder: 'binder3_FULL',
    method: 'POST',
    line: 62562
  });
}

export default handler;