/**
 * ULAP Service (Usage-Based Licensing & Pricing)
 * Binder3: Monetization & Rate Limiting
 * 
 * Handles credit management, usage tracking, and client-pays-first enforcement
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface CreditBalance {
  orgId: string;
  key: string;
  balanceCents: bigint;
}

export interface UsageEvent {
  orgId: string;
  key: string;
  quantity: bigint;
  costCents: bigint;
  context?: Record<string, unknown>;
}

export interface PricingInfo {
  key: string;
  listPriceCents: bigint;
  adoptionDiscountEligible: boolean;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ULAPService {
  /**
   * Check if tenant has sufficient credits for an action
   * Returns true if sufficient, false otherwise
   */
  async checkCredits(
    orgId: string,
    key: string,
    requiredCents: bigint
  ): Promise<boolean> {
    const balance = await this.getBalance(orgId, key);
    return balance >= requiredCents;
  }

  /**
   * Get current credit balance for a meter key
   */
  async getBalance(orgId: string, key: string): Promise<bigint> {
    const entries = await prisma.creditsLedgerEntry.findMany({
      where: { orgId, key },
      select: { deltaCents: true },
    });

    let balance = BigInt(0);
    for (const entry of entries) {
      balance += entry.deltaCents;
    }

    return balance;
  }

  /**
   * Add credits to tenant account
   */
  async addCredits(
    orgId: string,
    key: string,
    amountCents: bigint,
    reason: string
  ): Promise<void> {
    await prisma.creditsLedgerEntry.create({
      data: {
        orgId,
        key,
        deltaCents: amountCents,
        reason,
      },
    });
  }

  /**
   * Deduct credits from tenant account
   * Throws error if insufficient credits
   */
  async deductCredits(
    orgId: string,
    key: string,
    amountCents: bigint,
    reason: string
  ): Promise<void> {
    const balance = await this.getBalance(orgId, key);

    if (balance < amountCents) {
      throw new Error(
        `Insufficient credits. Required: ${amountCents}, Available: ${balance}`
      );
    }

    await prisma.creditsLedgerEntry.create({
      data: {
        orgId,
        key,
        deltaCents: -amountCents,
        reason,
      },
    });
  }

  /**
   * Log usage event
   */
  async logUsage(event: UsageEvent): Promise<void> {
    await prisma.usageLedgerEntry.create({
      data: {
        orgId: event.orgId,
        key: event.key,
        quantity: event.quantity,
        costCents: event.costCents,
        context: (event.context ?? {}) as any,
      },
    });
  }

  /**
   * Get usage history for a tenant
   */
  async getUsageHistory(
    orgId: string,
    options: {
      key?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    const { key, startDate, endDate, limit = 100, offset = 0 } = options;

    const entries = await prisma.usageLedgerEntry.findMany({
      where: {
        orgId,
        ...(key && { key }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return entries;
  }

  /**
   * Get pricing for a meter key
   */
  async getPrice(key: string, orgId?: string): Promise<PricingInfo | null> {
    // Check for org-specific pricing first
    if (orgId) {
      const orgPrice = await prisma.pricingCatalogItem.findFirst({
        where: { orgId, key },
      });

      if (orgPrice) {
        return {
          key: orgPrice.key,
          listPriceCents: orgPrice.listPriceCents,
          adoptionDiscountEligible: orgPrice.adoptionDiscountEligible,
        };
      }
    }

    // Fall back to global pricing
    const globalPrice = await prisma.pricingCatalogItem.findUnique({
      where: { key },
    });

    if (!globalPrice) {
      return null;
    }

    return {
      key: globalPrice.key,
      listPriceCents: globalPrice.listPriceCents,
      adoptionDiscountEligible: globalPrice.adoptionDiscountEligible,
    };
  }

  /**
   * Calculate cost for usage
   */
  async calculateCost(
    key: string,
    quantity: bigint,
    orgId?: string
  ): Promise<bigint> {
    const pricing = await this.getPrice(key, orgId);

    if (!pricing) {
      throw new Error(`No pricing found for key: ${key}`);
    }

    // Simple calculation: quantity * price
    // In production, this could include tiered pricing, volume discounts, etc.
    return quantity * pricing.listPriceCents;
  }

  /**
   * Apply adoption discount
   * Discount increases by 10% per 10 active tenants, capped at 70%
   */
  async applyAdoptionDiscount(
    basePriceCents: bigint,
    adoptionDiscountEligible: boolean
  ): Promise<bigint> {
    if (!adoptionDiscountEligible) {
      return basePriceCents;
    }

    // Count active tenants (simplified - in production, use proper metrics)
    const activeTenantCount = await prisma.org.count({
      where: {
        // Add criteria for "active" tenants
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Active in last 90 days
        },
      },
    });

    // Calculate discount: 10% per 10 tenants, capped at 70%
    const discountPercent = Math.min(Math.floor(activeTenantCount / 10) * 10, 70);
    const discountMultiplier = BigInt(100 - discountPercent);

    return (basePriceCents * discountMultiplier) / BigInt(100);
  }

  /**
   * Check and enforce client-pays-first
   * Returns { allowed: boolean, prepayUrl?: string }
   */
  async enforceClientPaysFirst(
    orgId: string,
    key: string,
    requiredCents: bigint
  ): Promise<{ allowed: boolean; prepayUrl?: string }> {
    const hasCredits = await this.checkCredits(orgId, key, requiredCents);

    if (hasCredits) {
      return { allowed: true };
    }

    // Generate prepay URL
    const prepayUrl = `/tenant/billing/prepay?key=${key}&amount=${requiredCents}`;

    return {
      allowed: false,
      prepayUrl,
    };
  }

  /**
   * Get all balances for a tenant
   */
  async getAllBalances(orgId: string): Promise<Record<string, bigint>> {
    const entries = await prisma.creditsLedgerEntry.findMany({
      where: { orgId },
      select: { key: true, deltaCents: true },
    });

    const balances: Record<string, bigint> = {};

    for (const entry of entries) {
      if (!balances[entry.key]) {
        balances[entry.key] = BigInt(0);
      }
      balances[entry.key] += entry.deltaCents;
    }

    return balances;
  }
}

export const ulapService = new ULAPService();

