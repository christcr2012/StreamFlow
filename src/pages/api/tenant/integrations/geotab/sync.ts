/**
 * Geotab Sync API
 * Binder3: POST /api/tenant/integrations/geotab/sync
 * 
 * Syncs DVIR logs, trips, and fault data from Geotab
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { geotabService } from '@/server/services/integrations/geotabService';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const SyncGeotabSchema = z.object({
  syncType: z.enum(['dvir', 'trips', 'faults', 'all']),
  since: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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
    const data = SyncGeotabSchema.parse(req.body);

    const results: any = {};

    // Sync DVIR logs
    if (data.syncType === 'dvir' || data.syncType === 'all') {
      const dvirResult = await geotabService.syncDVIRLogs(
        orgId,
        userId,
        data.since ? new Date(data.since) : undefined
      );
      results.dvir = dvirResult;
    }

    // Sync trips
    if (data.syncType === 'trips' || data.syncType === 'all') {
      if (!data.startDate || !data.endDate) {
        res.status(400).json({
          error: 'BadRequest',
          message: 'startDate and endDate required for trip sync',
        });
        return;
      }

      const tripResult = await geotabService.syncTrips(
        orgId,
        userId,
        new Date(data.startDate),
        new Date(data.endDate)
      );
      results.trips = tripResult;
    }

    // Sync faults
    if (data.syncType === 'faults' || data.syncType === 'all') {
      const faultResult = await geotabService.syncFaultData(
        orgId,
        userId,
        data.since ? new Date(data.since) : undefined
      );
      results.faults = faultResult;
    }

    res.status(200).json({
      status: 'ok',
      result: results,
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

    console.error('Geotab sync error:', error);
    res.status(500).json({
      error: 'Internal',
      message: error.message || 'Sync failed',
    });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

