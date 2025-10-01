// src/pages/api/provider/profitability/recompute.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { providerProfitabilityService, ServiceError } from '@/server/services/providerProfitabilityService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth } from '@/middleware/providerAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'POST') {
    try {
      const results = await providerProfitabilityService.recomputeAll();

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      res.status(200).json({
        success: true,
        total: results.length,
        successful,
        failed,
        results,
      });
      return;
    } catch (error) {
      console.error('Provider profitability recompute API error:', error);

      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
          details: error.details,
        });
        return;
      }

      res.status(500).json({ error: 'Internal', message: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'POST only' });
  }
}

export default withRateLimit(rateLimitPresets.api, withProviderAuth(handler));

