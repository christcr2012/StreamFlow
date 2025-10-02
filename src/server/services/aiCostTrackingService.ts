/**
 * AI Cost Tracking Service
 * Binder1: Token logging and cost calculation for AI routes
 * 
 * Tracks AI usage, calculates costs, enforces Eco/Full mode
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from './auditService';

// ============================================================================
// TYPES
// ============================================================================

export interface AIUsageLog {
  orgId: string;
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCents: number;
  mode: 'eco' | 'full';
  endpoint: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCostCents: number;
  byModel: Record<string, {
    requests: number;
    tokens: number;
    costCents: number;
  }>;
  byMode: Record<'eco' | 'full', {
    requests: number;
    tokens: number;
    costCents: number;
  }>;
}

// ============================================================================
// PRICING (cents per 1k tokens)
// ============================================================================

const MODEL_PRICING = {
  // GPT-4 models
  'gpt-4': { prompt: 3, completion: 6 },
  'gpt-4-turbo': { prompt: 1, completion: 3 },
  'gpt-4o': { prompt: 0.5, completion: 1.5 },
  
  // GPT-3.5 models
  'gpt-3.5-turbo': { prompt: 0.05, completion: 0.15 },
  
  // Claude models
  'claude-3-opus': { prompt: 1.5, completion: 7.5 },
  'claude-3-sonnet': { prompt: 0.3, completion: 1.5 },
  'claude-3-haiku': { prompt: 0.025, completion: 0.125 },
  
  // Default fallback
  'default': { prompt: 0.1, completion: 0.3 },
} as const;

// Mode restrictions
const MODE_RESTRICTIONS = {
  eco: ['gpt-3.5-turbo', 'claude-3-haiku'],
  full: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'claude-3-opus', 'claude-3-sonnet'],
} as const;

// ============================================================================
// SERVICE
// ============================================================================

class AIcostTrackingService {
  /**
   * Log AI usage and calculate cost
   */
  async logUsage(data: AIUsageLog): Promise<void> {
    try {
      // Calculate cost
      const costCents = this.calculateCost(
        data.model,
        data.promptTokens,
        data.completionTokens
      );

      // Store in database
      await prisma.aIUsageLog.create({
        data: {
          orgId: data.orgId,
          userId: data.userId,
          model: data.model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          costCents,
          mode: data.mode,
          endpoint: data.endpoint,
          requestId: data.requestId,
          metadata: data.metadata as any,
          createdAt: new Date(),
        },
      });

      // Audit log
      await auditLog({
        orgId: data.orgId,
        actorId: data.userId,
        action: 'create',
        entityType: 'ai_usage',
        entityId: data.requestId || 'unknown',
        delta: {
          model: data.model,
          tokens: data.totalTokens,
          costCents,
          mode: data.mode,
          endpoint: data.endpoint,
        },
      });
    } catch (error) {
      console.error('Error logging AI usage:', error);
      // Don't throw - we don't want to fail the AI request if logging fails
    }
  }

  /**
   * Calculate cost for AI usage
   */
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING.default;
    
    const promptCost = (promptTokens / 1000) * pricing.prompt;
    const completionCost = (completionTokens / 1000) * pricing.completion;
    
    return Math.ceil(promptCost + completionCost); // Round up to nearest cent
  }

  /**
   * Check if user can use specified mode
   */
  async canUseMode(orgId: string, userId: string, mode: 'eco' | 'full'): Promise<boolean> {
    if (mode === 'eco') {
      return true; // Everyone can use eco mode
    }

    // Full mode requires OWNER role
    const user = await prisma.user.findFirst({
      where: { orgId, email: userId },
      select: { role: true },
    });

    return user?.role === 'OWNER';
  }

  /**
   * Validate model for mode
   */
  validateModelForMode(model: string, mode: 'eco' | 'full'): boolean {
    const allowedModels = MODE_RESTRICTIONS[mode] as readonly string[];
    return allowedModels.includes(model);
  }

  /**
   * Get usage statistics for org
   */
  async getUsageStats(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AIUsageStats> {
    const where: any = { orgId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.aIUsageLog.findMany({
      where,
      select: {
        model: true,
        totalTokens: true,
        costCents: true,
        mode: true,
      },
    });

    const stats: AIUsageStats = {
      totalRequests: logs.length,
      totalTokens: 0,
      totalCostCents: 0,
      byModel: {},
      byMode: {
        eco: { requests: 0, tokens: 0, costCents: 0 },
        full: { requests: 0, tokens: 0, costCents: 0 },
      },
    };

    for (const log of logs) {
      stats.totalTokens += log.totalTokens;
      stats.totalCostCents += log.costCents;

      // By model
      if (!stats.byModel[log.model]) {
        stats.byModel[log.model] = { requests: 0, tokens: 0, costCents: 0 };
      }
      stats.byModel[log.model].requests++;
      stats.byModel[log.model].tokens += log.totalTokens;
      stats.byModel[log.model].costCents += log.costCents;

      // By mode
      const modeKey = log.mode as 'eco' | 'full';
      stats.byMode[modeKey].requests++;
      stats.byMode[modeKey].tokens += log.totalTokens;
      stats.byMode[modeKey].costCents += log.costCents;
    }

    return stats;
  }

  /**
   * Get usage for specific user
   */
  async getUserUsage(
    orgId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AIUsageStats> {
    const where: any = { orgId, userId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.aIUsageLog.findMany({
      where,
      select: {
        model: true,
        totalTokens: true,
        costCents: true,
        mode: true,
      },
    });

    const stats: AIUsageStats = {
      totalRequests: logs.length,
      totalTokens: 0,
      totalCostCents: 0,
      byModel: {},
      byMode: {
        eco: { requests: 0, tokens: 0, costCents: 0 },
        full: { requests: 0, tokens: 0, costCents: 0 },
      },
    };

    for (const log of logs) {
      stats.totalTokens += log.totalTokens;
      stats.totalCostCents += log.costCents;

      if (!stats.byModel[log.model]) {
        stats.byModel[log.model] = { requests: 0, tokens: 0, costCents: 0 };
      }
      stats.byModel[log.model].requests++;
      stats.byModel[log.model].tokens += log.totalTokens;
      stats.byModel[log.model].costCents += log.costCents;

      const modeKey = log.mode as 'eco' | 'full';
      stats.byMode[modeKey].requests++;
      stats.byMode[modeKey].tokens += log.totalTokens;
      stats.byMode[modeKey].costCents += log.costCents;
    }

    return stats;
  }

  /**
   * Get recent usage logs
   */
  async getRecentLogs(
    orgId: string,
    limit: number = 50
  ): Promise<any[]> {
    return prisma.aIUsageLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        model: true,
        totalTokens: true,
        costCents: true,
        mode: true,
        endpoint: true,
        createdAt: true,
      },
    });
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const aiCostTrackingService = new AIcostTrackingService();

