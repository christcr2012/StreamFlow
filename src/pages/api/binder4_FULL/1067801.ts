import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_1067801Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder4_FULL line 3386
// Subcontractors — Invite Subcontractor
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_1067801Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_1067801',
    binder: 'binder4_FULL',
    method: 'POST',
    line: 3386
  });
}

export default handler;