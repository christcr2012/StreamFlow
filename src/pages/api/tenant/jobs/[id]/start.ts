/**
 * Start Work Order API
 * Binder5 Phase 2: Work Order Lifecycle
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/middleware/withRateLimit';
import { withIdempotency } from '@/middleware/withIdempotency';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';
import { z } from 'zod';

const StartJobSchema = z.object({
  started_at: z.string().datetime().optional(),
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
    const validated = StartJobSchema.parse(req.body.payload || req.body);

    // Check if job exists and is in correct status
    const job = await prisma.job.findFirst({
      where: { orgId, id: jobId },
      select: { id: true, status: true },
    });

    if (!job) {
      res.status(404).json({ error: 'NotFound', message: 'Job not found' });
      return;
    }

    if (job.status !== 'scheduled' && job.status !== 'planned') {
      res.status(400).json({
        error: 'InvalidStatus',
        message: `Cannot start job in ${job.status} status`,
      });
      return;
    }

    // Update job to in_progress
    const startedAt = validated.started_at ? new Date(validated.started_at) : new Date();

    await prisma.job.updateMany({
      where: { orgId, id: jobId },
      data: {
        status: 'in_progress',
        updatedAt: new Date(),
      },
    });

    // Note: WorkOrderTimeEntry uses workOrderId, not jobId
    // This would need a WorkOrder model relationship
    // For now, we'll skip time entry creation

    // Audit log
    await auditService.logBinderEvent({
      action: 'job.start',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    res.status(200).json({
      status: 'ok',
      result: {
        id: jobId,
        version: 1,
        startedAt,
      },
      audit_id: `AUD-JOB-START-${jobId}`,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'ValidationError', details: error.errors });
      return;
    }

    console.error('Start job error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withRateLimit(
  RATE_LIMIT_CONFIGS.DEFAULT,
  withIdempotency(
    withAudience('tenant', handler)
  )
);

