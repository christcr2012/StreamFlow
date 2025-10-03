import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button: Federation — Recompute Adoption Discount (line 1828)
const RecomputeAdoptionDiscountSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    tenant_id: z.string().optional(), // If not provided, recompute for all tenants
    force_recalculation: z.boolean().default(false),
    effective_date: z.string().optional(), // ISO date string
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'provider_org';
    const validation = RecomputeAdoptionDiscountSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    // Provider-level RBAC check
    if (!['provider_admin', 'provider_engineer'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only provider admins and engineers can recompute adoption discounts',
      });
    }

    const effectiveDate = payload.effective_date ? new Date(payload.effective_date) : new Date();
    const recomputationId = `REC-${Date.now()}`;

    // Get tenants to recompute (specific tenant or all)
    const tenants = payload.tenant_id
      ? await prisma.org.findMany({ where: { id: payload.tenant_id } })
      : await prisma.org.findMany({});

    if (tenants.length === 0) {
      return res.status(404).json({
        error: 'NO_TENANTS_FOUND',
        message: 'No tenants found for recomputation',
      });
    }

    // Simulate adoption discount calculation
    const recomputationResults = [];
    
    for (const tenant of tenants) {
      // Calculate adoption metrics (simplified simulation)
      const userCount = await prisma.user.count({ where: { orgId: tenant.id } });
      const workOrderCount = await prisma.workOrder.count({ where: { orgId: tenant.id } });
      const daysActive = Math.floor((Date.now() - tenant.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate adoption score (0-100)
      const adoptionScore = Math.min(100, 
        (userCount * 10) + 
        (workOrderCount * 2) + 
        Math.min(daysActive, 30)
      );
      
      // Calculate discount percentage based on adoption score
      const discountPercentage = Math.floor(adoptionScore / 10) * 2; // 0-20% discount
      
      const result = {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        adoption_score: adoptionScore,
        previous_discount: 0, // Would fetch from existing records
        new_discount_percentage: discountPercentage,
        metrics: {
          user_count: userCount,
          work_order_count: workOrderCount,
          days_active: daysActive,
        },
        effective_date: effectiveDate.toISOString(),
      };
      
      recomputationResults.push(result);
    }

    // Create recomputation record
    const recomputation = await prisma.note.create({
      data: {
        orgId,
        entityType: 'adoption_discount_recomputation',
        entityId: recomputationId,
        userId: actor.user_id,
        body: `ADOPTION DISCOUNT RECOMPUTATION: ${tenants.length} tenants processed`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'provider.pricing.recompute_adoption_discount',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'recompute_adoption_discount',
        resource: `adoption_discount_recomputation:${recomputation.id}`,
        meta: { 
          tenant_id: payload.tenant_id,
          tenants_processed: tenants.length,
          force_recalculation: payload.force_recalculation,
          effective_date: payload.effective_date,
          recomputation_results: recomputationResults 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `FED-${recomputation.id.substring(0, 6)}`,
        version: 1,
      },
      recomputation: {
        id: recomputation.id,
        recomputation_id: recomputationId,
        tenants_processed: tenants.length,
        force_recalculation: payload.force_recalculation,
        effective_date: effectiveDate.toISOString(),
        results: recomputationResults,
        summary: {
          total_tenants: tenants.length,
          average_adoption_score: Math.round(recomputationResults.reduce((sum, r) => sum + r.adoption_score, 0) / recomputationResults.length),
          average_discount: Math.round(recomputationResults.reduce((sum, r) => sum + r.new_discount_percentage, 0) / recomputationResults.length),
          max_discount: Math.max(...recomputationResults.map(r => r.new_discount_percentage)),
        },
        processed_at: recomputation.createdAt.toISOString(),
        processed_by: actor.user_id,
      },
      audit_id: `AUD-FED-${recomputation.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error recomputing adoption discount:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to recompute adoption discount',
    });
  }
}

export default withAudience('provider', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
