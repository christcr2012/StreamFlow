// src/pages/api/tenant/adoption/discount.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adoptionDiscountService, ServiceError } from '@/server/services/adoptionDiscountService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';

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
    select: { id: true, orgId: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    return;
  }

  const { orgId } = user;

  try {
    const details = await adoptionDiscountService.getDiscountDetails(orgId);
    res.status(200).json(details);
    return;
  } catch (error) {
    console.error('Adoption discount API error:', error);

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

export default withAudience(AUDIENCE.CLIENT_ONLY, withRateLimit(rateLimitPresets.api, handler));

