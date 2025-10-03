import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 1: Migration — Create Migration Job (line 1209)
const CreateMigrationSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    source_system: z.string(),
    migration_type: z.enum(['full', 'incremental', 'selective']),
    entities: z.array(z.string()),
    schedule_date: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateMigrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['OWNER', 'MANAGER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only owners and managers can create migration jobs',
      });
    }

    const migrationJob = await prisma.note.create({
      data: {
        orgId,
        entityType: 'migration_job',
        entityId: `MIG-${Date.now()}`,
        userId: actor.user_id,
        body: `MIGRATION JOB: Source: ${payload.source_system}, Type: ${payload.migration_type}, Entities: ${payload.entities.join(', ')}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.migration.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_migration_job',
        resource: `migration:${migrationJob.entityId}`,
        meta: { 
          source_system: payload.source_system,
          migration_type: payload.migration_type,
          entities: payload.entities,
          schedule_date: payload.schedule_date 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: migrationJob.entityId,
        version: 1,
      },
      audit_id: `AUD-${migrationJob.entityId}`,
    });
  } catch (error) {
    console.error('Error creating migration job:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create migration job',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
