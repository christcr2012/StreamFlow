import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ScanAssetSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    qr_code: z.string(),
    scan_type: z.enum(['checkin', 'checkout', 'inspect', 'locate']).default('locate'),
    work_order_id: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }),
    notes: z.string().optional(),
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

    const validation = ScanAssetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Find asset by QR code
    const asset = await prisma.asset.findFirst({
      where: {
        qrCode: payload.qr_code,
        orgId,
      },
    });

    if (!asset) {
      return res.status(404).json({
        error: 'ASSET_NOT_FOUND',
        message: 'Asset not found for QR code',
      });
    }

    // Create scan record
    const scan = await prisma.note.create({
      data: {
        orgId,
        entityType: 'asset',
        entityId: asset.id,
        userId,
        body: `ASSET SCAN [${payload.scan_type.toUpperCase()}]: ${asset.name} scanned at location (${payload.location.lat}, ${payload.location.lng})${payload.work_order_id ? ` for work order ${payload.work_order_id}` : ''}${payload.notes ? `. Notes: ${payload.notes}` : ''}`,
        isPinned: payload.scan_type === 'checkout' || payload.scan_type === 'checkin',
      },
    });

    // Update asset location and status based on scan type
    const currentCustomFields = (asset.customFields as any) || {};
    let newStatus = currentCustomFields.status || 'available';
    
    switch (payload.scan_type) {
      case 'checkout':
        newStatus = 'checked_out';
        break;
      case 'checkin':
        newStatus = 'available';
        break;
      case 'inspect':
        newStatus = 'inspected';
        break;
      case 'locate':
        // Status remains the same for location scans
        break;
    }

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        customFields: {
          ...currentCustomFields,
          status: newStatus,
          last_scan_at: new Date().toISOString(),
          last_scan_by: userId,
          last_scan_type: payload.scan_type,
          last_location: {
            lat: payload.location.lat,
            lng: payload.location.lng,
            accuracy: payload.location.accuracy,
            scanned_at: new Date().toISOString(),
          },
          work_order_id: payload.work_order_id || currentCustomFields.work_order_id,
          scan_count: (currentCustomFields.scan_count || 0) + 1,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'assets.scan',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'scan_asset',
        resource: `asset:${asset.id}`,
        meta: {
          qr_code: payload.qr_code,
          scan_type: payload.scan_type,
          work_order_id: payload.work_order_id,
          location: payload.location,
          notes: payload.notes,
        },
      },
    });

    const scanId = `SCAN-${scan.id.substring(0, 6)}`;
    const assetIdFormatted = `AST-${asset.id.substring(0, 6)}`;

    return res.status(200).json({
      status: 'ok',
      result: {
        id: scanId,
        version: 1,
      },
      asset_scan: {
        id: scanId,
        asset_id: assetIdFormatted,
        asset_name: asset.name,
        asset_category: asset.category,
        qr_code: payload.qr_code,
        scan_type: payload.scan_type,
        asset_status: newStatus,
        work_order_id: payload.work_order_id,
        location: payload.location,
        scanned_by: userId,
        scanned_at: scan.createdAt,
        notes: payload.notes,
      },
      audit_id: `AUD-SCAN-${scan.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error scanning asset:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to scan asset',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
