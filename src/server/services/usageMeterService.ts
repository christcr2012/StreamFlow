// src/server/services/usageMeterService.ts
// ULAP usage meter tracking for billing
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';

export { ServiceError };

// ===== METER TYPES =====

export const METER_TYPES = {
  // AI Tokens (by complexity)
  AI_TOKENS_LIGHT: 'ai_tokens_light',     // Simple tasks (ECO)
  AI_TOKENS_MEDIUM: 'ai_tokens_medium',   // Standard tasks
  AI_TOKENS_HEAVY: 'ai_tokens_heavy',     // Complex tasks (MAX)
  
  // Communication
  EMAIL_COUNT: 'email_count',
  SMS_COUNT: 'sms_count',
  
  // Location Services
  MAPS_CALLS: 'maps_calls',
  GEOFENCE_EVENTS: 'geofence_events',
  
  // Storage & Transfer
  STORAGE_GB_MONTH: 'storage_gb_month',
  EGRESS_GB: 'egress_gb',
  
  // AI-Powered Features
  JOB_REPORTS_GENERATED: 'job_reports_generated',
  ANOMALY_SCANS: 'anomaly_scans',
  ROUTE_OPTIMIZATIONS: 'route_optimizations',
} as const;

export type MeterType = typeof METER_TYPES[keyof typeof METER_TYPES];

// ===== USAGE METER SERVICE =====

export class UsageMeterService {
  /**
   * Record usage for a meter
   */
  async record(
    orgId: string,
    meterType: MeterType,
    value: number,
    metadata: Record<string, any> = {}
  ) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // End of month

    const meter = await prisma.usageMeter.create({
      data: {
        orgId,
        meterType,
        value,
        periodStart,
        periodEnd,
        metadata,
      },
    });

    return meter;
  }

  /**
   * Get current period usage for a meter
   */
  async getCurrentPeriodUsage(orgId: string, meterType: MeterType) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const meters = await prisma.usageMeter.findMany({
      where: {
        orgId,
        meterType,
        periodStart: { gte: periodStart },
      },
    });

    const totalValue = meters.reduce((sum, m) => sum + m.value, 0);

    return {
      meterType,
      totalValue,
      recordCount: meters.length,
      periodStart,
    };
  }

  /**
   * Get all usage for current period
   */
  async getAllCurrentPeriodUsage(orgId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const meters = await prisma.usageMeter.findMany({
      where: {
        orgId,
        periodStart: { gte: periodStart },
      },
    });

    // Group by meter type
    const byType = meters.reduce((acc, m) => {
      if (!acc[m.meterType]) {
        acc[m.meterType] = { totalValue: 0, recordCount: 0 };
      }
      acc[m.meterType].totalValue += m.value;
      acc[m.meterType].recordCount += 1;
      return acc;
    }, {} as Record<string, { totalValue: number; recordCount: number }>);

    return {
      periodStart,
      meters: byType,
    };
  }

  /**
   * Record AI token usage (auto-categorize by power level)
   */
  async recordAiTokens(
    orgId: string,
    tokens: number,
    powerLevel: 'ECO' | 'STANDARD' | 'MAX',
    metadata: Record<string, any> = {}
  ) {
    const meterType =
      powerLevel === 'ECO'
        ? METER_TYPES.AI_TOKENS_LIGHT
        : powerLevel === 'STANDARD'
        ? METER_TYPES.AI_TOKENS_MEDIUM
        : METER_TYPES.AI_TOKENS_HEAVY;

    return this.record(orgId, meterType, tokens, { powerLevel, ...metadata });
  }

  /**
   * Get usage summary for billing
   */
  async getUsageSummary(orgId: string, periodStart: Date, periodEnd: Date) {
    const meters = await prisma.usageMeter.findMany({
      where: {
        orgId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    const summary = meters.reduce((acc, m) => {
      if (!acc[m.meterType]) {
        acc[m.meterType] = {
          totalValue: 0,
          recordCount: 0,
          firstRecorded: m.createdAt,
          lastRecorded: m.createdAt,
        };
      }
      acc[m.meterType].totalValue += m.value;
      acc[m.meterType].recordCount += 1;
      if (m.createdAt < acc[m.meterType].firstRecorded) {
        acc[m.meterType].firstRecorded = m.createdAt;
      }
      if (m.createdAt > acc[m.meterType].lastRecorded) {
        acc[m.meterType].lastRecorded = m.createdAt;
      }
      return acc;
    }, {} as Record<string, { totalValue: number; recordCount: number; firstRecorded: Date; lastRecorded: Date }>);

    return {
      periodStart,
      periodEnd,
      summary,
    };
  }

  /**
   * Check if usage exceeds threshold (for alerts)
   */
  async checkThreshold(
    orgId: string,
    meterType: MeterType,
    threshold: number
  ): Promise<{ exceeded: boolean; current: number; threshold: number }> {
    const usage = await this.getCurrentPeriodUsage(orgId, meterType);
    return {
      exceeded: usage.totalValue > threshold,
      current: usage.totalValue,
      threshold,
    };
  }
}

export const usageMeterService = new UsageMeterService();

