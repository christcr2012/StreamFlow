import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const endpoint_5025187Schema = z.object({
  id: z.string().optional(),
  payload: z.any().optional(),
});

// Generated from binder5_FULL line 817
// DVIR — Create Maintenance Ticket
// Method: POST
// Path: /api/generated

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = endpoint_5025187Schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error });
  }

  return res.status(200).json({ 
    status: 'ok', 
    endpoint: 'endpoint_5025187',
    binder: 'binder5_FULL',
    method: 'POST',
    line: 817
  });
}

export default handler;