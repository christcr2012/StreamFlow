// src/pages/api/provider/domains/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { tenantDomainService, ServiceError } from '@/server/services/tenantDomainService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth } from '@/middleware/providerAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'GET') {
    try {
      const { status, verified, limit } = req.query;

      const domains = await tenantDomainService.listDomains({
        status: status as string,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({ domains });
      return;
    } catch (error) {
      console.error('Provider domains list API error:', error);

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

