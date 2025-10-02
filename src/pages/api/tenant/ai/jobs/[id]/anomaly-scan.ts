// src/pages/api/tenant/ai/jobs/[id]/anomaly-scan.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { aiJobService, ServiceError } from '@/server/services/aiJobService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { withAudienceAndCostGuard, AUDIENCE, COST_GUARD } from '@/middleware/withCostGuard';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'POST only' });
    return;
  }

  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({ error: 'Unauthorized', message: 'Login required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, orgId: true, role: true },
  });

  if (!user || !user.orgId) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    return;
  }

  const { orgId, id: userId, role } = user;
  const { id: ticketId } = req.query;

  if (typeof ticketId !== 'string') {
    res.status(400).json({ error: 'BadRequest', message: 'Invalid ticket ID' });
    return;
  }

  try {
    const result = await aiJobService.scanForAnomalies(orgId, userId, role, ticketId);
    res.status(200).json(result);
    return;
  } catch (error) {
    console.error('AI anomaly scan API error:', error);

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

export default withAudienceAndCostGuard(
  AUDIENCE.CLIENT_ONLY,
  COST_GUARD.AI_QA_SUMMARY,
  withRateLimit(rateLimitPresets.ai, handler)
);

