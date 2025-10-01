// src/pages/api/provider/profitability/dashboard.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { providerProfitabilityService, ServiceError } from '@/server/services/providerProfitabilityService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth } from '@/middleware/providerAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'GET') {
    try {
      const { orgId } = req.query;

      const dashboard = await providerProfitabilityService.getDashboard(
        orgId as string | undefined
      );

      res.status(200).json(dashboard);
      return;
    } catch (error) {
      console.error('Provider profitability dashboard API error:', error);

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
    res.status(405).json({ error: 'MethodNotAllowed', message: 'GET only' });
  }
}

export default withRateLimit(rateLimitPresets.api, withProviderAuth(handler));

