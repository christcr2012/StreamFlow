import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateBusinessUnitSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string().min(1, 'Name is required'),
    timezone: z.string().default('UTC'),
    address: z.string().optional(), // Full address string as per BINDER4_FULL
    phone: z.string().optional(),
    manager_email: z.string().email().optional(),
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

    // Validate BINDER4_FULL contract
    const validation = CreateBusinessUnitSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Create business unit (using available schema fields)
    const businessUnit = await prisma.businessUnit.create({
      data: {
        orgId,
        name: payload.name,
        timezone: payload.timezone,
        address: payload.address ? {
          full_address: payload.address,
          phone: payload.phone,
          manager_email: payload.manager_email
        } : {},
      },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'bu.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    const buId = `BU-${businessUnit.id.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: buId,
        version: 1,
      },
      business_unit: {
        id: buId,
        name: payload.name,
        timezone: payload.timezone,
        address: payload.address,
        phone: payload.phone,
        manager_email: payload.manager_email,
        created_at: businessUnit.createdAt,
      },
      audit_id: `AUD-BU-${businessUnit.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating business unit:', error);
    await auditService.logBinderEvent({
      action: 'bu.create.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create business unit',
    });
  }
}

export default withAudience('tenant', handler);

