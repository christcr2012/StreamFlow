// src/pages/api/tenant/trial/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { trialService, ServiceError } from '@/server/services/trialService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'GET only' });
    return;
  }

  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({ error: 'Unauthorized', message: 'Login required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { orgId: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    return;
  }

  const { orgId } = user;

  try {
    const status = await trialService.getStatus(orgId);
    res.status(200).json(status);
    return;
  } catch (error) {
    console.error('Trial status API error:', error);

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
}

export default withRateLimit(rateLimitPresets.api, handler);

