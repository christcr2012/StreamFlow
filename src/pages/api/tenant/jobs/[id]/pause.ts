/**
 * Pause Work Order API
 * Binder5 Phase 2: Work Order Lifecycle
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/middleware/withRateLimit';
import { withIdempotency } from '@/middleware/withIdempotency';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { z } from 'zod';

const PauseJobSchema = z.object({
  paused_at: z.string().datetime().optional(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'POST only' });
    return;
  }

  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;
  const { id: jobId } = req.query;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (typeof jobId !== 'string') {
    res.status(400).json({ error: 'BadRequest', message: 'Invalid job ID' });
    return;
  }

  try {
    const validated = PauseJobSchema.parse(req.body.payload || req.body);

    // Check if job exists and is in progress
    const job = await prisma.job.findFirst({
      where: { orgId, id: jobId },
      select: { id: true, status: true },
    });

    if (!job) {
      res.status(404).json({ error: 'NotFound', message: 'Job not found' });
      return;
    }

    if (job.status !== 'in_progress') {
      res.status(400).json({
        error: 'InvalidStatus',
        message: `Cannot pause job in ${job.status} status`,
      });
      return;
    }

    // Update job to paused
    const pausedAt = validated.paused_at ? new Date(validated.paused_at) : new Date();

    await prisma.job.updateMany({
      where: { orgId, id: jobId },
      data: {
        status: 'paused',
        updatedAt: new Date(),
      },
    });

    // Note: WorkOrderTimeEntry uses workOrderId, not jobId
    // This would need a WorkOrder model relationship
    // For now, we'll skip time entry updates

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'update',
      entityType: 'job_pause',
      entityId: jobId,
      delta: {
        status: 'paused',
        pausedAt,
        reason: validated.reason,
        notes: validated.notes,
      },
    });

    res.status(200).json({
      status: 'ok',
      result: {
        id: jobId,
        version: 1,
        pausedAt,
        reason: validated.reason,
      },
      audit_id: `AUD-JOB-PAUSE-${jobId}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'ValidationError', details: error.errors });
      return;
    }

    console.error('Pause job error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withRateLimit(
  RATE_LIMIT_CONFIGS.DEFAULT,
  withIdempotency(
    withAudience(AUDIENCE.CLIENT_ONLY, handler)
  )
);

