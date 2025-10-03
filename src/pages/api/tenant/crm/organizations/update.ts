import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateOrganizationSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    org_id: z.string(),
    patch: z.object({
      name: z.string().min(1).optional(),
      domain: z.string().optional(),
      industry: z.string().optional(),
      size: z.number().optional(),
      annual_revenue: z.number().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      owner_id: z.string().optional(),
    }),
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

    // Validate request body
    const validation = UpdateOrganizationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract ID from org_id
    const organizationId = payload.org_id.replace('ORG-', '');
    if (!organizationId) {
      return res.status(400).json({
        error: 'INVALID_ORG_ID',
        message: 'Organization ID must be in format ORG-000001',
      });
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        orgId,
        archived: false,
      },
    });

    if (!existingOrg) {
      return res.status(404).json({
        error: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found or has been archived',
      });
    }

    // Check for duplicate name if being updated
    if (payload.patch.name) {
      const duplicateOrg = await prisma.organization.findFirst({
        where: {
          orgId,
          id: { not: organizationId },
          name: payload.patch.name,
          archived: false,
        },
      });

      if (duplicateOrg) {
        return res.status(422).json({
          error: 'DUPLICATE_ORGANIZATION',
          message: 'Another organization with this name already exists',
          existing_org_id: `ORG-${duplicateOrg.id.substring(0, 6)}`,
        });
      }
    }

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(payload.patch.name && { name: payload.patch.name }),
        ...(payload.patch.domain !== undefined && { domain: payload.patch.domain }),
        ...(payload.patch.industry !== undefined && { industry: payload.patch.industry }),
        ...(payload.patch.size !== undefined && { size: payload.patch.size }),
        ...(payload.patch.annual_revenue !== undefined && { annualRevenue: payload.patch.annual_revenue }),
        ...(payload.patch.website !== undefined && { website: payload.patch.website }),
        ...(payload.patch.phone !== undefined && { phone: payload.patch.phone }),
        ...(payload.patch.owner_id !== undefined && { ownerId: payload.patch.owner_id }),
      },
    });

    const orgIdFormatted = `ORG-${updatedOrg.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.organization.update',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: orgIdFormatted,
        version: updatedOrg.version,
      },
      organization: {
        id: orgIdFormatted,
        name: updatedOrg.name,
        domain: updatedOrg.domain,
        industry: updatedOrg.industry,
        size: updatedOrg.size,
        annual_revenue: updatedOrg.annualRevenue,
        website: updatedOrg.website,
        phone: updatedOrg.phone,
        owner_id: updatedOrg.ownerId,
        updated_at: updatedOrg.updatedAt,
      },
      audit_id: `AUD-ORG-${updatedOrg.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    await auditService.logBinderEvent({
      action: 'crm.organization.update.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update organization',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
