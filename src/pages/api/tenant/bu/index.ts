import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateBusinessUnitSchema = z.object({
  name: z.string().min(1).max(200),
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
  const orgId = req.headers['x-org-id'] as string || 'org_test';

  try {
    // GET - List business units
    if (req.method === 'GET') {
      const businessUnits = await prisma.businessUnit.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              linesOfBusiness: true,
              fleetVehicles: true,
            },
          },
        },
      });

      await auditService.logBinderEvent({
        action: 'bu.list',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(200).json({
        ok: true,
        businessUnits,
        count: businessUnits.length,
      });
    }

    // POST - Create business unit
    if (req.method === 'POST') {
      const validation = CreateBusinessUnitSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
      }

      const { name, timezone, address } = validation.data;

      const businessUnit = await prisma.businessUnit.create({
        data: {
          orgId,
          name,
          timezone,
          address: address || {},
        },
      });

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
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling business units:', error);
    await auditService.logBinderEvent({
      action: 'bu.error',
      tenantId: orgId,
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to handle business unit operation',
    });
  }
}

export default withAudience('tenant', handler);

