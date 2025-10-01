// src/pages/api/provider/queue/stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { queue } from '@/lib/queue';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth } from '@/middleware/providerAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'GET only' });
    return;
  }

  try {
    const stats = queue.getStats();
    res.status(200).json(stats);
    return;
  } catch (error) {
    console.error('Queue stats API error:', error);
    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withRateLimit(rateLimitPresets.api, withProviderAuth(handler));

