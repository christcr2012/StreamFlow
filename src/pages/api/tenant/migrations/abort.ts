import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 6: Migration — Abort Import (line 1407)
const AbortImportSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    job_id: z.string(),
    reason: z.string(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = AbortImportSchema.safeParse(req.body);
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
        message: 'Only managers and owners can abort migration imports',
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

    // Find active import for this job
    const activeImport = await prisma.note.findFirst({
      where: {
        orgId,
        entityType: 'migration_import',
        body: { contains: payload.job_id },
        isPinned: true, // Active imports are pinned
      },
    });

    if (!activeImport) {
      return res.status(404).json({
        error: 'NO_ACTIVE_IMPORT',
        message: 'No active import found for this job',
      });
    }

    // Update import to aborted status
    const abortedImport = await prisma.note.update({
      where: { id: activeImport.id },
      data: {
        body: `${activeImport.body} - ABORTED: ${payload.reason}`,
        isPinned: false, // Mark as inactive
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.migration.abort_import',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'abort_migration_import',
        resource: `migration_import:${abortedImport.id}`,
        meta: { 
          job_id: payload.job_id,
          reason: payload.reason,
          aborted_by: actor.user_id 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `MIG-${abortedImport.id.substring(0, 6)}`,
        version: 1,
      },
      import_abort: {
        job_id: payload.job_id,
        import_id: activeImport.id,
        reason: payload.reason,
        aborted_by: actor.user_id,
        aborted_at: new Date().toISOString(),
        status: 'aborted',
      },
      audit_id: `AUD-MIG-${abortedImport.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error aborting migration import:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to abort migration import',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
