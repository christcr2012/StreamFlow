import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 3: Migration — Start Dry Run (line 1289)
const StartDryRunSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    job_id: z.string(),
    sample_size: z.number().positive().default(100),
    validation_rules: z.array(z.string()).default([]),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = StartDryRunSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers and owners can start migration dry runs',
      });
    }

    // Find the migration job
    const migrationJob = await prisma.note.findFirst({
      where: { 
        id: payload.job_id, 
        orgId,
        entityType: 'migration_job' 
      },
    });

    if (!migrationJob) {
      return res.status(404).json({
        error: 'MIGRATION_JOB_NOT_FOUND',
        message: 'Migration job not found',
      });
    }

    const dryRunId = `DRY-${Date.now()}`;

    // Create dry run record
    const dryRun = await prisma.note.create({
      data: {
        orgId,
        entityType: 'migration_dry_run',
        entityId: dryRunId,
        userId: actor.user_id,
        body: `MIGRATION DRY RUN: Job ${payload.job_id} - Sample size: ${payload.sample_size}`,
        isPinned: true,
      },
    });

    // Simulate dry run processing
    const simulatedResults = {
      records_processed: payload.sample_size,
      records_valid: Math.floor(payload.sample_size * 0.85),
      records_invalid: Math.floor(payload.sample_size * 0.15),
      validation_errors: [
        { field: 'email', count: 5, message: 'Invalid email format' },
        { field: 'phone', count: 8, message: 'Invalid phone number format' },
        { field: 'address', count: 2, message: 'Missing required address fields' },
      ],
      estimated_import_time_minutes: Math.ceil(payload.sample_size / 10),
    };

    await auditService.logBinderEvent({
      action: 'tenant.migration.start_dry_run',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'start_migration_dry_run',
        resource: `migration_dry_run:${dryRun.id}`,
        meta: { 
          job_id: payload.job_id,
          sample_size: payload.sample_size,
          validation_rules: payload.validation_rules,
          results: simulatedResults 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `MIG-${dryRun.id.substring(0, 6)}`,
        version: 1,
      },
      dry_run: {
        id: dryRun.id,
        dry_run_id: dryRunId,
        job_id: payload.job_id,
        sample_size: payload.sample_size,
        validation_rules: payload.validation_rules,
        status: 'completed',
        results: simulatedResults,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      audit_id: `AUD-MIG-${dryRun.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error starting migration dry run:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start migration dry run',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
