// src/pages/api/provider/monitoring/metrics.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { monitoring } from '@/lib/monitoring';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth } from '@/middleware/providerAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'GET only' });
    return;
  }

  try {
    const summary = monitoring.getMetricsSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('Metrics API error:', error);
    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withRateLimit(rateLimitPresets.api, withProviderAuth(handler));

