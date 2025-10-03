import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience } from '@/middleware/audience';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';

const OpportunityCreateSchema = z.object({
  organizationId: z.string(),
  title: z.string(),
  amountCents: z.number().int().optional(),
  stage: z.enum(['new', 'qualified', 'proposal', 'won', 'lost']).default('new'),
  probability: z.number().int().min(0).max(100).optional(),
  closeDate: z.string().optional(),
  ownerId: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const validated = OpportunityCreateSchema.parse(req.body);
    const tenantId = req.headers['x-org-id'] as string || 'org_test';
    
    // Check for idempotency
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (idempotencyKey) {
      const existing = await prisma.opportunity.findFirst({
        where: {
          orgId: tenantId,
          title: validated.title,
          organizationId: validated.organizationId,
        },
      });
      
      if (existing) {
        return res.status(200).json({
          ok: true,
          data: existing,
        });
      }
    }

    // Create opportunity
    const opportunity = await prisma.opportunity.create({
      data: {
        orgId: tenantId,
        organizationId: validated.organizationId,
        title: validated.title,
        estValue: validated.amountCents ? validated.amountCents / 100 : null,
        stage: validated.stage,
        probability: validated.probability,
        closeDate: validated.closeDate ? new Date(validated.closeDate) : null,
        ownerId: validated.ownerId,
      },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.opportunity.create',
      tenantId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(201).json({
      ok: true,
      data: opportunity,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ 
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors
        }
      });
    }
    
    console.error('Opportunity creation error:', error);
    return res.status(500).json({ 
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
}

export default withAudience('tenant', handler);
