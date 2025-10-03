import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateEstimateSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    org_id: z.string(),
    contact_id: z.string(),
    terms: z.string().optional(),
    valid_until: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';

  if (req.method === 'POST') {
    try {
      // Validate request body
      const validation = CreateEstimateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
      }

      const { request_id, payload, idempotency_key } = validation.data;

      // Extract organization and contact IDs
      const organizationId = payload.org_id.replace('ORG-', '');
      const contactId = payload.contact_id.replace('CON-', '');

      // Verify organization exists
      const organization = await prisma.organization.findFirst({
        where: { id: organizationId, orgId, archived: false },
      });

      if (!organization) {
        return res.status(404).json({
          error: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Verify contact exists
      const contact = await prisma.contact.findFirst({
        where: { id: contactId, orgId, status: { not: 'archived' } },
      });

      if (!contact) {
        return res.status(404).json({
          error: 'CONTACT_NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // Create estimate using Quote model (estimates are quotes in draft state)
      const estimate = await prisma.quote.create({
        data: {
          orgId,
          customerId: organizationId,
          title: `Estimate for ${organization.name}`,
          status: 'draft',
          validUntil: payload.valid_until ? new Date(payload.valid_until) : null,
          description: payload.description,
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          createdBy: userId,
        },
      });

      const estimateId = `BIL-${estimate.id.substring(0, 6)}`;

      // Audit log
      await auditService.logBinderEvent({
        action: 'billing.estimate.create',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(201).json({
        status: 'ok',
        result: {
          id: estimateId,
          version: 1,
        },
        estimate: {
          id: estimateId,
          org_id: payload.org_id,
          contact_id: payload.contact_id,
          title: estimate.title,
          status: estimate.status,
          valid_until: estimate.validUntil,
          description: estimate.description,
          subtotal: estimate.subtotal,
          tax: estimate.tax,
          total: estimate.total,
          created_at: estimate.createdAt,
        },
        audit_id: `AUD-BIL-${estimate.id.substring(0, 6)}`,
      });
    } catch (error) {
      console.error('Error creating estimate:', error);
      await auditService.logBinderEvent({
        action: 'billing.estimate.create.error',
        tenantId: orgId,
        path: req.url,
        error: String(error),
        ts: Date.now(),
      });
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create estimate',
      });
    }
  } else if (req.method === 'GET') {
    try {
      // List estimates with pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const status = req.query.status as string;

      const where: any = { 
        orgId,
        status: status || 'draft', // Default to draft estimates
      };

      const [estimates, total] = await Promise.all([
        prisma.quote.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          select: {
            id: true,
            customerId: true,
            title: true,
            status: true,
            validUntil: true,
            description: true,
            items: true,
            subtotal: true,
            tax: true,
            total: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.quote.count({ where }),
      ]);

      const formattedEstimates = estimates.map(estimate => ({
        id: `BIL-${estimate.id.substring(0, 6)}`,
        org_id: `ORG-${estimate.customerId?.substring(0, 6) || '000000'}`,
        title: estimate.title,
        status: estimate.status,
        valid_until: estimate.validUntil,
        description: estimate.description,
        items: estimate.items,
        subtotal: estimate.subtotal,
        tax: estimate.tax,
        total: estimate.total,
        created_at: estimate.createdAt,
        updated_at: estimate.updatedAt,
      }));

      return res.status(200).json({
        status: 'ok',
        estimates: formattedEstimates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error listing estimates:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to list estimates',
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
