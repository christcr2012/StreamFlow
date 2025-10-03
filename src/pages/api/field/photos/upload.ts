import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UploadPhotoSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    photo_data: z.string(), // Base64 encoded image
    photo_type: z.enum(['before', 'during', 'after', 'issue', 'signature']),
    description: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }).optional(),
    timestamp: z.string().datetime().optional(),
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

    // Validate BINDER5_FULL contract
    const validation = UploadPhotoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract work order ID
    const workOrderId = payload.work_order_id.replace('WO-', '');
    if (!workOrderId) {
      return res.status(400).json({
        error: 'INVALID_WORK_ORDER_ID',
        message: 'Work order ID must be in format WO-000001',
      });
    }

    // Verify work order exists and user has access
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        orgId,
      },
      include: {
        assignments: true,
      },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    // Verify user is assigned to this work order
    const isAssigned = workOrder.assignments.some(
      assignment => assignment.employeeId === userId && !assignment.unassignedAt
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: 'NOT_ASSIGNED',
        message: 'User is not assigned to this work order',
      });
    }

    // In a real implementation, you would:
    // 1. Decode the base64 image
    // 2. Upload to cloud storage (S3, etc.)
    // 3. Generate a URL
    // For now, we'll simulate this process

    const photoId = `PHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const photoUrl = `https://storage.streamflow.com/photos/${orgId}/${photoId}.jpg`;

    // Store photo metadata in database (using Asset model)
    const photo = await prisma.asset.create({
      data: {
        orgId,
        name: `${payload.photo_type}_${workOrderId}_${Date.now()}`,
        category: 'photo',
        assetNumber: photoId,
        qrCode: `QR-${photoId}`, // Required field
        customFields: {
          work_order_id: workOrderId,
          photo_type: payload.photo_type,
          description: payload.description,
          location: payload.location,
          timestamp: payload.timestamp || new Date().toISOString(),
          uploaded_by: userId,
          url: photoUrl,
          // In real implementation, store file size, dimensions, etc.
          file_size: payload.photo_data.length,
          mime_type: 'image/jpeg',
        },
      },
    });

    // Create audit log entry
    await auditService.logBinderEvent({
      action: 'photo.upload',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'upload',
        resource: `photo:${photoId}`,
        meta: {
          work_order_id: payload.work_order_id,
          photo_type: payload.photo_type,
          description: payload.description,
          location: payload.location,
        },
      },
    });

    return res.status(201).json({
      status: 'ok',
      result: {
        id: photoId,
        version: 1,
      },
      photo: {
        id: photoId,
        work_order_id: payload.work_order_id,
        photo_type: payload.photo_type,
        description: payload.description,
        url: photoUrl,
        location: payload.location,
        timestamp: payload.timestamp || new Date().toISOString(),
        uploaded_by: userId,
        uploaded_at: photo.createdAt,
      },
      audit_id: `AUD-PHOTO-${photoId}`,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    await auditService.logBinderEvent({
      action: 'photo.upload.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to upload photo',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
