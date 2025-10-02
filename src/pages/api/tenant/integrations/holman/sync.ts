/**
 * Holman Sync API
 * Binder3: POST /api/tenant/integrations/holman/sync
 * 
 * Syncs fuel transactions from Holman
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { withIdempotency } from '@/middleware/withIdempotency';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/middleware/withRateLimit';
import { holmanService } from '@/server/services/integrations/holmanService';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const SyncHolmanSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// ============================================================================
// HANDLER
// ============================================================================

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'Method not allowed' });
    return;
  }

  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';

  try {
    const data = SyncHolmanSchema.parse(req.body);

    const result = await holmanService.syncFuelTransactions(
      orgId,
      userId,
      new Date(data.startDate),
      new Date(data.endDate)
    );

    res.status(200).json({
      status: 'ok',
      result,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request body',
        details: error.errors,
      });
      return;
    }

    console.error('Holman sync error:', error);
    res.status(500).json({
      error: 'Internal',
      message: error.message || 'Sync failed',
    });
    return;
  }
}

export default withRateLimit(
  RATE_LIMIT_CONFIGS.DEFAULT,
  withIdempotency(
    withAudience(AUDIENCE.CLIENT_ONLY, handler)
  )
);

