import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 5: WorkOrder — Add Photo (line 239)
const AddPhotoSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    file_id: z.string(),
    caption: z.string(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = AddPhotoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: payload.work_order_id, orgId },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    const photo = await prisma.asset.create({
      data: {
        orgId,
        assetNumber: `PHOTO-${Date.now()}`,
        name: payload.caption || 'Work Order Photo',
        category: 'photo',
        qrCode: `QR-PHOTO-${Date.now()}`,
        customFields: {
          work_order_id: payload.work_order_id,
          file_id: payload.file_id,
          caption: payload.caption,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'field.workorder.add_photo',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'add_photo',
        resource: `work_order:${payload.work_order_id}`,
        meta: { work_order_id: payload.work_order_id, file_id: payload.file_id, caption: payload.caption },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `PHO-${photo.id.substring(0, 6)}`,
        version: 1,
      },
      audit_id: `AUD-PHO-${photo.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error adding photo:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to add photo',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
