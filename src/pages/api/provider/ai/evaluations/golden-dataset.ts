// src/pages/api/provider/ai/evaluations/golden-dataset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { aiEvaluationService, ServiceError } from '@/server/services/aiEvaluationService';
import { withRateLimit, rateLimitPresets } from '@/middleware/rateLimit';
import { withProviderAuth, getProviderEmailFromReq } from '@/middleware/providerAuth';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providerEmail = getProviderEmailFromReq(req) || 'provider@streamflow.com';

  if (req.method === 'GET') {
    try {
      const { agentType, actionType } = req.query;

      if (!agentType) {
        res.status(422).json({ error: 'ValidationError', message: 'agentType required' });
        return;
      }

      const datasets = await aiEvaluationService.getGoldenDatasets(
        agentType as string,
        actionType as string | undefined
      );

      res.status(200).json({ datasets });
      return;
    } catch (error) {
      console.error('Golden dataset list API error:', error);

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
      const dataset = await aiEvaluationService.createGoldenDataset(providerEmail, req.body);
      res.status(201).json(dataset);
      return;
    } catch (error) {
      console.error('Golden dataset create API error:', error);

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

