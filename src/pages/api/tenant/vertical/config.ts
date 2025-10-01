// src/pages/api/tenant/vertical/config.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verticalService, ServiceError } from '@/server/services/verticalService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({ error: 'Unauthorized', message: 'Login required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, orgId: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    return;
  }

  const { orgId, id: userId } = user;

  try {
    // GET - Get vertical config
    if (req.method === 'GET') {
      const config = await verticalService.getConfig(orgId);
      res.status(200).json(config);
      return;
    }

    // POST - Set vertical
    if (req.method === 'POST') {
      const { vertical } = req.body;
      if (!vertical) {
        res.status(422).json({ error: 'ValidationError', message: 'vertical required' });
        return;
      }

      const config = await verticalService.setVertical(orgId, userId, vertical);
      res.status(200).json(config);
      return;
    }

    res.status(405).json({ error: 'MethodNotAllowed', message: 'Method not allowed' });
    return;
  } catch (error) {
    console.error('Vertical config API error:', error);

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
        message: 'Invalid vertical config',
        details: error.flatten().fieldErrors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withRateLimit(rateLimitPresets.api, handler);

