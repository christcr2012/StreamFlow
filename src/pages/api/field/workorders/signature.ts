import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CustomerSignatureSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    signature_data: z.string(), // Base64 encoded signature
    customer_name: z.string().min(1),
    customer_title: z.string().optional(),
    signature_type: z.enum(['completion', 'approval', 'receipt']).default('completion'),
    notes: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }).optional(),
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

    const validation = CustomerSignatureSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;
    const workOrderId = payload.work_order_id.replace('WO-', '');

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, orgId },
      include: { assignments: true },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

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
    // 1. Decode the base64 signature
    // 2. Upload to cloud storage
    // 3. Generate a URL
    const signatureId = `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const signatureUrl = `https://storage.streamflow.com/signatures/${orgId}/${signatureId}.png`;

    // Store signature as Asset
    const signature = await prisma.asset.create({
      data: {
        orgId,
        name: `${payload.signature_type}_signature_${workOrderId}`,
        category: 'signature',
        assetNumber: signatureId,
        qrCode: `QR-${signatureId}`,
        customFields: {
          work_order_id: workOrderId,
          signature_type: payload.signature_type,
          customer_name: payload.customer_name,
          customer_title: payload.customer_title,
          notes: payload.notes,
          location: payload.location,
          captured_by: userId,
          captured_at: new Date().toISOString(),
          url: signatureUrl,
          file_size: payload.signature_data.length,
          mime_type: 'image/png',
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'workorder.signature.capture',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'capture_signature',
        resource: `workorder:${workOrderId}`,
        meta: {
          signature_type: payload.signature_type,
          customer_name: payload.customer_name,
          customer_title: payload.customer_title,
          notes: payload.notes,
          location: payload.location,
        },
      },
    });

    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: signatureId,
        version: 1,
      },
      signature: {
        id: signatureId,
        work_order_id: workOrderIdFormatted,
        signature_type: payload.signature_type,
        customer_name: payload.customer_name,
        customer_title: payload.customer_title,
        url: signatureUrl,
        notes: payload.notes,
        captured_by: userId,
        captured_at: signature.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-SIG-${signatureId}`,
    });
  } catch (error) {
    console.error('Error capturing signature:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to capture signature',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
