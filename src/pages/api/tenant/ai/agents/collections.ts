// src/pages/api/tenant/ai/agents/collections.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { advancedAiAgentService, ServiceError } from '@/server/services/advancedAiAgentService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { withAudienceAndCostGuard, AUDIENCE, COST_GUARD } from '@/middleware/withCostGuard';
import { z } from 'zod';

const CollectionsSchema = z.object({
  invoiceId: z.string(),
  daysOverdue: z.number().int().min(0),
  amount: z.number().positive(),
  customerName: z.string(),
});

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
    const validated = CollectionsSchema.parse(req.body);
    
    const result = await advancedAiAgentService.collectionsAgent(
      orgId,
      userId,
      role,
      validated
    );
    
    res.status(200).json(result);
    return;
  } catch (error) {
    console.error('Collections agent API error:', error);

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
}

export default withAudienceAndCostGuard(
  AUDIENCE.CLIENT_ONLY,
  COST_GUARD.AI_EMAIL_DRAFT,
  withRateLimit(rateLimitPresets.ai, handler)
);

