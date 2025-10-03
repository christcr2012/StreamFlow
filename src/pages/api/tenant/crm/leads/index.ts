import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateLeadSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    source: z.string().optional(),
    company: z.string().optional(),
    notes: z.string().optional(),
    stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).default('new'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';

  if (req.method === 'POST') {
    try {
      // Validate request body
      const validation = CreateLeadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
      }

      const { request_id, payload, idempotency_key } = validation.data;

      // Check for duplicate email/phone
      const existingLead = await prisma.lead.findFirst({
        where: {
          orgId,
          OR: [
            { email: payload.email },
            ...(payload.phone ? [{ phoneE164: payload.phone }] : []),
          ],
          archived: false,
        },
      });

      if (existingLead) {
        return res.status(422).json({
          error: 'DUPLICATE_LEAD',
          message: 'Lead with this email or phone already exists',
          existing_lead_id: existingLead.id,
        });
      }

      // Create lead
      const lead = await prisma.lead.create({
        data: {
          orgId,
          publicId: `LEA-${Date.now()}`,
          sourceType: 'MANUAL',
          identityHash: `${payload.email}-${Date.now()}`,
          contactName: `${payload.first_name} ${payload.last_name}`,
          email: payload.email,
          phoneE164: payload.phone,
          company: payload.company,
          stage: payload.stage,
        },
      });

      // Generate lead ID in format LEA-000001
      const leadId = `LEA-${lead.id.toString().padStart(6, '0')}`;

      // Audit log
      await auditService.logBinderEvent({
        action: 'crm.lead.create',
        tenantId: orgId,
        path: req.url,
        ts: Date.now(),
      });

      return res.status(201).json({
        status: 'ok',
        result: {
          id: leadId,
          version: 1,
        },
        lead: {
          id: leadId,
          contact_name: lead.contactName,
          email: lead.email,
          phone: lead.phoneE164,
          company: lead.company,
          stage: lead.stage,
          created_at: lead.createdAt,
        },
        audit_id: `AUD-LEA-${lead.id.toString().padStart(6, '0')}`,
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      await auditService.logBinderEvent({
        action: 'crm.lead.create.error',
        tenantId: orgId,
        path: req.url,
        error: String(error),
        ts: Date.now(),
      });
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create lead',
      });
    }
  } else if (req.method === 'GET') {
    try {
      // List leads with pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const where: any = {
        orgId,
        archived: false,
      };

      if (status) {
        where.stage = status;
      }

      if (search) {
        where.OR = [
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          select: {
            id: true,
            contactName: true,
            email: true,
            phoneE164: true,
            company: true,
            stage: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.lead.count({ where }),
      ]);

      const formattedLeads = leads.map(lead => ({
        id: `LEA-${lead.id.substring(0, 6)}`,
        contact_name: lead.contactName,
        email: lead.email,
        phone: lead.phoneE164,
        company: lead.company,
        stage: lead.stage,
        created_at: lead.createdAt,
        updated_at: lead.updatedAt,
      }));

      return res.status(200).json({
        status: 'ok',
        leads: formattedLeads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error listing leads:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to list leads',
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
