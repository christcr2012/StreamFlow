// src/pages/api/provider/notices/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { systemNoticeService, ServiceError } from '@/server/services/systemNoticeService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth, getProviderEmailFromReq } from '@/middleware/providerAuth';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providerEmail = getProviderEmailFromReq(req) || 'provider@streamflow.com';

  if (req.method === 'GET') {
    try {
      const { active, type, limit } = req.query;

      const notices = await systemNoticeService.listNotices({
        active: active === 'true' ? true : active === 'false' ? false : undefined,
        type: type as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({ notices });
      return;
    } catch (error) {
      console.error('Provider notices list API error:', error);

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
  } else if (req.method === 'POST') {
    try {
      const notice = await systemNoticeService.createNotice(providerEmail, req.body);
      res.status(201).json(notice);
      return;
    } catch (error) {
      console.error('Provider notices create API error:', error);

      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
          details: error.details,
        });
        return;
      }

      if (error instanceof z.ZodError) {
        res.status(422).json({
          error: 'ValidationError',
          message: 'Invalid data',
          details: error.flatten().fieldErrors,
        });
        return;
      }

      res.status(500).json({ error: 'Internal', message: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'GET, POST only' });
  }
}

export default withRateLimit(rateLimitPresets.api, withProviderAuth(handler));

