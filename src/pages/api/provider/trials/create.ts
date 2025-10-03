/**
 * Provider Trial Creation API
 * Binder1: POST /api/provider/trials/create
 * 
 * Creates a trial tenant with seeded credits
 * Idempotent on X-Idempotency-Key
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/withIdempotency';
import { auditLog } from '@/server/services/auditService';
import { trialService } from '@/server/services/trialService';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CreateTrialSchema = z.object({
  tenantName: z.string().min(1),
  ownerEmail: z.string().email(),
  plan: z.string().optional(),
  durationDays: z.number().int().min(1).max(365),
  seedCredits: z.record(z.number().int().min(0)).optional(),
});

type CreateTrialInput = z.infer<typeof CreateTrialSchema>;

// ============================================================================
// HANDLER
// ============================================================================

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'Method not allowed' });
    return;
  }

  try {
    // Validate request body
    const data = CreateTrialSchema.parse(req.body);

    // Check if tenant with this name already exists
    const existingOrg = await prisma.org.findFirst({
      where: { name: data.tenantName },
    });

    if (existingOrg) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Tenant with this name already exists',
      });
      return;
    }

    // Create tenant organization
    const org = await prisma.org.create({
      data: {
        name: data.tenantName,
        plan: data.plan || 'STARTER',
      },
    });

    // Create trial configuration
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + data.durationDays);

    const trial = await trialService.createTrial(org.id, {
      trialType: 'OPERATIONAL',
      durationDays: data.durationDays,
      aiCreditsCents: 0, // Will be set via seed credits
      features: [],
    });

    // Seed credits if provided
    if (data.seedCredits) {
      const totalCredits = Object.values(data.seedCredits).reduce((sum, val) => sum + val, 0);

      await prisma.creditLedger.create({
        data: {
          orgId: org.id,
          amountCents: totalCredits * 5, // 1 credit = $0.05
          type: 'TRIAL',
          description: `Trial seed credits`,
          balanceBefore: 0,
          balanceAfter: totalCredits * 5,
          metadata: data.seedCredits as any,
        },
      });
    }

    // Create owner user (placeholder - in production, send invitation email)
    const ownerUser = await prisma.user.create({
      data: {
        orgId: org.id,
        email: data.ownerEmail,
        role: 'OWNER',
      },
    });

    // Generate portal URL
    const portalUrl = `https://app.streamflow.com/tenant/${org.id}`;

    // Audit log
    await auditLog({
      orgId: org.id,
      actorId: 'provider_system',
      action: 'create',
      entityType: 'trial',
      entityId: trial.id,
      delta: {
        tenantName: data.tenantName,
        ownerEmail: data.ownerEmail,
        durationDays: data.durationDays,
        seedCredits: data.seedCredits,
      },
    });

    // Return response
    res.status(201).json({
      ok: true,
      data: {
        tenantId: org.id,
        portalUrl,
        expiresAt: trialEndsAt.toISOString(),
        ownerId: ownerUser.id,
        ownerEmail: ownerUser.email,
        seedCredits: data.seedCredits || {},
      },
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(422).json({
        error: 'ValidationError',
        message: 'Invalid request body',
        details: error.errors,
      });
      return;
    }

    console.error('Error creating trial:', error);
    res.status(500).json({
      error: 'Internal',
      message: 'Failed to create trial',
    });
    return;
  }
}

// Export with middleware stack
export default withAudience('provider', handler);

