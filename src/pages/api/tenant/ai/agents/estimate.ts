// src/pages/api/tenant/ai/agents/estimate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { advancedAiAgentService, ServiceError } from '@/server/services/advancedAiAgentService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { getEmailFromReq } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { withAudienceAndCostGuard, AUDIENCE, COST_GUARD } from '@/middleware/withCostGuard';
import { z } from 'zod';

const EstimateSchema = z.object({
  action: z.enum(['draft_estimate', 'polish_proposal']),
  opportunityId: z.string().optional(),
  serviceType: z.string().optional(),
  scope: z.string().optional(),
  materials: z.array(z.any()).optional(),
  labor: z.array(z.any()).optional(),
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
    const validated = EstimateSchema.parse(req.body);
    
    const result = await advancedAiAgentService.estimateAgent(
      orgId,
      userId,
      role,
      validated.action,
      {
        opportunityId: validated.opportunityId,
        serviceType: validated.serviceType,
        scope: validated.scope,
        materials: validated.materials,
        labor: validated.labor,
      }
    );
    
    res.status(200).json(result);
    return;
  } catch (error) {
    console.error('Estimate agent API error:', error);

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
  COST_GUARD.AI_ESTIMATE_DRAFT,
  withRateLimit(rateLimitPresets.ai, handler)
);

