import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const InviteSubcontractorSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    email: z.string().email(),
    company: z.string().min(1),
    trade: z.string().min(1),
    contact_name: z.string().min(1),
    phone: z.string().optional(),
    license_number: z.string().optional(),
    insurance_expiry: z.string().optional(),
    hourly_rate: z.number().positive().optional(),
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

    // Validate full BINDER4_FULL contract
    const validation = InviteSubcontractorSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Check if subcontractor already exists
    const existingSubcontractor = await prisma.user.findFirst({
      where: {
        email: payload.email,
        orgId,
        roleScope: 'subcontractor',
      },
    });

    if (existingSubcontractor) {
      return res.status(400).json({
        error: 'SUBCONTRACTOR_EXISTS',
        message: 'Subcontractor with this email already exists',
      });
    }

    // Create subcontractor user using STAFF role with subcontractor scope
    const subcontractor = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.contact_name,
        role: 'STAFF', // Use existing role
        orgId,
        roleScope: 'subcontractor', // Distinguish from regular staff
        audience: 'tenant_subcontractor', // Separate audience
        status: 'invited',
        metadata: {
          company: payload.company,
          trade: payload.trade,
          phone: payload.phone,
          license_number: payload.license_number,
          insurance_expiry: payload.insurance_expiry,
          hourly_rate: payload.hourly_rate,
          invited_by: userId,
          invited_at: new Date().toISOString(),
        },
      },
    });

    await auditService.logBinderEvent({
      action: 'subcontractor.invite',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    const subcontractorId = `SUB-${subcontractor.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: subcontractorId,
        version: 1,
      },
      subcontractor: {
        id: subcontractorId,
        email: payload.email,
        company: payload.company,
        trade: payload.trade,
        contact_name: payload.contact_name,
        phone: payload.phone,
        license_number: payload.license_number,
        insurance_expiry: payload.insurance_expiry,
        hourly_rate: payload.hourly_rate,
        status: 'invited',
        invited_at: subcontractor.createdAt,
      },
      audit_id: `AUD-SUB-${subcontractor.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error inviting subcontractor:', error);
    await auditService.logBinderEvent({
      action: 'subcontractor.invite.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to invite subcontractor',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
