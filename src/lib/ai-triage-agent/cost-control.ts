// src/lib/ai-triage-agent/cost-control.ts
// AI Triage Agent Cost Control System - Token Budget & Rate Limiting
// Robinson Solutions B2B SaaS Platform

import { prisma as db } from "../prisma";
import { createStaffAuditSystem } from "../staff-audit-system";

export interface TokenUsageRecord {
  id: string;
  tenantId: string;
  timestamp: Date;
  
  // Usage Details
  modelTier: 'tier_a_small' | 'tier_b_large';
  modelName: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  estimatedCost: number; // in cents
  
  // Context
  operationType: 'cluster_summary' | 'deep_dive' | 'escalation_analysis';
  clusterId?: string;
  batchId: string;
  
  // Budget Attribution
  providerBudgetId: string;
  tenantBudgetId?: string; // Should be null - Provider pays
  
  // Performance Tracking
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
}

export interface ProviderBudget {
  id: string;
  providerId: string;
  
  // Budget Limits
  monthlyTokenLimit: number;
  dailyTokenLimit: number;
  perMinuteTokenLimit: number;
  
  // Current Usage
  currentMonthUsage: number;
  currentDayUsage: number;
  currentMinuteUsage: number;
  
  // Cost Tracking
  monthlySpend: number; // in cents
  estimatedCostPerToken: number; // in cents
  
  // Period Tracking
  monthStart: Date;
  dayStart: Date;
  minuteStart: Date;
  lastReset: Date;
  
  // Control Flags
  hardStop: boolean;
  alertThresholds: {
    warning: number; // percentage of budget
    critical: number; // percentage of budget
  };
  
  // Tenant Assignment
  assignedTenants: string[];
  maxTenantsSupported: number;
}

export interface TenantCostProfile {
  tenantId: string;
  providerBudgetId: string;
  
  // Usage Tracking
  monthlyTokenUsage: number;
  dailyTokenUsage: number;
  averageTokensPerEvent: number;
  
  // Cost Attribution
  monthlyAttributedCost: number; // Provider's cost for this tenant
  costPerIncident: number;
  
  // Performance Metrics
  eventsProcessed: number;
  clustersGenerated: number;
  escalationsTriggered: number;
  
  // Optimization Data
  samplingRate: number; // Current sampling rate for cost control
  batchingInterval: number; // Current batching interval
  lastOptimization: Date;
  
  // Throttling State
  isThrottled: boolean;
  throttleReason?: string;
  throttleUntil?: Date;
}

export interface CostControlConfig {
  // Global Provider Limits
  globalMonthlyLimit: number;
  globalDailyLimit: number;
  globalPerMinuteLimit: number;
  
  // Per-Tenant Limits
  perTenantMonthlyLimit: number;
  perTenantDailyLimit: number;
  
  // Dynamic Throttling
  enableDynamicThrottling: boolean;
  throttleThresholds: {
    budgetUtilization: number; // percentage
    tokenVelocity: number; // tokens per minute
    errorRate: number; // percentage of failed requests
  };
  
  // Cost Optimization
  costOptimizationRules: {
    increaseSamplingWhenOverBudget: boolean;
    increaseBatchingWhenOverBudget: boolean;
    preferTierAModel: boolean;
    skipLowSeverityClusters: boolean;
  };
  
  // Alert Settings
  budgetAlerts: {
    warningThreshold: number; // percentage
    criticalThreshold: number; // percentage
    notifyProviderEmail: string;
    notifySlackWebhook?: string;
  };
}

export class CostControlManager {
  private providerId: string;
  private config: CostControlConfig;
  private auditSystem: any;
  private usageCache: Map<string, TokenUsageRecord[]> = new Map();

  constructor(providerId: string, config: CostControlConfig) {
    this.providerId = providerId;
    this.config = config;
    this.auditSystem = createStaffAuditSystem('SYSTEM', providerId, 'cost_control');
  }

  // Pre-Request Budget Check
  async checkBudgetAvailability(
    tenantId: string,
    estimatedTokens: number,
    modelTier: TokenUsageRecord['modelTier']
  ): Promise<{
    allowed: boolean;
    reason?: string;
    suggestedOptimizations?: string[];
    fallbackOptions?: string[];
  }> {
    try {
      // Get current provider budget status
      const providerBudget = await this.getProviderBudget();
      if (!providerBudget) {
        return { allowed: false, reason: 'Provider budget not configured' };
      }

      // Get tenant cost profile
      const tenantProfile = await this.getTenantCostProfile(tenantId);
      
      // Check hard stops first
      if (providerBudget.hardStop) {
        if (providerBudget.currentMonthUsage + estimatedTokens > providerBudget.monthlyTokenLimit) {
          await this.logCostEvent('budget_hard_stop', { tenantId, estimatedTokens, budgetExceeded: true });
          return { 
            allowed: false, 
            reason: 'Monthly provider budget exhausted',
            suggestedOptimizations: [
              'Increase sampling rate to reduce volume',
              'Increase batching interval',
              'Skip low-severity clusters'
            ]
          };
        }
      }

      // Check per-minute rate limits
      const currentMinuteUsage = await this.getCurrentMinuteUsage();
      if (currentMinuteUsage + estimatedTokens > providerBudget.perMinuteTokenLimit) {
        return {
          allowed: false,
          reason: 'Per-minute rate limit exceeded',
          fallbackOptions: [
            'Queue request for next minute',
            'Use emergency batching mode'
          ]
        };
      }

      // Check tenant-specific limits
      const tenantCheck = await this.checkTenantLimits(tenantId, estimatedTokens, tenantProfile);
      if (!tenantCheck.allowed) {
        return tenantCheck;
      }

      // Check for dynamic throttling conditions
      const throttleCheck = await this.checkThrottlingConditions(tenantId, modelTier);
      if (throttleCheck.shouldThrottle) {
        return {
          allowed: false,
          reason: throttleCheck.reason,
          suggestedOptimizations: throttleCheck.optimizations
        };
      }

      return { allowed: true };

    } catch (error) {
      await this.logCostEvent('budget_check_error', { tenantId, error: error.message });
      return { allowed: false, reason: 'Budget check system error' };
    }
  }

  // Record Token Usage After Request
  async recordTokenUsage(
    tenantId: string,
    usage: Omit<TokenUsageRecord, 'id' | 'timestamp' | 'providerBudgetId' | 'estimatedCost'>
  ): Promise<{ recorded: boolean; newCostProfile?: TenantCostProfile }> {
    try {
      const providerBudget = await this.getProviderBudget();
      if (!providerBudget) {
        throw new Error('Provider budget not found');
      }

      // Calculate estimated cost
      const estimatedCost = usage.totalTokens * providerBudget.estimatedCostPerToken;

      // Create usage record
      const usageRecord: TokenUsageRecord = {
        id: `usage_${Date.now()}_${tenantId}`,
        timestamp: new Date(),
        providerBudgetId: providerBudget.id,
        estimatedCost,
        ...usage
      };

      // Store usage record
      await this.storeUsageRecord(usageRecord);

      // Update provider budget counters
      await this.updateProviderBudgetCounters(providerBudget.id, usage.totalTokens, estimatedCost);

      // Update tenant cost profile
      const updatedProfile = await this.updateTenantCostProfile(tenantId, usageRecord);

      // Check if alerts should be triggered
      await this.checkBudgetAlerts(providerBudget.id, tenantId);

      // Log cost tracking
      await this.logCostEvent('token_usage_recorded', {
        tenantId,
        modelTier: usage.modelTier,
        totalTokens: usage.totalTokens,
        estimatedCost,
        operationType: usage.operationType
      });

      return { recorded: true, newCostProfile: updatedProfile };

    } catch (error) {
      await this.logCostEvent('usage_recording_error', { tenantId, error: error.message });
      return { recorded: false };
    }
  }

  // Dynamic Cost Optimization
  async optimizeCostsForTenant(tenantId: string): Promise<{
    optimizationsApplied: string[];
    newSamplingRate?: number;
    newBatchingInterval?: number;
    estimatedSavings?: number;
  }> {
    try {
      const tenantProfile = await this.getTenantCostProfile(tenantId);
      const providerBudget = await this.getProviderBudget();
      
      if (!tenantProfile || !providerBudget) {
        return { optimizationsApplied: [] };
      }

      const optimizations: string[] = [];
      let newSamplingRate = tenantProfile.samplingRate;
      let newBatchingInterval = tenantProfile.batchingInterval;
      let estimatedSavings = 0;

      // Calculate budget utilization
      const budgetUtilization = providerBudget.currentMonthUsage / providerBudget.monthlyTokenLimit;

      // Optimization 1: Increase sampling rate if over budget
      if (this.config.costOptimizationRules.increaseSamplingWhenOverBudget && 
          budgetUtilization > 0.8) {
        const currentRate = tenantProfile.samplingRate;
        newSamplingRate = Math.max(currentRate * 0.7, 0.02); // Reduce to 70%, min 2%
        const tokenReduction = tenantProfile.averageTokensPerEvent * 0.3;
        estimatedSavings += tokenReduction * providerBudget.estimatedCostPerToken;
        optimizations.push(`Increased sampling rate from ${currentRate * 100}% to ${newSamplingRate * 100}%`);
      }

      // Optimization 2: Increase batching interval
      if (this.config.costOptimizationRules.increaseBatchingWhenOverBudget && 
          budgetUtilization > 0.75) {
        newBatchingInterval = Math.min(tenantProfile.batchingInterval * 1.5, 900); // Max 15 minutes
        const batchingReduction = tenantProfile.averageTokensPerEvent * 0.15;
        estimatedSavings += batchingReduction * providerBudget.estimatedCostPerToken;
        optimizations.push(`Increased batching interval to ${newBatchingInterval} seconds`);
      }

      // Optimization 3: Skip low-severity clusters
      if (this.config.costOptimizationRules.skipLowSeverityClusters && 
          budgetUtilization > 0.85) {
        const lowSeverityReduction = tenantProfile.averageTokensPerEvent * 0.25;
        estimatedSavings += lowSeverityReduction * providerBudget.estimatedCostPerToken;
        optimizations.push('Enabled low-severity cluster skipping');
      }

      // Apply optimizations if any were made
      if (optimizations.length > 0) {
        await this.updateTenantOptimizations(tenantId, {
          samplingRate: newSamplingRate,
          batchingInterval: newBatchingInterval,
          lastOptimization: new Date()
        });

        await this.logCostEvent('cost_optimization_applied', {
          tenantId,
          optimizations,
          estimatedSavings,
          budgetUtilization
        });
      }

      return {
        optimizationsApplied: optimizations,
        newSamplingRate,
        newBatchingInterval,
        estimatedSavings
      };

    } catch (error) {
      await this.logCostEvent('cost_optimization_error', { tenantId, error: error.message });
      return { optimizationsApplied: [] };
    }
  }

  // Generate Cost Report
  async generateCostReport(
    timeframe: 'daily' | 'weekly' | 'monthly',
    includePerTenant: boolean = true
  ): Promise<{
    totalTokensUsed: number;
    totalCost: number;
    averageCostPerToken: number;
    modelTierBreakdown: Record<string, { tokens: number; cost: number }>;
    tenantBreakdown?: Record<string, { tokens: number; cost: number; incidents: number }>;
    budgetUtilization: number;
    costTrends: any[];
    recommendations: string[];
  }> {
    try {
      const endDate = new Date();
      const startDate = this.getReportStartDate(timeframe, endDate);
      
      // Get usage records for timeframe
      const usageRecords = await this.getUsageRecords(startDate, endDate);
      
      // Calculate aggregate metrics
      const totalTokensUsed = usageRecords.reduce((sum, record) => sum + record.totalTokens, 0);
      const totalCost = usageRecords.reduce((sum, record) => sum + record.estimatedCost, 0);
      const averageCostPerToken = totalTokensUsed > 0 ? totalCost / totalTokensUsed : 0;
      
      // Model tier breakdown
      const modelTierBreakdown = this.calculateModelTierBreakdown(usageRecords);
      
      // Tenant breakdown (if requested)
      let tenantBreakdown: Record<string, any> | undefined;
      if (includePerTenant) {
        tenantBreakdown = await this.calculateTenantBreakdown(usageRecords);
      }
      
      // Budget utilization
      const providerBudget = await this.getProviderBudget();
      const budgetUtilization = providerBudget ? 
        providerBudget.currentMonthUsage / providerBudget.monthlyTokenLimit : 0;
      
      // Cost trends
      const costTrends = await this.calculateCostTrends(timeframe, startDate, endDate);
      
      // Generate recommendations
      const recommendations = this.generateCostRecommendations(
        budgetUtilization,
        modelTierBreakdown,
        tenantBreakdown
      );

      return {
        totalTokensUsed,
        totalCost,
        averageCostPerToken,
        modelTierBreakdown,
        tenantBreakdown,
        budgetUtilization,
        costTrends,
        recommendations
      };

    } catch (error) {
      await this.logCostEvent('cost_report_error', { error: error.message });
      throw error;
    }
  }

  // Helper Methods
  private async checkTenantLimits(
    tenantId: string,
    estimatedTokens: number,
    profile: TenantCostProfile | null
  ): Promise<{ allowed: boolean; reason?: string; suggestedOptimizations?: string[] }> {
    if (!profile) {
      return { allowed: true }; // New tenant, allow initial usage
    }

    // Check tenant daily limit
    if (profile.dailyTokenUsage + estimatedTokens > this.config.perTenantDailyLimit) {
      return {
        allowed: false,
        reason: 'Tenant daily token limit exceeded',
        suggestedOptimizations: [
          'Increase batching interval for this tenant',
          'Apply more aggressive sampling',
          'Defer non-critical analysis to tomorrow'
        ]
      };
    }

    // Check tenant monthly limit
    if (profile.monthlyTokenUsage + estimatedTokens > this.config.perTenantMonthlyLimit) {
      return {
        allowed: false,
        reason: 'Tenant monthly token limit exceeded',
        suggestedOptimizations: [
          'Apply emergency cost optimization',
          'Switch to rule-based alerts only',
          'Increase sampling rate significantly'
        ]
      };
    }

    return { allowed: true };
  }

  private async checkThrottlingConditions(
    tenantId: string,
    modelTier: TokenUsageRecord['modelTier']
  ): Promise<{ shouldThrottle: boolean; reason?: string; optimizations?: string[] }> {
    if (!this.config.enableDynamicThrottling) {
      return { shouldThrottle: false };
    }

    const providerBudget = await this.getProviderBudget();
    if (!providerBudget) {
      return { shouldThrottle: false };
    }

    // Check budget utilization throttling
    const budgetUtilization = providerBudget.currentMonthUsage / providerBudget.monthlyTokenLimit;
    if (budgetUtilization > this.config.throttleThresholds.budgetUtilization) {
      return {
        shouldThrottle: true,
        reason: 'High budget utilization detected',
        optimizations: [
          'Switch to emergency mode',
          'Apply aggressive cost optimizations',
          'Use rule-based detection only'
        ]
      };
    }

    // Check token velocity throttling
    const currentVelocity = await this.getCurrentTokenVelocity();
    if (currentVelocity > this.config.throttleThresholds.tokenVelocity) {
      return {
        shouldThrottle: true,
        reason: 'High token velocity detected',
        optimizations: [
          'Increase batching intervals',
          'Apply reservoir sampling',
          'Prefer tier A model only'
        ]
      };
    }

    return { shouldThrottle: false };
  }

  private calculateModelTierBreakdown(records: TokenUsageRecord[]): Record<string, { tokens: number; cost: number }> {
    const breakdown: Record<string, { tokens: number; cost: number }> = {};
    
    for (const record of records) {
      if (!breakdown[record.modelTier]) {
        breakdown[record.modelTier] = { tokens: 0, cost: 0 };
      }
      breakdown[record.modelTier].tokens += record.totalTokens;
      breakdown[record.modelTier].cost += record.estimatedCost;
    }
    
    return breakdown;
  }

  private async calculateTenantBreakdown(records: TokenUsageRecord[]): Promise<Record<string, any>> {
    const breakdown: Record<string, { tokens: number; cost: number; incidents: number }> = {};
    
    for (const record of records) {
      if (!breakdown[record.tenantId]) {
        breakdown[record.tenantId] = { tokens: 0, cost: 0, incidents: 0 };
      }
      breakdown[record.tenantId].tokens += record.totalTokens;
      breakdown[record.tenantId].cost += record.estimatedCost;
      if (record.operationType === 'cluster_summary') {
        breakdown[record.tenantId].incidents++;
      }
    }
    
    return breakdown;
  }

  private generateCostRecommendations(
    budgetUtilization: number,
    modelTierBreakdown: Record<string, any>,
    tenantBreakdown?: Record<string, any>
  ): string[] {
    const recommendations: string[] = [];
    
    // Budget utilization recommendations
    if (budgetUtilization > 0.8) {
      recommendations.push('Consider increasing provider budget or applying cost optimizations');
    }
    
    // Model tier recommendations
    const tierBUsage = modelTierBreakdown['tier_b_large'];
    const totalUsage = Object.values(modelTierBreakdown).reduce((sum: number, tier: any) => sum + tier.tokens, 0);
    
    if (tierBUsage && tierBUsage.tokens / totalUsage > 0.3) {
      recommendations.push('Consider tuning escalation criteria to reduce Tier B model usage');
    }
    
    // Tenant-specific recommendations
    if (tenantBreakdown) {
      const tenantCosts = Object.entries(tenantBreakdown).map(([id, data]: [string, any]) => ({
        tenantId: id,
        cost: data.cost
      }));
      
      const highCostTenants = tenantCosts
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 3);
      
      if (highCostTenants.length > 0 && highCostTenants[0].cost > totalUsage * 0.2) {
        recommendations.push(`Consider optimizing costs for high-usage tenants: ${highCostTenants.map(t => t.tenantId).join(', ')}`);
      }
    }
    
    return recommendations;
  }

  // Placeholder methods for database operations
  private async getProviderBudget(): Promise<ProviderBudget | null> {
    // Implementation would fetch from database
    return null;
  }

  private async getTenantCostProfile(tenantId: string): Promise<TenantCostProfile | null> {
    // Implementation would fetch from database
    return null;
  }

  private async getCurrentMinuteUsage(): Promise<number> {
    // Implementation would calculate current minute usage
    return 0;
  }

  private async getCurrentTokenVelocity(): Promise<number> {
    // Implementation would calculate tokens per minute
    return 0;
  }

  private async storeUsageRecord(record: TokenUsageRecord): Promise<void> {
    // Implementation would store in database
  }

  private async updateProviderBudgetCounters(budgetId: string, tokens: number, cost: number): Promise<void> {
    // Implementation would update budget counters
  }

  private async updateTenantCostProfile(tenantId: string, usage: TokenUsageRecord): Promise<TenantCostProfile> {
    // Implementation would update tenant profile
    return {} as TenantCostProfile;
  }

  private async updateTenantOptimizations(tenantId: string, optimizations: any): Promise<void> {
    // Implementation would update tenant optimizations
  }

  private async checkBudgetAlerts(budgetId: string, tenantId: string): Promise<void> {
    // Implementation would check and trigger alerts
  }

  private async getUsageRecords(startDate: Date, endDate: Date): Promise<TokenUsageRecord[]> {
    // Implementation would fetch usage records
    return [];
  }

  private async calculateCostTrends(timeframe: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Implementation would calculate cost trends
    return [];
  }

  private getReportStartDate(timeframe: 'daily' | 'weekly' | 'monthly', endDate: Date): Date {
    const start = new Date(endDate);
    switch (timeframe) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  private async logCostEvent(event: string, details: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: event,
      target: 'cost_control',
      targetId: this.providerId,
      category: 'SYSTEM',
      severity: 'MEDIUM',
      details: {
        ...details,
        providerId: this.providerId
      },
      context: {
        ipAddress: 'system',
        userAgent: 'cost_control_manager',
        sessionId: 'cost_control_session'
      }
    });
  }
}

// Factory Function
export function createCostControlManager(providerId: string, config: CostControlConfig): CostControlManager {
  return new CostControlManager(providerId, config);
}

// Default Cost Control Configuration
export const DEFAULT_COST_CONTROL_CONFIG: CostControlConfig = {
  globalMonthlyLimit: 1000000, // 1M tokens per month
  globalDailyLimit: 50000, // 50K tokens per day
  globalPerMinuteLimit: 2000, // 2K tokens per minute
  perTenantMonthlyLimit: 10000, // 10K tokens per tenant per month
  perTenantDailyLimit: 1000, // 1K tokens per tenant per day
  enableDynamicThrottling: true,
  throttleThresholds: {
    budgetUtilization: 0.85, // 85%
    tokenVelocity: 1500, // tokens per minute
    errorRate: 0.1 // 10%
  },
  costOptimizationRules: {
    increaseSamplingWhenOverBudget: true,
    increaseBatchingWhenOverBudget: true,
    preferTierAModel: true,
    skipLowSeverityClusters: true
  },
  budgetAlerts: {
    warningThreshold: 0.75, // 75%
    criticalThreshold: 0.9, // 90%
    notifyProviderEmail: 'provider@system.com'
  }
};

export type {
  TokenUsageRecord,
  ProviderBudget,
  TenantCostProfile,
  CostControlConfig
};