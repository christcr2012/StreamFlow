import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 3: DVIR — Resolve Defect (line 737)
const ResolveDefectSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    defect_id: z.string(),
    resolution_note: z.string(),
    photo_id: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = ResolveDefectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only employees and managers can resolve DVIR defects',
      });
    }

    // Find the defect to resolve
    const defect = await prisma.note.findFirst({
      where: { 
        id: payload.defect_id, 
        orgId,
        entityType: 'dvir_defect' 
      },
    });

    if (!defect) {
      return res.status(404).json({
        error: 'DEFECT_NOT_FOUND',
        message: 'DVIR defect not found',
      });
    }

    // Update defect with resolution
    const resolvedDefect = await prisma.note.update({
      where: { id: payload.defect_id },
      data: {
        body: `${defect.body} - RESOLVED: ${payload.resolution_note}`,
        isPinned: false, // Mark as resolved
      },
    });

    await auditService.logBinderEvent({
      action: 'field.dvir.resolve_defect',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'resolve_dvir_defect',
        resource: `dvir_defect:${payload.defect_id}`,
        meta: { 
          defect_id: payload.defect_id,
          resolution_note: payload.resolution_note,
          photo_id: payload.photo_id,
          resolved_by: actor.user_id 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `DVI-${resolvedDefect.id.substring(0, 6)}`,
        version: 1,
      },
      defect_resolution: {
        defect_id: payload.defect_id,
        resolution_note: payload.resolution_note,
        photo_id: payload.photo_id,
        resolved_by: actor.user_id,
        resolved_at: new Date().toISOString(),
        status: 'resolved',
      },
      audit_id: `AUD-DVI-${resolvedDefect.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error resolving DVIR defect:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to resolve DVIR defect',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
