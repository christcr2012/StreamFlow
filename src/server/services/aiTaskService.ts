// src/server/services/aiTaskService.ts
// AI task execution and logging with credit gating
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';
import { aiPowerService, PowerLevelType } from './aiPowerService';
import { creditService } from './creditService';
import { usageMeterService } from './usageMeterService';

export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const ExecuteAiTaskSchema = z.object({
  agentType: z.string(), // inbox, estimate, scheduling, etc.
  actionType: z.string(), // inbound_parse, reply_draft, etc.
  powerBoost: z.enum(['ECO', 'STANDARD', 'MAX']).optional(),
  preview: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

export interface AiTaskResult {
  taskId: string;
  status: 'success' | 'error' | 'preview';
  effectivePower: PowerLevelType;
  tokensIn: number;
  tokensOut: number;
  rawCostCents: number;
  priceCents: number;
  balanceAfter?: number;
  result?: any;
  error?: string;
}

// ===== AI TASK SERVICE =====

export class AiTaskService {
  /**
   * Execute AI task with credit gating
   */
  async execute(
    orgId: string,
    userId: string,
    userRole: string,
    input: z.infer<typeof ExecuteAiTaskSchema>
  ): Promise<AiTaskResult> {
    const validated = ExecuteAiTaskSchema.parse(input);

    // Resolve effective power level
    const powerResult = await aiPowerService.resolveEffectivePower(
      orgId,
      userRole,
      {
        boost: validated.powerBoost,
        overrideKey: `${validated.agentType}.${validated.actionType}`,
      }
    );

    // Preview mode: return cost estimate without execution
    if (validated.preview) {
      return {
        taskId: 'preview',
        status: 'preview',
        effectivePower: powerResult.effectivePower,
        tokensIn: 0,
        tokensOut: 0,
        rawCostCents: powerResult.estCreditsCents,
        priceCents: powerResult.estCreditsCents,
      };
    }

    // Check credits before execution (402 gating)
    await creditService.checkSufficient(orgId, powerResult.estCreditsCents);

    // Execute AI task (mock for now)
    const executionResult = await this.executeAiCall(
      validated.agentType,
      validated.actionType,
      powerResult.effectivePower,
      validated.metadata
    );

    // Calculate actual cost
    const rawCostCents = this.calculateRawCost(
      executionResult.tokensIn,
      executionResult.tokensOut
    );
    const priceCents = aiPowerService.calculatePrice(
      rawCostCents,
      powerResult.effectivePower
    );

    // Debit credits
    const balanceResult = await creditService.debit(orgId, {
      amountCents: priceCents,
      description: `AI: ${validated.agentType}.${validated.actionType}`,
      metadata: {
        agentType: validated.agentType,
        actionType: validated.actionType,
        powerLevel: powerResult.effectivePower,
      },
    });

    // Log task
    const task = await prisma.aiTask.create({
      data: {
        orgId,
        userId,
        agentType: validated.agentType,
        actionType: validated.actionType,
        role: userRole,
        powerLevel: powerResult.effectivePower,
        tokensIn: executionResult.tokensIn,
        tokensOut: executionResult.tokensOut,
        rawCostCents,
        priceCents,
        status: executionResult.success ? 'success' : 'error',
        errorCode: executionResult.error,
        metadata: validated.metadata || {},
      },
    });

    // Record usage meter
    await usageMeterService.recordAiTokens(
      orgId,
      executionResult.tokensIn + executionResult.tokensOut,
      powerResult.effectivePower,
      {
        taskId: task.id,
        agentType: validated.agentType,
        actionType: validated.actionType,
      }
    );

    return {
      taskId: task.id,
      status: task.status as 'success' | 'error',
      effectivePower: powerResult.effectivePower,
      tokensIn: task.tokensIn,
      tokensOut: task.tokensOut,
      rawCostCents,
      priceCents,
      balanceAfter: balanceResult.balanceCents,
      result: executionResult.result,
      error: executionResult.error,
    };
  }

  /**
   * Mock AI execution (replace with actual AI API calls)
   */
  private async executeAiCall(
    agentType: string,
    actionType: string,
    powerLevel: PowerLevelType,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    tokensIn: number;
    tokensOut: number;
    result?: any;
    error?: string;
  }> {
    // TODO: Replace with actual AI API calls (OpenAI, Anthropic, etc.)
    
    // Mock execution based on power level
    const baseTokens = 100;
    const multiplier = powerLevel === 'ECO' ? 1 : powerLevel === 'STANDARD' ? 2 : 5;

    return {
      success: true,
      tokensIn: baseTokens,
      tokensOut: baseTokens * multiplier,
      result: {
        agentType,
        actionType,
        powerLevel,
        message: `Mock AI result for ${agentType}.${actionType} at ${powerLevel} power`,
      },
    };
  }

  /**
   * Calculate raw cost from tokens
   * Using rough OpenAI pricing: $0.01 per 1K tokens
   */
  private calculateRawCost(tokensIn: number, tokensOut: number): number {
    const totalTokens = tokensIn + tokensOut;
    return Math.ceil((totalTokens / 1000) * 1); // 1 cent per 1K tokens
  }

  /**
   * Get task history
   */
  async getHistory(
    orgId: string,
    options: {
      userId?: string;
      agentType?: string;
      status?: string;
      limit?: number;
    } = {}
  ) {
    const tasks = await prisma.aiTask.findMany({
      where: {
        orgId,
        ...(options.userId && { userId: options.userId }),
        ...(options.agentType && { agentType: options.agentType }),
        ...(options.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
    });

    return tasks;
  }

  /**
   * Get usage analytics
   */
  async getAnalytics(orgId: string, periodDays: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const tasks = await prisma.aiTask.findMany({
      where: {
        orgId,
        createdAt: { gte: since },
      },
    });

    const totalTasks = tasks.length;
    const successTasks = tasks.filter(t => t.status === 'success').length;
    const totalCostCents = tasks.reduce((sum, t) => sum + t.priceCents, 0);
    const totalTokens = tasks.reduce((sum, t) => sum + t.tokensIn + t.tokensOut, 0);

    const byAgent = tasks.reduce((acc, t) => {
      acc[t.agentType] = (acc[t.agentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPower = tasks.reduce((acc, t) => {
      acc[t.powerLevel] = (acc[t.powerLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      periodDays,
      totalTasks,
      successTasks,
      successRate: totalTasks > 0 ? (successTasks / totalTasks) * 100 : 0,
      totalCostCents,
      totalTokens,
      avgCostPerTask: totalTasks > 0 ? totalCostCents / totalTasks : 0,
      byAgent,
      byPower,
    };
  }
}

export const aiTaskService = new AiTaskService();

