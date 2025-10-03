import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 5: Migration — Start Import (line 1367)
const StartImportSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    job_id: z.string(),
    batch_size: z.number().positive().default(100),
    idempotency_key: z.string().uuid(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = StartImportSchema.safeParse(req.body);
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
        message: 'Only managers and owners can start migration imports',
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

    const importId = `IMP-${Date.now()}`;

    // Create import record
    const importRecord = await prisma.note.create({
      data: {
        orgId,
        entityType: 'migration_import',
        entityId: importId,
        userId: actor.user_id,
        body: `MIGRATION IMPORT: Job ${payload.job_id} - Batch size: ${payload.batch_size}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.migration.start_import',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'start_migration_import',
        resource: `migration_import:${importRecord.id}`,
        meta: { 
          job_id: payload.job_id,
          batch_size: payload.batch_size,
          import_idempotency_key: payload.idempotency_key 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `MIG-${importRecord.id.substring(0, 6)}`,
        version: 1,
      },
      import: {
        id: importRecord.id,
        import_id: importId,
        job_id: payload.job_id,
        batch_size: payload.batch_size,
        status: 'started',
        progress: {
          total_records: 0,
          processed_records: 0,
          successful_records: 0,
          failed_records: 0,
          percentage: 0,
        },
        started_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      },
      audit_id: `AUD-MIG-${importRecord.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error starting migration import:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start migration import',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
