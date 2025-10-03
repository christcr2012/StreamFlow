import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateRecurrenceSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    job_id: z.string(),
    rule: z.string(), // RRULE format or simple pattern like "weekly", "monthly"
    end_date: z.string().optional(),
    max_occurrences: z.number().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = CreateRecurrenceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract job ID
    const jobId = payload.job_id.replace('SCH-', '');
    if (!jobId) {
      return res.status(400).json({
        error: 'INVALID_JOB_ID',
        message: 'Job ID must be in format SCH-000001',
      });
    }

    // Verify job exists
    const job = await prisma.job.findFirst({
      where: { id: jobId, orgId },
    });

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: 'Job not found',
      });
    }

    // Check if job already has recurrence data
    if (job.schedule && typeof job.schedule === 'object' && (job.schedule as any).recurrence) {
      return res.status(422).json({
        error: 'RECURRENCE_EXISTS',
        message: 'Recurrence already exists for this job',
        existing_job_id: payload.job_id,
      });
    }

    // Update job with recurrence data
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        schedule: {
          ...(job.schedule as object || {}),
          recurrence: {
            rule: payload.rule,
            endDate: payload.end_date,
            maxOccurrences: payload.max_occurrences,
            isActive: true,
            createdBy: userId,
            createdAt: new Date().toISOString(),
          },
        },
      },
    });

    const recurrenceId = `REC-${updatedJob.id.substring(0, 6)}`;
    const recurrenceData = (updatedJob.schedule as any).recurrence;

    // Audit log
    await auditService.logBinderEvent({
      action: 'schedule.recurrence.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(201).json({
      status: 'ok',
      result: {
        id: recurrenceId,
        version: 1,
      },
      recurrence: {
        id: recurrenceId,
        job_id: payload.job_id,
        rule: recurrenceData.rule,
        end_date: recurrenceData.endDate,
        max_occurrences: recurrenceData.maxOccurrences,
        is_active: recurrenceData.isActive,
        created_at: recurrenceData.createdAt,
      },
      audit_id: `AUD-REC-${updatedJob.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating recurrence:', error);
    await auditService.logBinderEvent({
      action: 'schedule.recurrence.create.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create recurrence',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
