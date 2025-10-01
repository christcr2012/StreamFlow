// src/server/services/trialService.ts
// Trial management: Marketing vs Operational trials
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';
import { creditService } from './creditService';

export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const TrialType = z.enum(['MARKETING', 'OPERATIONAL']);
export type TrialTypeEnum = z.infer<typeof TrialType>;

export const CreateTrialSchema = z.object({
  trialType: TrialType,
  durationDays: z.number().int().min(1).max(90).default(14),
  aiCreditsCents: z.number().int().min(0).default(1000),
  features: z.array(z.string()).optional(),
});

// ===== TRIAL SERVICE =====

export class TrialService {
  /**
   * Create trial for org
   */
  async createTrial(
    orgId: string,
    input: z.infer<typeof CreateTrialSchema>
  ) {
    const validated = CreateTrialSchema.parse(input);

    // Check if trial already exists
    const existing = await prisma.trialConfig.findUnique({
      where: { orgId },
    });

    if (existing && existing.status === 'active') {
      throw new ServiceError(
        'Trial already active',
        'TRIAL_EXISTS',
        409
      );
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + validated.durationDays);

    const trial = await prisma.trialConfig.create({
      data: {
        orgId,
        trialType: validated.trialType,
        trialEndsAt,
        aiCreditsCents: validated.aiCreditsCents,
        features: validated.features || [],
        status: 'active',
      },
    });

    // Initialize trial credits
    if (validated.aiCreditsCents > 0) {
      await creditService.initializeTrial(orgId, validated.aiCreditsCents);
    }

    return trial;
  }

  /**
   * Get trial status
   */
  async getStatus(orgId: string) {
    const trial = await prisma.trialConfig.findUnique({
      where: { orgId },
    });

    if (!trial) {
      return {
        hasTrial: false,
        status: null,
        daysRemaining: 0,
      };
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (trial.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Auto-expire if past end date
    if (daysRemaining <= 0 && trial.status === 'active') {
      await this.expireTrial(orgId);
      return {
        hasTrial: true,
        status: 'expired',
        daysRemaining: 0,
        trial,
      };
    }

    return {
      hasTrial: true,
      status: trial.status,
      daysRemaining: Math.max(0, daysRemaining),
      trial,
    };
  }

  /**
   * Extend trial (provider action)
   */
  async extendTrial(
    orgId: string,
    additionalDays: number,
    reason: string
  ) {
    const trial = await prisma.trialConfig.findUnique({
      where: { orgId },
    });

    if (!trial) {
      throw new ServiceError('Trial not found', 'TRIAL_NOT_FOUND', 404);
    }

    const newEndDate = new Date(trial.trialEndsAt);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    const updated = await prisma.trialConfig.update({
      where: { orgId },
      data: {
        trialEndsAt: newEndDate,
        status: 'active', // Reactivate if expired
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: null, // Provider action
        action: 'trial.extend',
        entityType: 'trialConfig',
        entityId: trial.id,
        delta: { additionalDays, reason, newEndDate },
      },
    });

    return updated;
  }

  /**
   * Pause trial (provider action)
   */
  async pauseTrial(orgId: string, reason: string) {
    const trial = await prisma.trialConfig.findUnique({
      where: { orgId },
    });

    if (!trial) {
      throw new ServiceError('Trial not found', 'TRIAL_NOT_FOUND', 404);
    }

    const updated = await prisma.trialConfig.update({
      where: { orgId },
      data: { status: 'paused' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: null, // Provider action
        action: 'trial.pause',
        entityType: 'trialConfig',
        entityId: trial.id,
        delta: { reason },
      },
    });

    return updated;
  }

  /**
   * Convert trial to paid
   */
  async convertTrial(orgId: string, userId: string) {
    const trial = await prisma.trialConfig.findUnique({
      where: { orgId },
    });

    if (!trial) {
      throw new ServiceError('Trial not found', 'TRIAL_NOT_FOUND', 404);
    }

    const updated = await prisma.trialConfig.update({
      where: { orgId },
      data: {
        status: 'converted',
        convertedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'trial.convert',
        entityType: 'trialConfig',
        entityId: trial.id,
        delta: { convertedAt: new Date() },
      },
    });

    return updated;
  }

  /**
   * Expire trial (auto or manual)
   */
  async expireTrial(orgId: string) {
    const trial = await prisma.trialConfig.findUnique({
      where: { orgId },
    });

    if (!trial) {
      throw new ServiceError('Trial not found', 'TRIAL_NOT_FOUND', 404);
    }

    const updated = await prisma.trialConfig.update({
      where: { orgId },
      data: { status: 'expired' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: null, // System action
        action: 'trial.expire',
        entityType: 'trialConfig',
        entityId: trial.id,
        delta: { expiredAt: new Date() },
      },
    });

    return updated;
  }

  /**
   * Check if feature is enabled in trial
   */
  async isFeatureEnabled(orgId: string, featureId: string): Promise<boolean> {
    const status = await this.getStatus(orgId);

    if (!status.hasTrial || status.status !== 'active') {
      return false;
    }

    const features = (status.trial!.features as string[]) || [];
    return features.includes(featureId);
  }

  /**
   * Get trials expiring soon (for provider notifications)
   */
  async getExpiringSoon(daysThreshold: number = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const trials = await prisma.trialConfig.findMany({
      where: {
        status: 'active',
        trialEndsAt: {
          lte: thresholdDate,
          gte: new Date(),
        },
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return trials;
  }
}

export const trialService = new TrialService();

