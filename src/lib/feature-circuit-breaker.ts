// src/lib/feature-circuit-breaker.ts
import { prisma as db } from '@/lib/prisma';
import { auditAction } from '@/lib/audit';
import { NextApiRequest } from 'next';

export interface FeatureUsageRequest {
  orgId: string;
  moduleKey: string;
  amount: number;
  costCents: number;
  metadata?: Record<string, any>;
}

export interface CircuitBreakerResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  usageLimit?: number;
  currentSpend?: number;
  budgetLimit?: number;
  remainingBudget?: number;
  utilizationPercentage?: number;
}

/**
 * Enterprise-grade feature circuit breaker with atomic budget enforcement
 */
export class FeatureCircuitBreaker {
  private static instance: FeatureCircuitBreaker;
  private circuitState = new Map<string, { 
    isOpen: boolean; 
    failures: number; 
    lastFailure: number;
    autoRecoveryAt?: number;
  }>();

  static getInstance(): FeatureCircuitBreaker {
    if (!FeatureCircuitBreaker.instance) {
      FeatureCircuitBreaker.instance = new FeatureCircuitBreaker();
    }
    return FeatureCircuitBreaker.instance;
  }

  /**
   * Main entry point for feature usage with atomic budget enforcement
   */
  async requestFeatureUsage(
    request: FeatureUsageRequest,
    req?: NextApiRequest
  ): Promise<CircuitBreakerResult> {
    const circuitKey = `${request.orgId}_${request.moduleKey}`;

    // Check circuit breaker state first
    if (this.isCircuitOpen(circuitKey)) {
      return {
        allowed: false,
        reason: 'Feature temporarily disabled due to budget limits',
      };
    }

    try {
      // Atomic transaction for budget enforcement
      const result = await db.$transaction(async (tx) => {
        // 1. Get feature module configuration
        const module = await tx.featureModule.findFirst({
          where: {
            orgId: request.orgId,
            moduleKey: request.moduleKey,
            enabled: true,
          },
        });

        if (!module) {
          return {
            allowed: false,
            reason: 'Feature module not found or disabled',
          };
        }

        // 2. Get organization budget
        const budget = await tx.organizationBudget.findUnique({
          where: { orgId: request.orgId },
        });

        if (!budget) {
          return {
            allowed: false,
            reason: 'Organization budget not configured',
          };
        }

        // 3. Calculate current month's usage
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const [moduleUsage, totalSpend] = await Promise.all([
          // Module-specific usage
          tx.featureUsage.aggregate({
            where: {
              moduleId: module.id,
              createdAt: { gte: currentMonthStart },
            },
            _sum: { amount: true, costCents: true },
          }),
          // Organization total spend
          tx.featureUsage.aggregate({
            where: {
              orgId: request.orgId,
              createdAt: { gte: currentMonthStart },
            },
            _sum: { costCents: true },
          }),
        ]);

        const currentUsage = moduleUsage._sum.amount || 0;
        const currentModuleCost = moduleUsage._sum.costCents || 0;
        const currentTotalSpend = totalSpend._sum.costCents || 0;

        // 4. Check usage limits
        if (module.usageLimit && currentUsage + request.amount > module.usageLimit) {
          this.openCircuit(circuitKey, 'Usage limit exceeded');
          return {
            allowed: false,
            reason: `Usage limit exceeded. Current: ${currentUsage}, Limit: ${module.usageLimit}`,
            currentUsage,
            usageLimit: module.usageLimit,
          };
        }

        // 5. Check module budget limits
        if (module.monthlyBudget && currentModuleCost + request.costCents > module.monthlyBudget) {
          this.openCircuit(circuitKey, 'Module budget exceeded');
          return {
            allowed: false,
            reason: `Module budget exceeded. Current: $${(currentModuleCost / 100).toFixed(2)}, Limit: $${(module.monthlyBudget / 100).toFixed(2)}`,
            currentSpend: currentModuleCost,
            budgetLimit: module.monthlyBudget,
          };
        }

        // 6. Check organization budget limits
        const projectedSpend = currentTotalSpend + request.costCents;
        const utilizationPercentage = (projectedSpend / budget.monthlyLimitCents) * 100;

        if (projectedSpend > budget.monthlyLimitCents) {
          this.openCircuit(circuitKey, 'Organization budget exceeded');
          
          // Auto-disable feature if configured
          if (budget.autoDisable) {
            await tx.featureModule.update({
              where: { id: module.id },
              data: { enabled: false },
            });
          }

          return {
            allowed: false,
            reason: `Organization budget exceeded. Projected: $${(projectedSpend / 100).toFixed(2)}, Limit: $${(budget.monthlyLimitCents / 100).toFixed(2)}`,
            currentSpend: currentTotalSpend,
            budgetLimit: budget.monthlyLimitCents,
            utilizationPercentage,
          };
        }

        // 7. Check alert thresholds
        if (utilizationPercentage >= budget.alertThreshold) {
          // Would trigger alerts in production
          console.warn(`Budget alert: ${utilizationPercentage.toFixed(1)}% utilization for org ${request.orgId}`);
        }

        // 8. Record the usage atomically
        await tx.featureUsage.create({
          data: {
            orgId: request.orgId,
            moduleId: module.id,
            amount: request.amount,
            costCents: request.costCents,
            metadata: request.metadata || {},
          },
        });

        // 9. Update budget current spend
        await tx.organizationBudget.update({
          where: { orgId: request.orgId },
          data: { currentSpendCents: projectedSpend },
        });

        // Success - reset circuit breaker failures
        this.resetCircuit(circuitKey);

        return {
          allowed: true,
          currentUsage: currentUsage + request.amount,
          usageLimit: module.usageLimit,
          currentSpend: projectedSpend,
          budgetLimit: budget.monthlyLimitCents,
          remainingBudget: budget.monthlyLimitCents - projectedSpend,
          utilizationPercentage,
        };
      });

      // Audit successful usage
      if (result.allowed && req) {
        await auditAction(req, {
          action: 'feature_usage_granted',
          target: 'feature_module',
          targetId: request.moduleKey,
          category: 'ADMIN_ACTION',
          details: {
            moduleKey: request.moduleKey,
            amount: request.amount,
            costCents: request.costCents,
            utilizationPercentage: result.utilizationPercentage,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Feature circuit breaker error:', error);
      
      // Record failure and potentially open circuit
      this.recordFailure(circuitKey);
      
      // Audit failure
      if (req) {
        await auditAction(req, {
          action: 'feature_usage_error',
          target: 'feature_module',
          targetId: request.moduleKey,
          category: 'SECURITY_EVENT',
          severity: 'ERROR',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          details: { moduleKey: request.moduleKey, amount: request.amount },
        });
      }

      // Fail secure - deny usage on errors
      return {
        allowed: false,
        reason: 'Feature usage system error - access denied for security',
      };
    }
  }

  /**
   * Check if feature is available without consuming usage
   */
  async checkFeatureAvailability(
    orgId: string,
    moduleKey: string
  ): Promise<CircuitBreakerResult> {
    const circuitKey = `${orgId}_${moduleKey}`;

    if (this.isCircuitOpen(circuitKey)) {
      return {
        allowed: false,
        reason: 'Feature temporarily disabled due to budget limits',
      };
    }

    try {
      const module = await db.featureModule.findFirst({
        where: { orgId, moduleKey, enabled: true },
      });

      if (!module) {
        return {
          allowed: false,
          reason: 'Feature module not found or disabled',
        };
      }

      const budget = await db.organizationBudget.findUnique({
        where: { orgId },
      });

      if (!budget) {
        return {
          allowed: false,
          reason: 'Organization budget not configured',
        };
      }

      // Get current usage without modifying anything
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      const totalSpend = await db.featureUsage.aggregate({
        where: {
          orgId,
          createdAt: { gte: currentMonthStart },
        },
        _sum: { costCents: true },
      });

      const currentSpend = totalSpend._sum.costCents || 0;
      const utilizationPercentage = (currentSpend / budget.monthlyLimitCents) * 100;

      return {
        allowed: currentSpend < budget.monthlyLimitCents,
        currentSpend,
        budgetLimit: budget.monthlyLimitCents,
        remainingBudget: budget.monthlyLimitCents - currentSpend,
        utilizationPercentage,
      };
    } catch (error) {
      console.error('Feature availability check error:', error);
      return {
        allowed: false,
        reason: 'Feature availability check failed',
      };
    }
  }

  /**
   * Circuit breaker state management
   */
  private isCircuitOpen(circuitKey: string): boolean {
    const circuit = this.circuitState.get(circuitKey);
    if (!circuit) return false;

    // Check if auto-recovery time has passed
    if (circuit.autoRecoveryAt && Date.now() > circuit.autoRecoveryAt) {
      this.resetCircuit(circuitKey);
      return false;
    }

    return circuit.isOpen;
  }

  private openCircuit(circuitKey: string, reason: string): void {
    const now = Date.now();
    this.circuitState.set(circuitKey, {
      isOpen: true,
      failures: 0,
      lastFailure: now,
      autoRecoveryAt: now + (5 * 60 * 1000), // 5 minutes recovery time
    });
    console.warn(`Circuit breaker opened for ${circuitKey}: ${reason}`);
  }

  private recordFailure(circuitKey: string): void {
    const circuit = this.circuitState.get(circuitKey) || { 
      isOpen: false, 
      failures: 0, 
      lastFailure: 0 
    };
    
    circuit.failures++;
    circuit.lastFailure = Date.now();

    // Open circuit after 3 failures in 5 minutes
    if (circuit.failures >= 3 && 
        Date.now() - circuit.lastFailure < 5 * 60 * 1000) {
      this.openCircuit(circuitKey, 'Multiple failures detected');
    } else {
      this.circuitState.set(circuitKey, circuit);
    }
  }

  private resetCircuit(circuitKey: string): void {
    this.circuitState.delete(circuitKey);
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    for (const [key, circuit] of this.circuitState) {
      status[key] = {
        isOpen: circuit.isOpen,
        failures: circuit.failures,
        lastFailure: new Date(circuit.lastFailure).toISOString(),
        autoRecoveryAt: circuit.autoRecoveryAt ? new Date(circuit.autoRecoveryAt).toISOString() : null,
      };
    }
    return status;
  }
}

/**
 * Convenience function for feature usage with built-in circuit breaker
 */
export async function useFeature(
  orgId: string,
  moduleKey: string,
  amount: number = 1,
  costCents: number,
  metadata?: Record<string, any>,
  req?: NextApiRequest
): Promise<CircuitBreakerResult> {
  const circuitBreaker = FeatureCircuitBreaker.getInstance();
  return circuitBreaker.requestFeatureUsage({
    orgId,
    moduleKey,
    amount,
    costCents,
    metadata,
  }, req);
}

/**
 * Check if feature is available without consuming usage
 */
export async function checkFeature(
  orgId: string,
  moduleKey: string
): Promise<CircuitBreakerResult> {
  const circuitBreaker = FeatureCircuitBreaker.getInstance();
  return circuitBreaker.checkFeatureAvailability(orgId, moduleKey);
}