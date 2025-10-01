// src/server/services/creditService.ts
// Credit ledger management with 402 gating
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';

export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const PrepaySchema = z.object({
  amountCents: z.number().int().min(100), // Minimum $1.00
  paymentMethod: z.string().optional(),
});

export const DebitSchema = z.object({
  amountCents: z.number().int().min(1),
  description: z.string(),
  relatedId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export interface BalanceResult {
  balanceCents: number;
  lastTransaction?: {
    id: string;
    amountCents: number;
    type: string;
    createdAt: Date;
  };
}

export interface InsufficientCreditsError {
  error: 'INSUFFICIENT_CREDITS';
  requiredCents: number;
  balanceCents: number;
  shortfallCents: number;
  prepayUrl: string;
}

// ===== CREDIT SERVICE =====

export class CreditService {
  /**
   * Get current balance for org (cached for 5 minutes)
   */
  async getBalance(orgId: string): Promise<BalanceResult> {
    // Try cache first (short TTL since balance changes frequently)
    const cacheKey = CacheKeys.creditBalance(orgId);
    const cached = await cache.get<BalanceResult>(cacheKey);
    if (cached) return cached;

    const lastTx = await prisma.creditLedger.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    const result = {
      balanceCents: lastTx?.balanceAfter || 0,
      lastTransaction: lastTx
        ? {
            id: lastTx.id,
            amountCents: lastTx.amountCents,
            type: lastTx.type,
            createdAt: lastTx.createdAt,
          }
        : undefined,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, CacheTTL.SHORT);

    return result;
  }

  /**
   * Check if org has sufficient credits
   * Throws ServiceError with 402 status if insufficient
   */
  async checkSufficient(orgId: string, requiredCents: number): Promise<void> {
    const { balanceCents } = await this.getBalance(orgId);

    if (balanceCents < requiredCents) {
      const shortfall = requiredCents - balanceCents;
      throw new ServiceError(
        'Insufficient credits',
        'INSUFFICIENT_CREDITS',
        402,
        {
          requiredCents,
          balanceCents,
          shortfallCents: shortfall,
          prepayUrl: `/api/tenant/billing/prepay?amount=${Math.ceil(shortfall / 100)}`,
        }
      );
    }
  }

  /**
   * Debit credits (for AI task execution)
   * Returns new balance or throws if insufficient
   */
  async debit(
    orgId: string,
    input: z.infer<typeof DebitSchema>
  ): Promise<BalanceResult> {
    const validated = DebitSchema.parse(input);

    // Check sufficient balance
    await this.checkSufficient(orgId, validated.amountCents);

    // Get current balance
    const { balanceCents: currentBalance } = await this.getBalance(orgId);

    // Create debit transaction
    const tx = await prisma.creditLedger.create({
      data: {
        orgId,
        amountCents: -validated.amountCents, // Negative for debit
        type: 'DEBIT',
        description: validated.description,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - validated.amountCents,
        relatedId: validated.relatedId,
        metadata: validated.metadata || {},
      },
    });

    // Invalidate balance cache
    await cache.delete(CacheKeys.creditBalance(orgId));

    return {
      balanceCents: tx.balanceAfter,
      lastTransaction: {
        id: tx.id,
        amountCents: tx.amountCents,
        type: tx.type,
        createdAt: tx.createdAt,
      },
    };
  }

  /**
   * Add credits (prepay, trial, referral)
   */
  async credit(
    orgId: string,
    amountCents: number,
    type: 'PURCHASE' | 'TRIAL' | 'REFERRAL' | 'REFUND',
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<BalanceResult> {
    const { balanceCents: currentBalance } = await this.getBalance(orgId);

    const tx = await prisma.creditLedger.create({
      data: {
        orgId,
        amountCents, // Positive for credit
        type,
        description,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + amountCents,
        metadata,
      },
    });

    // Invalidate balance cache
    await cache.delete(CacheKeys.creditBalance(orgId));

    return {
      balanceCents: tx.balanceAfter,
      lastTransaction: {
        id: tx.id,
        amountCents: tx.amountCents,
        type: tx.type,
        createdAt: tx.createdAt,
      },
    };
  }

  /**
   * Prepay credits (idempotent)
   */
  async prepay(
    orgId: string,
    userId: string,
    input: z.infer<typeof PrepaySchema>
  ): Promise<BalanceResult> {
    const validated = PrepaySchema.parse(input);

    // TODO: Integrate with payment processor (Stripe)
    // For now, just add credits directly

    const result = await this.credit(
      orgId,
      validated.amountCents,
      'PURCHASE',
      `Prepaid credits: $${(validated.amountCents / 100).toFixed(2)}`,
      { paymentMethod: validated.paymentMethod }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'credits.prepay',
        entityType: 'creditLedger',
        entityId: result.lastTransaction!.id,
        delta: { amountCents: validated.amountCents },
      },
    });

    return result;
  }

  /**
   * Get transaction history
   */
  async getHistory(
    orgId: string,
    options: {
      limit?: number;
      type?: string;
    } = {}
  ) {
    const transactions = await prisma.creditLedger.findMany({
      where: {
        orgId,
        ...(options.type && { type: options.type }),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
    });

    return transactions;
  }

  /**
   * Initialize trial credits
   */
  async initializeTrial(
    orgId: string,
    trialCreditsCents: number = 1000
  ): Promise<BalanceResult> {
    return this.credit(
      orgId,
      trialCreditsCents,
      'TRIAL',
      `Trial credits: $${(trialCreditsCents / 100).toFixed(2)}`
    );
  }
}

export const creditService = new CreditService();

