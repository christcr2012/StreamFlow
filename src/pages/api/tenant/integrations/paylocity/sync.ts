/**
 * Paylocity Sync API
 * Binder3: POST /api/tenant/integrations/paylocity/sync
 * 
 * Syncs employees and timesheets from Paylocity
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { paylocityService } from '@/server/services/integrations/paylocityService';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const SyncPaylocitySchema = z.object({
  syncType: z.enum(['employees', 'timesheets', 'all']),
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
    const data = SyncPaylocitySchema.parse(req.body);

    const results: any = {};

    // Sync employees
    if (data.syncType === 'employees' || data.syncType === 'all') {
      const employeeResult = await paylocityService.syncEmployees(orgId, userId);
      results.employees = employeeResult;
    }

    // Sync timesheets
    if (data.syncType === 'timesheets' || data.syncType === 'all') {
      if (!data.startDate || !data.endDate) {
        res.status(400).json({
          error: 'BadRequest',
          message: 'startDate and endDate required for timesheet sync',
        });
        return;
      }

      const timesheetResult = await paylocityService.syncTimesheets(
        orgId,
        userId,
        new Date(data.startDate),
        new Date(data.endDate)
      );
      results.timesheets = timesheetResult;
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

    console.error('Paylocity sync error:', error);
    res.status(500).json({
      error: 'Internal',
      message: error.message || 'Sync failed',
    });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

