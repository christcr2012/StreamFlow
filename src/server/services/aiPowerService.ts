// src/server/services/aiPowerService.ts
// AI Power Controls: Eco/Standard/Max with overrides and role ceilings
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const PowerLevel = z.enum(['ECO', 'STANDARD', 'MAX']);
export type PowerLevelType = z.infer<typeof PowerLevel>;

export const PowerProfileSchema = z.object({
  globalDefault: PowerLevel.default('ECO'),
  overrides: z.record(z.string(), PowerLevel).optional(),
  roleCeilings: z.record(z.string(), PowerLevel).optional(),
});

export const RunOptionsSchema = z.object({
  power: PowerLevel.optional(), // One-off boost
  preview: z.boolean().default(false), // Cost preview only
});

export interface EffectivePowerResult {
  effectivePower: PowerLevelType;
  estCreditsCents: number;
  source: 'boost' | 'override' | 'global' | 'ceiling';
  ceilingApplied: boolean;
}

// ===== AI POWER SERVICE =====

export class AiPowerService {
  private readonly POWER_MULTIPLIERS = {
    ECO: 1,
    STANDARD: 2,
    MAX: 5,
  };

  /**
   * Get or create power profile for org
   */
  async getProfile(orgId: string) {
    let profile = await prisma.aiPowerProfile.findUnique({
      where: { orgId },
    });

    if (!profile) {
      // Create default profile
      profile = await prisma.aiPowerProfile.create({
        data: {
          orgId,
          globalDefault: 'ECO',
          overrides: {},
          roleCeilings: {
            EMPLOYEE: 'STANDARD',
            STAFF: 'STANDARD',
            MANAGER: 'MAX',
            OWNER: 'MAX',
          },
        },
      });
    }

    return profile;
  }

  /**
   * Update power profile
   */
  async updateProfile(
    orgId: string,
    userId: string,
    updates: z.infer<typeof PowerProfileSchema>
  ) {
    const validated = PowerProfileSchema.parse(updates);

    const profile = await prisma.aiPowerProfile.upsert({
      where: { orgId },
      create: {
        orgId,
        globalDefault: validated.globalDefault,
        overrides: (validated.overrides || {}) as any,
        roleCeilings: (validated.roleCeilings || {}) as any,
      },
      update: {
        globalDefault: validated.globalDefault,
        overrides: validated.overrides as any,
        roleCeilings: validated.roleCeilings as any,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'ai.power.update',
        entityType: 'aiPowerProfile',
        entityId: profile.id,
        delta: { updates: validated },
      },
    });

    return profile;
  }

  /**
   * Set override for specific feature/agent/channel
   */
  async setOverride(
    orgId: string,
    userId: string,
    key: string,
    power: PowerLevelType
  ) {
    const profile = await this.getProfile(orgId);
    const overrides = (profile.overrides as any) || {};
    overrides[key] = power;

    return this.updateProfile(orgId, userId, {
      globalDefault: profile.globalDefault as PowerLevelType,
      overrides,
      roleCeilings: profile.roleCeilings as any,
    });
  }

  /**
   * Resolve effective power level
   * Priority: Boost > Override > Global, bounded by role ceiling
   */
  async resolveEffectivePower(
    orgId: string,
    userRole: string,
    options: {
      boost?: PowerLevelType;
      overrideKey?: string;
    } = {}
  ): Promise<EffectivePowerResult> {
    const profile = await this.getProfile(orgId);
    const roleCeilings = (profile.roleCeilings as any) || {};
    const overrides = (profile.overrides as any) || {};

    let power: PowerLevelType;
    let source: 'boost' | 'override' | 'global' | 'ceiling';

    // Determine requested power
    if (options.boost) {
      power = options.boost;
      source = 'boost';
    } else if (options.overrideKey && overrides[options.overrideKey]) {
      power = overrides[options.overrideKey] as PowerLevelType;
      source = 'override';
    } else {
      power = profile.globalDefault as PowerLevelType;
      source = 'global';
    }

    // Apply role ceiling
    const ceiling = roleCeilings[userRole] as PowerLevelType | undefined;
    let ceilingApplied = false;

    if (ceiling && this.comparePower(power, ceiling) > 0) {
      power = ceiling;
      ceilingApplied = true;
      source = 'ceiling';
    }

    // Estimate cost (base 100 cents * multiplier)
    const estCreditsCents = 100 * this.POWER_MULTIPLIERS[power];

    return {
      effectivePower: power,
      estCreditsCents,
      source,
      ceilingApplied,
    };
  }

  /**
   * Compare power levels (returns -1, 0, 1 like strcmp)
   */
  private comparePower(a: PowerLevelType, b: PowerLevelType): number {
    const order = { ECO: 0, STANDARD: 1, MAX: 2 };
    return order[a] - order[b];
  }

  /**
   * Get power multiplier for billing
   */
  getPowerMultiplier(power: PowerLevelType): number {
    return this.POWER_MULTIPLIERS[power];
  }

  /**
   * Calculate price from raw cost
   */
  calculatePrice(rawCostCents: number, power: PowerLevelType): number {
    return Math.ceil(rawCostCents * this.POWER_MULTIPLIERS[power]);
  }
}

export const aiPowerService = new AiPowerService();

