/**
 * 🤖 AI SERVICE GATEWAY
 * Enterprise-grade AI integration with cost controls, usage tracking, and fallbacks
 */

import OpenAI from "openai";
import { prisma } from "./prisma";

// Use GPT-4o Mini for cost efficiency (15x cheaper than GPT-4)
const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 1000;

// Cost control constants (in credits, where 1000 credits = ~$1)
const COST_LIMITS = {
  LEAD_ANALYSIS: 2000,    // ~$2 per analysis
  RFP_STRATEGY: 3000,     // ~$3 per RFP
  PRICING_ADVICE: 2500,   // ~$2.50 per pricing
  DAILY_ORG_LIMIT: 50000, // ~$50 per org per day
  MONTHLY_ORG_LIMIT: 1500000, // ~$1500 per org per month
} as const;

interface AIUsageTracking {
  orgId: string;
  userId?: string;
  feature: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  creditsUsed: number;
  requestId?: string;
}

interface AIServiceOptions {
  orgId: string;
  userId?: string;
  feature: keyof typeof COST_LIMITS;
  maxCredits?: number;
}

class AIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder')) {
      console.warn('⚠️ OpenAI API key not configured - AI features will use fallbacks');
    }
    
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder'
    });
  }

  /**
   * Check if organization has sufficient AI budget
   */
  async checkBudget(orgId: string, requestedCredits: number): Promise<{
    allowed: boolean;
    reason?: string;
    creditsRemaining: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check daily usage
      const dailyUsage = await prisma.aiUsageEvent.aggregate({
        where: {
          orgId,
          createdAt: { gte: today }
        },
        _sum: { creditsUsed: true }
      });

      const dailyCreditsUsed = dailyUsage._sum.creditsUsed || 0;
      const dailyRemaining = COST_LIMITS.DAILY_ORG_LIMIT - dailyCreditsUsed;

      if (dailyRemaining < requestedCredits) {
        return {
          allowed: false,
          reason: 'Daily AI budget exceeded',
          creditsRemaining: dailyRemaining
        };
      }

      return {
        allowed: true,
        creditsRemaining: dailyRemaining
      };
    } catch (error) {
      console.error('Budget check failed:', error);
      return {
        allowed: false,
        reason: 'Budget check failed',
        creditsRemaining: 0
      };
    }
  }

  /**
   * Track AI usage in database
   */
  private async trackUsage(data: AIUsageTracking): Promise<void> {
    try {
      await prisma.aiUsageEvent.create({
        data: {
          orgId: data.orgId,
          userId: data.userId,
          feature: data.feature,
          model: MODEL,
          tokensIn: data.tokensIn,
          tokensOut: data.tokensOut,
          costUsd: data.costUsd,
          creditsUsed: data.creditsUsed,
          requestId: data.requestId,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to track AI usage:', error);
    }
  }

  /**
   * Calculate cost and credits from token usage
   */
  private calculateCostAndCredits(promptTokens: number, completionTokens: number): {
    costUsd: number;
    creditsUsed: number;
  } {
    // GPT-4o Mini pricing: $0.15/1M input tokens, $0.60/1M output tokens
    const inputCost = (promptTokens / 1000000) * 0.15;
    const outputCost = (completionTokens / 1000000) * 0.60;
    const costUsd = inputCost + outputCost;

    // Convert to credits (1000 credits = $1)
    const creditsUsed = Math.ceil(costUsd * 1000);

    return { costUsd, creditsUsed };
  }

  /**
   * Execute AI operation with cost controls and tracking
   */
  async executeWithControls<T>(
    options: AIServiceOptions,
    operation: () => Promise<OpenAI.Chat.Completions.ChatCompletion>,
    fallbackValue: T
  ): Promise<{
    result: T;
    success: boolean;
    creditsUsed: number;
    fallback: boolean;
    reason?: string;
  }> {
    const { orgId, userId, feature, maxCredits = COST_LIMITS[feature] } = options;

    const requestId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check budget first
    const budgetCheck = await this.checkBudget(orgId, maxCredits);
    if (!budgetCheck.allowed) {
      return {
        result: fallbackValue,
        success: false,
        creditsUsed: 0,
        fallback: true,
        reason: budgetCheck.reason
      };
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder')) {
      return {
        result: fallbackValue,
        success: false,
        creditsUsed: 0,
        fallback: true,
        reason: 'OpenAI API key not configured'
      };
    }

    try {
      const response = await operation();
      const usage = response.usage;
      
      if (!usage) {
        throw new Error('No usage data returned from OpenAI');
      }

      const { costUsd, creditsUsed } = this.calculateCostAndCredits(usage.prompt_tokens, usage.completion_tokens);

      // Parse the response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      let result: T;
      try {
        result = JSON.parse(content) as T;
      } catch {
        // If not JSON, return as string
        result = content as T;
      }

      // Track successful usage
      await this.trackUsage({
        orgId,
        userId,
        feature,
        tokensIn: usage.prompt_tokens,
        tokensOut: usage.completion_tokens,
        costUsd,
        creditsUsed,
        requestId
      });

      return {
        result,
        success: true,
        creditsUsed,
        fallback: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        result: fallbackValue,
        success: false,
        creditsUsed: 0,
        fallback: true,
        reason: errorMessage
      };
    }
  }

  /**
   * Get AI usage statistics for an organization
   */
  async getUsageStats(orgId: string): Promise<{
    dailyUsage: number;
    monthlyUsage: number;
    dailyLimit: number;
    monthlyLimit: number;
    dailyRemaining: number;
    monthlyRemaining: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyStats, monthlyStats] = await Promise.all([
      prisma.aiUsageEvent.aggregate({
        where: { orgId, createdAt: { gte: today } },
        _sum: { creditsUsed: true }
      }),
      prisma.aiUsageEvent.aggregate({
        where: { orgId, createdAt: { gte: monthStart } },
        _sum: { creditsUsed: true }
      })
    ]);

    const dailyUsage = dailyStats._sum.creditsUsed || 0;
    const monthlyUsage = monthlyStats._sum.creditsUsed || 0;

    return {
      dailyUsage,
      monthlyUsage,
      dailyLimit: COST_LIMITS.DAILY_ORG_LIMIT,
      monthlyLimit: COST_LIMITS.MONTHLY_ORG_LIMIT,
      dailyRemaining: Math.max(0, COST_LIMITS.DAILY_ORG_LIMIT - dailyUsage),
      monthlyRemaining: Math.max(0, COST_LIMITS.MONTHLY_ORG_LIMIT - monthlyUsage)
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export { COST_LIMITS };
