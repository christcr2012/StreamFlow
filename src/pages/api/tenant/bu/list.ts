import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';

    // Get all business units for this tenant
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

    // Audit log
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
  } catch (error) {
    console.error('Error listing business units:', error);
    await auditService.logBinderEvent({
      action: 'bu.list.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to list business units',
    });
  }
}

export default withAudience('tenant', handler);

