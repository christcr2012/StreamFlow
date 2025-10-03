import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Contract Management
const CreateContractSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    customer_id: z.string(),
    contract_type: z.enum(['service', 'maintenance', 'installation', 'support', 'subscription']),
    title: z.string(),
    description: z.string().optional(),
    start_date: z.string(),
    end_date: z.string(),
    value_cents: z.number().positive(),
    billing_frequency: z.enum(['one_time', 'monthly', 'quarterly', 'annually']),
    terms_conditions: z.string().optional(),
    auto_renew: z.boolean().default(false),
    renewal_period_months: z.number().positive().optional(),
    status: z.enum(['draft', 'pending_approval', 'active', 'expired', 'terminated']).default('draft'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateContractSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create contracts',
      });
    }

    // Validate customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: payload.customer_id, orgId },
    });

    if (!customer) {
      return res.status(404).json({
        error: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found',
      });
    }

    // Validate dates
    const startDate = new Date(payload.start_date);
    const endDate = new Date(payload.end_date);

    if (endDate <= startDate) {
      return res.status(422).json({
        error: 'INVALID_DATE_RANGE',
        message: 'End date must be after start date',
      });
    }

    const contractNumber = `CON-${Date.now()}`;

    const contract = await prisma.note.create({
      data: {
        orgId,
        entityType: 'contract',
        entityId: contractNumber,
        userId: actor.user_id,
        body: `CONTRACT: ${payload.title} - ${payload.description} (${payload.contract_type}, $${(payload.value_cents / 100).toFixed(2)})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.contract.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_contract',
        resource: `contract:${contract.id}`,
        meta: { 
          customer_id: payload.customer_id,
          contract_type: payload.contract_type,
          title: payload.title,
          start_date: payload.start_date,
          end_date: payload.end_date,
          value_cents: payload.value_cents,
          billing_frequency: payload.billing_frequency 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `CON-${contract.id.substring(0, 6)}`,
        version: 1,
      },
      contract: {
        id: contract.id,
        contract_number: contractNumber,
        customer_id: payload.customer_id,
        customer_name: customer.primaryName || customer.company || 'Unknown',
        contract_type: payload.contract_type,
        title: payload.title,
        description: payload.description,
        start_date: payload.start_date,
        end_date: payload.end_date,
        value_cents: payload.value_cents,
        value_usd: (payload.value_cents / 100).toFixed(2),
        billing_frequency: payload.billing_frequency,
        terms_conditions: payload.terms_conditions,
        auto_renew: payload.auto_renew,
        renewal_period_months: payload.renewal_period_months,
        status: payload.status,
        created_at: contract.createdAt.toISOString(),
      },
      audit_id: `AUD-CON-${contract.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create contract',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
