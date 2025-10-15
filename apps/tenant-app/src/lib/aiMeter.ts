// AI Metering & Cost Control System
// Wraps all AI calls with usage tracking, budget enforcement, and credit management
// Provides hard $50/month limit with graceful fallbacks

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

// Temporary type extensions until TypeScript server catches up
type OrgWithAI = {
  aiCreditBalance: number;
  aiMonthlyBudgetCents: number;
  aiPlan: 'BASE' | 'PRO' | 'ELITE';
};

// CLIENT-FACING CREDIT SYSTEM: 1 credit = $0.05 (50x markup from provider cost)
// Provider costs stay under $50/month while clients see value-based pricing
// Each conversion worth $100, so credit costs reflect lead generation value
const CREDIT_RATES = {
  'gpt-4o-mini': {
    input: 7.5,     // $0.15 per 1M tokens = 7.5 credits per 1M tokens = 0.0075 credits per 1k tokens  
    output: 30,     // $0.60 per 1M tokens = 30 credits per 1M tokens = 0.03 credits per 1k tokens
  }
} as const;

// Convert budget from cents to credits: $50 (5000 cents) = 1,000 credits at $0.05/credit
function convertBudgetCentsToCredits(cents: number): number {
  return cents / 5; // 1 credit = $0.05, so 5000 cents / 5 = 1000 credits
}

export interface AiMeterOptions {
  feature: string;           // 'lead_analysis', 'rfp_strategy', 'pricing', 'response_gen'
  orgId: string;
  userId?: string;
  maxCredits?: number;       // Override default per-call limit (default: 50 credits)
  fallbackValue?: any;       // Return this if budget exceeded
}

export interface AiUsageResult<T> {
  success: boolean;
  result?: T;
  fallback?: any;
  reason?: string;
  creditsUsed: number;
  tokensUsed: { input: number; output: number };
}

/**
 * Check if organization has sufficient AI budget for the requested operation
 * Returns true if within budget, false if exceeded with optional fallback
 */
export async function checkAiBudget(
  orgId: string, 
  feature: string, 
  estimatedCredits: number = 50
): Promise<{ allowed: boolean; reason?: string; creditsRemaining: number }> {
  try {
    const org = await prisma.org.findUnique({
      where: { id: orgId }
    }) as any;

    if (!org) {
      return { allowed: false, reason: 'Organization not found', creditsRemaining: 0 };
    }

    // Check credit balance
    if (org.aiCreditBalance < estimatedCredits) {
      return { 
        allowed: false, 
        reason: 'Insufficient credits - time to upgrade or top up!', 
        creditsRemaining: org.aiCreditBalance 
      };
    }

    // Check monthly budget (current month)
    const monthKey = new Date().toISOString().slice(0, 7); // "2025-01"
    const monthlyUsage = await prisma.aiMonthlySummary.findUnique({
      where: { 
        orgId_monthKey: { orgId, monthKey }
      },
      select: { creditsUsed: true }
    });

    const creditsUsedThisMonth = monthlyUsage?.creditsUsed || 0;
    const budgetCredits = convertBudgetCentsToCredits(org.aiMonthlyBudgetCents); // 5000 cents = 1,000 credits
    
    if (creditsUsedThisMonth + estimatedCredits > budgetCredits) {
      return {
        allowed: false,
        reason: 'Monthly budget reached - resets next month',
        creditsRemaining: Math.max(0, budgetCredits - creditsUsedThisMonth)
      };
    }

    return { 
      allowed: true, 
      creditsRemaining: Math.min(
        org.aiCreditBalance,
        budgetCredits - creditsUsedThisMonth
      )
    };

  } catch (error) {
    console.error('Budget check failed:', error);
    return { allowed: false, reason: 'Budget check failed', creditsRemaining: 0 };
  }
}

/**
 * Meter and track an AI operation with automatic cost control
 * Wraps any AI function call with usage tracking and budget enforcement
 */
export async function aiMeter<T>(
  options: AiMeterOptions,
  aiOperation: () => Promise<{ 
    result: T; 
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  }>
): Promise<AiUsageResult<T>> {
  const { feature, orgId, userId, maxCredits = 50, fallbackValue } = options;
  const requestId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Pre-flight budget check
    const budgetCheck = await checkAiBudget(orgId, feature, maxCredits);
    
    if (!budgetCheck.allowed) {
      return {
        success: false,
        fallback: fallbackValue,
        reason: budgetCheck.reason,
        creditsUsed: 0,
        tokensUsed: { input: 0, output: 0 }
      };
    }

    // Execute the AI operation
    const startTime = Date.now();
    const { result, usage } = await aiOperation();
    const duration = Date.now() - startTime;

    // Calculate costs and credits from REAL OpenAI usage data
    const tokensIn = usage.prompt_tokens;
    const tokensOut = usage.completion_tokens;
    const model = 'gpt-4o-mini';
    
    const rates = CREDIT_RATES[model];
    const creditsUsed = Math.ceil(
      (tokensIn * rates.input / 1000) + (tokensOut * rates.output / 1000)
    );
    
    const costUsd = (tokensIn * 0.00015 / 1000) + (tokensOut * 0.0006 / 1000);

    // ATOMIC TRANSACTION: Ensure budget enforcement and accounting consistency
    const monthKey = new Date().toISOString().slice(0, 7);
    
    await prisma.$transaction(async (tx) => {
      // ATOMIC CHECKS: Re-verify both credit balance AND monthly budget within transaction
      const currentOrg = await tx.org.findUnique({
        where: { id: orgId },
        select: { aiCreditBalance: true, aiMonthlyBudgetCents: true }
      }) as any;
      
      if (!currentOrg) {
        throw new Error('Organization not found during transaction');
      }
      
      // Check credit balance
      if (currentOrg.aiCreditBalance < creditsUsed) {
        throw new Error('Insufficient credits during transaction');
      }
      
      // Atomic monthly budget enforcement - ensure monthly summary exists first
      const monthlyBudgetCredits = convertBudgetCentsToCredits(currentOrg.aiMonthlyBudgetCents);
      
      // Ensure monthly summary record exists (create if missing)
      await (tx as any).aiMonthlySummary.upsert({
        where: { orgId_monthKey: { orgId, monthKey } },
        update: {}, // No-op update to ensure record exists
        create: {
          orgId,
          monthKey,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
          creditsUsed: 0,
          callCount: 0
        }
      });
      
      // Record usage event
      await (tx as any).aiUsageEvent.create({
        data: {
          orgId,
          userId,
          feature,
          model,
          tokensIn,
          tokensOut,
          costUsd,
          creditsUsed,
          requestId
        }
      });

      // Update organization credit balance with conditional update to prevent race conditions
      const updateResult = await tx.org.updateMany({
        where: { 
          id: orgId,
          aiCreditBalance: { gte: creditsUsed } // Only update if sufficient balance
        },
        data: {
          aiCreditBalance: { decrement: creditsUsed }
        } as any
      });
      
      if (updateResult.count === 0) {
        throw new Error('Credit balance insufficient during atomic update - race condition prevented');
      }

      // ATOMIC monthly budget enforcement - conditional update that prevents exceeding $50 limit
      const monthlyUpdateResult = await (tx as any).aiMonthlySummary.updateMany({
        where: {
          orgId_monthKey: { orgId, monthKey },
          creditsUsed: { lte: monthlyBudgetCredits - creditsUsed } // Only update if won't exceed budget
        },
        data: {
          tokensIn: { increment: tokensIn },
          tokensOut: { increment: tokensOut },
          costUsd: { increment: costUsd },
          creditsUsed: { increment: creditsUsed },
          callCount: { increment: 1 }
        }
      });
      
      if (monthlyUpdateResult.count === 0) {
        throw new Error('Monthly budget exceeded - hard $50 limit enforced atomically');
      }
    });

    console.log(`AI Call Success: ${feature} | Credits: ${creditsUsed} | Duration: ${duration}ms`);

    return {
      success: true,
      result,
      creditsUsed,
      tokensUsed: { input: tokensIn, output: tokensOut }
    };

  } catch (error) {
    console.error(`AI Call Failed: ${feature}`, error);
    
    return {
      success: false,
      fallback: fallbackValue,
      reason: error instanceof Error ? error.message : 'AI operation failed',
      creditsUsed: 0,
      tokensUsed: { input: 0, output: 0 }
    };
  }
}

/**
 * Get current month's AI usage for an organization
 * Used for dashboard displays and budget monitoring
 */
export async function getAiUsage(orgId: string) {
  try {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { 
        aiCreditBalance: true, 
        aiMonthlyBudgetCents: true,
        aiPlan: true 
      }
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const monthKey = new Date().toISOString().slice(0, 7);
    const monthlyUsage = await prisma.aiMonthlySummary.findUnique({
      where: { 
        orgId_monthKey: { orgId, monthKey }
      }
    });

    const creditsUsed = monthlyUsage?.creditsUsed || 0;
    const budgetCredits = convertBudgetCentsToCredits(org.aiMonthlyBudgetCents);
    const percentUsed = Math.min(100, (creditsUsed / budgetCredits) * 100);

    return {
      creditsRemaining: org.aiCreditBalance,
      creditsUsedThisMonth: creditsUsed,
      monthlyBudgetCredits: budgetCredits,
      percentUsed: Math.round(percentUsed),
      plan: org.aiPlan,
      monthKey,
      // Alerts for different usage levels
      alerts: {
        warning: percentUsed >= 75,    // 75% of monthly budget
        critical: percentUsed >= 90,   // 90% of monthly budget  
        exhausted: percentUsed >= 100  // Budget completely used
      }
    };
  } catch (error) {
    console.error('Failed to get AI usage:', error);
    throw error;
  }
}