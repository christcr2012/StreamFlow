// src/pages/api/provider/ai/evaluations/ab-test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { aiEvaluationService, ServiceError } from '@/server/services/aiEvaluationService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth, getProviderEmailFromReq } from '@/middleware/providerAuth';
import { z } from 'zod';

const AssignABTestSchema = z.object({
  orgId: z.string(),
  agentType: z.string(),
  modelVersion: z.string(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providerEmail = getProviderEmailFromReq(req) || 'provider@streamflow.com';

  if (req.method === 'GET') {
    try {
      const { agentType } = req.query;

      if (!agentType) {
        res.status(422).json({ error: 'ValidationError', message: 'agentType required' });
        return;
      }

      const results = await aiEvaluationService.getABTestResults(agentType as string);
      res.status(200).json({ results });
      return;
    } catch (error) {
      console.error('A/B test results API error:', error);

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
      const validated = AssignABTestSchema.parse(req.body);

      const result = await aiEvaluationService.assignToABTest(
        providerEmail,
        validated.orgId,
        validated.agentType,
        validated.modelVersion
      );

      res.status(200).json(result);
      return;
    } catch (error) {
      console.error('A/B test assign API error:', error);

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

