import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MergeOrganizationSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    primary_org_id: z.string(),
    secondary_org_id: z.string(),
    merge_strategy: z.enum(['keep_primary', 'merge_fields']).default('keep_primary'),
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
    const validation = MergeOrganizationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract IDs
    const primaryOrgId = payload.primary_org_id.replace('ORG-', '');
    const secondaryOrgId = payload.secondary_org_id.replace('ORG-', '');

    if (!primaryOrgId || !secondaryOrgId) {
      return res.status(400).json({
        error: 'INVALID_ORG_ID',
        message: 'Organization IDs must be in format ORG-000001',
      });
    }

    if (primaryOrgId === secondaryOrgId) {
      return res.status(400).json({
        error: 'SAME_ORGANIZATION',
        message: 'Cannot merge organization with itself',
      });
    }

    // Check if both organizations exist
    const [primaryOrg, secondaryOrg] = await Promise.all([
      prisma.organization.findFirst({
        where: { id: primaryOrgId, orgId, archived: false },
      }),
      prisma.organization.findFirst({
        where: { id: secondaryOrgId, orgId, archived: false },
      }),
    ]);

    if (!primaryOrg) {
      return res.status(404).json({
        error: 'PRIMARY_ORG_NOT_FOUND',
        message: 'Primary organization not found',
      });
    }

    if (!secondaryOrg) {
      return res.status(404).json({
        error: 'SECONDARY_ORG_NOT_FOUND',
        message: 'Secondary organization not found',
      });
    }

    // Perform merge in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update all contacts to point to primary organization
      await tx.contact.updateMany({
        where: { organizationId: secondaryOrgId, orgId },
        data: { organizationId: primaryOrgId },
      });

      // Update all opportunities to point to primary organization
      await tx.opportunity.updateMany({
        where: { organizationId: secondaryOrgId, orgId },
        data: { organizationId: primaryOrgId },
      });

      // Archive secondary organization
      const archivedSecondary = await tx.organization.update({
        where: { id: secondaryOrgId },
        data: { archived: true },
      });

      // Optionally merge fields if strategy is merge_fields
      let updatedPrimary = primaryOrg;
      if (payload.merge_strategy === 'merge_fields') {
        updatedPrimary = await tx.organization.update({
          where: { id: primaryOrgId },
          data: {
            // Merge non-null fields from secondary to primary
            ...(secondaryOrg.domain && !primaryOrg.domain && { domain: secondaryOrg.domain }),
            ...(secondaryOrg.industry && !primaryOrg.industry && { industry: secondaryOrg.industry }),
            ...(secondaryOrg.size && !primaryOrg.size && { size: secondaryOrg.size }),
            ...(secondaryOrg.annualRevenue && !primaryOrg.annualRevenue && { annualRevenue: secondaryOrg.annualRevenue }),
            ...(secondaryOrg.website && !primaryOrg.website && { website: secondaryOrg.website }),
            ...(secondaryOrg.phone && !primaryOrg.phone && { phone: secondaryOrg.phone }),
          },
        });
      }

      return { updatedPrimary, archivedSecondary };
    });

    const primaryOrgIdFormatted = `ORG-${result.updatedPrimary.id.substring(0, 6)}`;
    const secondaryOrgIdFormatted = `ORG-${result.archivedSecondary.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.organization.merge',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: primaryOrgIdFormatted,
        version: result.updatedPrimary.version,
      },
      merge: {
        primary_org_id: primaryOrgIdFormatted,
        secondary_org_id: secondaryOrgIdFormatted,
        strategy: payload.merge_strategy,
        merged_at: new Date(),
      },
      organization: {
        id: primaryOrgIdFormatted,
        name: result.updatedPrimary.name,
        domain: result.updatedPrimary.domain,
        industry: result.updatedPrimary.industry,
        size: result.updatedPrimary.size,
        annual_revenue: result.updatedPrimary.annualRevenue,
        website: result.updatedPrimary.website,
        phone: result.updatedPrimary.phone,
        updated_at: result.updatedPrimary.updatedAt,
      },
      audit_id: `AUD-ORG-${result.updatedPrimary.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error merging organizations:', error);
    await auditService.logBinderEvent({
      action: 'crm.organization.merge.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to merge organizations',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
