import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Lead Management
const CreateLeadSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
    }).optional(),
    lead_source: z.enum(['website', 'referral', 'cold_call', 'social_media', 'advertisement', 'other']),
    service_interest: z.string(),
    estimated_value_cents: z.number().positive().optional(),
    notes: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateLeadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    // Check for duplicate lead
    if (payload.email) {
      const existingLead = await prisma.lead.findFirst({
        where: { email: payload.email, orgId },
      });

      if (existingLead) {
        return res.status(409).json({
          error: 'LEAD_EXISTS',
          message: 'Lead with this email already exists',
        });
      }
    }

    const lead = await prisma.lead.create({
      data: {
        orgId,
        publicId: `LED-${Date.now()}`,
        sourceType: 'MANUAL_OTHER',
        identityHash: `hash-${Date.now()}`,
        company: payload.company,
        contactName: payload.name,
        email: payload.email,
        phoneE164: payload.phone,
        stage: 'new',
        ownerId: actor.user_id,
        notes: payload.notes,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.lead.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_lead',
        resource: `lead:${lead.id}`,
        meta: { 
          name: payload.name,
          email: payload.email,
          company: payload.company,
          lead_source: payload.lead_source,
          service_interest: payload.service_interest,
          estimated_value_cents: payload.estimated_value_cents 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `LED-${lead.id.substring(0, 6)}`,
        version: 1,
      },
      lead: {
        id: lead.id,
        name: lead.contactName,
        email: lead.email,
        phone: lead.phoneE164,
        company: lead.company,
        address: payload.address ? JSON.stringify(payload.address) : null,
        lead_source: payload.lead_source,
        service_interest: payload.service_interest,
        estimated_value_cents: payload.estimated_value_cents,
        estimated_value_usd: payload.estimated_value_cents ? (payload.estimated_value_cents / 100).toFixed(2) : null,
        notes: lead.notes,
        priority: payload.priority,
        status: 'new',
        assigned_to: actor.user_id,
        created_at: lead.createdAt.toISOString(),
      },
      audit_id: `AUD-LED-${lead.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create lead',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
