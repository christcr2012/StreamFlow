// src/pages/api/tenant/ai/run.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { aiTaskService, ServiceError } from '@/server/services/aiTaskService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withIdempotency } from '@/middleware/idempotency';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
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

  try {
    const result = await aiTaskService.execute(orgId, userId, role, req.body);
    
    const statusCode = result.status === 'preview' ? 200 : result.status === 'success' ? 200 : 500;
    res.status(statusCode).json(result);
    return;
  } catch (error) {
    console.error('AI run API error:', error);

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
        message: 'Invalid AI task data',
        details: error.flatten().fieldErrors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal', message: 'Server error' });
  }
}

export default withAudienceAndCostGuard(
  AUDIENCE.CLIENT_ONLY,
  COST_GUARD.AI_ESTIMATE_DRAFT,
  withRateLimit(
    rateLimitPresets.ai,
    withIdempotency({}, handler)
  )
);

