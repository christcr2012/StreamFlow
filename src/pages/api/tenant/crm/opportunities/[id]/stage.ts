/**
 * Opportunity Stage Transition API
 * Binder2: Stage validation with forward-only enforcement
 * 
 * PATCH /api/tenant/crm/opportunities/[id]/stage
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { withIdempotency } from '@/middleware/withIdempotency';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/middleware/withRateLimit';

// ============================================================================
// STAGE DEFINITIONS
// ============================================================================

const STAGE_ORDER = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;

const STAGE_INDEX: Record<string, number> = {
  prospecting: 0,
  qualification: 1,
  proposal: 2,
  negotiation: 3,
  closed_won: 4,
  closed_lost: 5,
};

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const StageTransitionSchema = z.object({
  newStage: z.enum([
    'prospecting',
    'qualification',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ]),
  reason: z.string().optional(),
});

// ============================================================================
// HANDLER
// ============================================================================

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'PATCH only' });
    return;
  }

  const { orgId, email } = getUserInfo(req);
  const { id } = req.query;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'BadRequest', message: 'Invalid opportunity ID' });
    return;
  }

  try {
    // Validate request body
    const data = StageTransitionSchema.parse(req.body);

    // Get current opportunity
    const opportunity = await prisma.opportunity.findFirst({
      where: { orgId, id },
      select: { id: true, stage: true, title: true },
    });

    if (!opportunity) {
      res.status(404).json({ error: 'NotFound', message: 'Opportunity not found' });
      return;
    }

    const currentStage = opportunity.stage;
    const newStage = data.newStage;

    // Check if stage is actually changing
    if (currentStage === newStage) {
      res.status(200).json({
        success: true,
        message: 'Stage unchanged',
        opportunity: { id: opportunity.id, stage: currentStage },
      });
      return;
    }

    // Validate stage transition
    const currentIndex = STAGE_INDEX[currentStage] ?? -1;
    const newIndex = STAGE_INDEX[newStage] ?? -1;

    if (currentIndex === -1 || newIndex === -1) {
      res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid stage value',
        details: { currentStage, newStage },
      });
      return;
    }

    // Check if moving backward
    const isBackward = newIndex < currentIndex;

    // Enforce forward-only transitions (require reason for backward moves)
    if (isBackward && !data.reason) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Reason required for backward stage transitions',
        details: {
          currentStage,
          newStage,
          direction: 'backward',
          requiresReason: true,
        },
      });
      return;
    }

    // Update opportunity stage
    const updated = await prisma.opportunity.updateMany({
      where: { orgId, id },
      data: {
        stage: newStage,
        updatedAt: new Date(),
      },
    });

    // Fetch updated opportunity
    const updatedOpp = await prisma.opportunity.findFirst({
      where: { orgId, id },
      select: {
        id: true,
        title: true,
        stage: true,
        estValue: true,
        probability: true,
        closeDate: true,
        updatedAt: true,
      },
    });

    // Enhanced audit log for stage transitions
    await auditLog({
      orgId,
      actorId: email || 'unknown',
      action: 'update',
      entityType: 'opportunity_stage',
      entityId: id,
      delta: {
        opportunityTitle: opportunity.title,
        previousStage: currentStage,
        newStage: newStage,
        direction: isBackward ? 'backward' : 'forward',
        reason: data.reason || null,
        stageTransition: `${currentStage} → ${newStage}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Stage updated successfully',
      opportunity: updatedOpp,
      transition: {
        from: currentStage,
        to: newStage,
        direction: isBackward ? 'backward' : 'forward',
        reason: data.reason || null,
      },
    });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid request data',
        details: error.errors,
      });
      return;
    }

    console.error('Error updating opportunity stage:', error);
    res.status(500).json({
      error: 'Internal',
      message: 'Failed to update opportunity stage',
    });
    return;
  }
}

// ============================================================================
// EXPORT WITH MIDDLEWARE
// ============================================================================

export default withRateLimit(
  RATE_LIMIT_CONFIGS.DEFAULT,
  withIdempotency(
    withAudience(AUDIENCE.CLIENT_ONLY, handler)
  )
);

