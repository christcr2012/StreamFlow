/**
 * Cost Guard Middleware
 * 
 * Enforces HTTP 402 Payment Required for AI and SMS features
 * when wallet balance is insufficient
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSufficientBalance, debitWallet } from '@/lib/wallet';

export interface CostGuardConfig {
  feature: 'AI' | 'SMS';
  costCents: number;
  orgId: string;
}

/**
 * Enforce cost guard for a feature
 * 
 * Returns 402 if insufficient balance, otherwise debits wallet and continues
 */
export async function enforceCostGuard(
  config: CostGuardConfig
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const { feature, costCents, orgId } = config;
  
  // Check if sufficient balance
  const hasSufficientBalance = await checkSufficientBalance(orgId, costCents);
  
  if (!hasSufficientBalance) {
    // Return 402 Payment Required
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'PAYMENT_REQUIRED',
          message: `Insufficient wallet balance for ${feature} feature`,
          feature,
          required_cents: costCents,
          topup_url: `/settings/wallet?feature=${feature}&amount=${costCents}`,
        },
        { status: 402 }
      ),
    };
  }
  
  // Debit wallet
  const result = await debitWallet(
    orgId,
    costCents,
    feature,
    `${feature} feature usage`
  );
  
  if (!result.success) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'PAYMENT_FAILED',
          message: result.error || 'Failed to debit wallet',
          feature,
        },
        { status: 500 }
      ),
    };
  }
  
  // Allowed - wallet debited successfully
  return {
    allowed: true,
  };
}

/**
 * AI Cost Guard
 * 
 * Estimates cost based on token usage and enforces payment
 */
export async function enforceAICostGuard(
  orgId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; response?: NextResponse }> {
  // Cost calculation: $0.15 per 1M input tokens (GPT-4o-mini)
  // = 0.000015 cents per token
  const costCents = Math.ceil(estimatedTokens * 0.000015);
  
  return enforceCostGuard({
    feature: 'AI',
    costCents,
    orgId,
  });
}

/**
 * SMS Cost Guard
 * 
 * Enforces payment for SMS sending
 */
export async function enforceSMSCostGuard(
  orgId: string,
  messageCount: number = 1
): Promise<{ allowed: boolean; response?: NextResponse }> {
  // Cost: $0.01 per SMS (typical Twilio pricing)
  const costCents = messageCount * 1;
  
  return enforceCostGuard({
    feature: 'SMS',
    costCents,
    orgId,
  });
}

/**
 * Batch write cost optimization
 * 
 * Batches multiple writes into a single transaction to reduce costs
 */
export class BatchWriter {
  private batch: Array<() => Promise<any>> = [];
  private batchSize: number;
  private flushInterval: number;
  private timer: NodeJS.Timeout | null = null;
  
  constructor(batchSize: number = 100, flushIntervalMs: number = 5000) {
    this.batchSize = batchSize;
    this.flushInterval = flushIntervalMs;
  }
  
  /**
   * Add operation to batch
   */
  add(operation: () => Promise<any>): void {
    this.batch.push(operation);
    
    // Auto-flush if batch size reached
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
    
    // Set timer for auto-flush
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }
  }
  
  /**
   * Flush batch - execute all pending operations
   */
  async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    
    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // Execute all operations in parallel
    const operations = this.batch.splice(0, this.batch.length);
    
    try {
      await Promise.all(operations.map(op => op()));
    } catch (error) {
      console.error('Error flushing batch:', error);
    }
  }
  
  /**
   * Get current batch size
   */
  size(): number {
    return this.batch.length;
  }
}

// Global batch writer for job events
export const jobEventBatchWriter = new BatchWriter(100, 5000);

/**
 * Log job event with batching
 */
export function logJobEvent(
  orgId: string,
  jobId: string,
  event: string,
  metadata?: any
): void {
  jobEventBatchWriter.add(async () => {
    // This would normally write to database
    // For now, just log to console
    console.log('Job event:', { orgId, jobId, event, metadata });
  });
}

