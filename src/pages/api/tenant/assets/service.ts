import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ServiceAssetSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    asset_id: z.string(),
    service_type: z.enum(['maintenance', 'repair', 'calibration', 'inspection', 'replacement']),
    service_description: z.string().min(1),
    service_provider: z.string().optional(),
    service_cost_cents: z.number().int().positive().optional(),
    service_date: z.string().datetime().optional(),
    expected_completion: z.string().datetime().optional(),
    parts_used: z.array(z.object({
      part_name: z.string(),
      quantity: z.number().int().positive(),
      cost_cents: z.number().int().positive().optional(),
    })).optional(),
    photos: z.array(z.string()).optional(),
    warranty_info: z.string().optional(),
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

    const validation = ServiceAssetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    const asset = await prisma.asset.findFirst({
      where: {
        id: payload.asset_id.replace('AST-', ''),
        orgId,
      },
    });

    if (!asset) {
      return res.status(404).json({
        error: 'ASSET_NOT_FOUND',
        message: 'Asset not found',
      });
    }

    // Create service record
    const serviceRecord = await prisma.note.create({
      data: {
        orgId,
        entityType: 'asset',
        entityId: asset.id,
        userId,
        body: `ASSET SERVICE: ${payload.service_type.toUpperCase()} - ${payload.service_description}${payload.service_provider ? `. Provider: ${payload.service_provider}` : ''}${payload.service_cost_cents ? `. Cost: $${(payload.service_cost_cents / 100).toFixed(2)}` : ''}${payload.parts_used?.length ? `. Parts used: ${payload.parts_used.length}` : ''}${payload.warranty_info ? `. Warranty: ${payload.warranty_info}` : ''}`,
        isPinned: payload.service_type === 'repair' || payload.service_type === 'replacement',
      },
    });

    // Update asset with service info
    const currentCustomFields = (asset.customFields as any) || {};
    const serviceHistory = currentCustomFields.service_history || [];
    
    const newServiceEntry = {
      service_id: serviceRecord.id,
      service_type: payload.service_type,
      service_description: payload.service_description,
      service_provider: payload.service_provider,
      service_cost_cents: payload.service_cost_cents,
      service_date: payload.service_date || new Date().toISOString(),
      expected_completion: payload.expected_completion,
      parts_used: payload.parts_used,
      photos_count: payload.photos?.length || 0,
      warranty_info: payload.warranty_info,
      serviced_by: userId,
      serviced_at: new Date().toISOString(),
    };

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        customFields: {
          ...currentCustomFields,
          status: payload.service_type === 'replacement' ? 'replaced' : 
                 payload.expected_completion ? 'in_service' : 'available',
          last_service_at: new Date().toISOString(),
          last_service_type: payload.service_type,
          last_service_by: userId,
          service_history: [...serviceHistory, newServiceEntry],
          total_service_cost_cents: (currentCustomFields.total_service_cost_cents || 0) + 
                                   (payload.service_cost_cents || 0),
        },
      },
    });

    // Store service photos if provided
    if (payload.photos && payload.photos.length > 0) {
      for (let i = 0; i < payload.photos.length; i++) {
        const photoId = `PHOTO-SERVICE-${Date.now()}-${i}`;
        await prisma.asset.create({
          data: {
            orgId,
            name: `service_photo_${asset.id}_${i}`,
            category: 'photo',
            assetNumber: photoId,
            qrCode: `QR-${photoId}`,
            customFields: {
              asset_id: asset.id,
              service_id: serviceRecord.id,
              photo_type: 'service',
              service_type: payload.service_type,
              photo_data: payload.photos[i],
              taken_by: userId,
              taken_at: new Date().toISOString(),
            },
          },
        });
      }
    }

    await auditService.logBinderEvent({
      action: 'assets.service',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'manager',
        action: 'service_asset',
        resource: `asset:${asset.id}`,
        meta: {
          asset_id: payload.asset_id,
          service_type: payload.service_type,
          service_provider: payload.service_provider,
          service_cost_cents: payload.service_cost_cents,
          parts_used_count: payload.parts_used?.length || 0,
          photos_count: payload.photos?.length || 0,
          warranty_info: payload.warranty_info,
        },
      },
    });

    const serviceId = `SERVICE-${serviceRecord.id.substring(0, 6)}`;
    const assetIdFormatted = `AST-${asset.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: serviceId,
        version: 1,
      },
      asset_service: {
        id: serviceId,
        asset_id: assetIdFormatted,
        asset_name: asset.name,
        service_type: payload.service_type,
        service_description: payload.service_description,
        service_provider: payload.service_provider,
        service_cost_cents: payload.service_cost_cents,
        service_cost_dollars: payload.service_cost_cents ? 
          (payload.service_cost_cents / 100).toFixed(2) : null,
        service_date: payload.service_date || serviceRecord.createdAt,
        expected_completion: payload.expected_completion,
        parts_used: payload.parts_used,
        photos_count: payload.photos?.length || 0,
        warranty_info: payload.warranty_info,
        serviced_by: userId,
        serviced_at: serviceRecord.createdAt,
      },
      audit_id: `AUD-SERVICE-${serviceRecord.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error servicing asset:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to service asset',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
