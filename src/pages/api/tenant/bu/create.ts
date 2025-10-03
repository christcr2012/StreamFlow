import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateBusinessUnitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().default('UTC'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = CreateBusinessUnitSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { name, timezone, address } = validation.data;

    // Create business unit
    const businessUnit = await prisma.businessUnit.create({
      data: {
        orgId,
        name,
        timezone,
        address: address || {},
      },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'bu.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(201).json({
      ok: true,
      businessUnit,
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

