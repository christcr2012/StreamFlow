import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 2: Migration — Upload File (line 1249)
const UploadFileSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    migration_job_id: z.string(),
    file_name: z.string(),
    file_size_bytes: z.number(),
    file_type: z.enum(['csv', 'xlsx', 'json', 'xml']),
    file_url: z.string().url(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = UploadFileSchema.safeParse(req.body);
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
        message: 'Only owners and managers can upload migration files',
      });
    }

    // Validate file size (max 100MB)
    if (payload.file_size_bytes > 100 * 1024 * 1024) {
      return res.status(413).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds 100MB limit',
      });
    }

    const uploadRecord = await prisma.note.create({
      data: {
        orgId,
        entityType: 'migration_upload',
        entityId: `${payload.migration_job_id}-${Date.now()}`,
        userId: actor.user_id,
        body: `MIGRATION FILE UPLOADED: ${payload.file_name} (${payload.file_type}, ${(payload.file_size_bytes / 1024 / 1024).toFixed(2)}MB)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.migration.upload_file',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'upload_migration_file',
        resource: `migration:${payload.migration_job_id}`,
        meta: { 
          migration_job_id: payload.migration_job_id,
          file_name: payload.file_name,
          file_size_bytes: payload.file_size_bytes,
          file_type: payload.file_type,
          file_url: payload.file_url 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: uploadRecord.entityId,
        version: 1,
      },
      upload: {
        file_name: payload.file_name,
        file_type: payload.file_type,
        file_size_bytes: payload.file_size_bytes,
        file_size_mb: Math.round((payload.file_size_bytes / 1024 / 1024) * 100) / 100,
        uploaded_at: new Date().toISOString(),
        status: 'uploaded',
      },
      audit_id: `AUD-${uploadRecord.entityId}`,
    });
  } catch (error) {
    console.error('Error uploading migration file:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to upload migration file',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
