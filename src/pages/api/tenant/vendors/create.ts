import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Vendor Management
const CreateVendorSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    company_name: z.string(),
    contact_name: z.string(),
    contact_email: z.string().email(),
    contact_phone: z.string().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
    }),
    vendor_type: z.enum(['supplier', 'subcontractor', 'service_provider']),
    specialties: z.array(z.string()).default([]),
    payment_terms: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateVendorSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create vendors',
      });
    }

    // Check for duplicate vendor
    const existingVendor = await prisma.user.findFirst({
      where: { email: payload.contact_email, orgId, roleScope: 'vendor' },
    });

    if (existingVendor) {
      return res.status(409).json({
        error: 'VENDOR_EXISTS',
        message: 'Vendor with this email already exists',
      });
    }

    const vendor = await prisma.user.create({
      data: {
        orgId,
        name: payload.contact_name,
        email: payload.contact_email,
        role: 'STAFF',
        roleScope: 'vendor',
        audience: 'tenant_vendor',
        status: 'active',
        metadata: {
          phone: payload.contact_phone,
          company_name: payload.company_name,
          vendor_type: payload.vendor_type,
          address: payload.address,
          specialties: payload.specialties,
          payment_terms: payload.payment_terms,
          created_by: actor.user_id,
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.vendor.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_vendor',
        resource: `vendor:${vendor.id}`,
        meta: { 
          company_name: payload.company_name,
          contact_name: payload.contact_name,
          contact_email: payload.contact_email,
          vendor_type: payload.vendor_type,
          specialties: payload.specialties 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `VEN-${vendor.id.substring(0, 6)}`,
        version: 1,
      },
      vendor: {
        id: vendor.id,
        company_name: payload.company_name,
        contact_name: vendor.name,
        contact_email: vendor.email,
        contact_phone: (vendor.metadata as any)?.phone,
        address: payload.address,
        vendor_type: payload.vendor_type,
        specialties: payload.specialties,
        payment_terms: payload.payment_terms,
        status: 'active',
        created_at: vendor.createdAt.toISOString(),
      },
      audit_id: `AUD-VEN-${vendor.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create vendor',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
