/**
 * Database-backed wallet store using Prisma
 * Replaces in-memory implementation for production use
 */

import type { WalletBalance, WalletTransaction, WalletStore } from './index';

// Generic Prisma client interface to avoid direct dependency
export interface PrismaClient {
  org: {
    findUnique(args: { where: { id: string }; select?: any }): Promise<any>;
    update(args: { where: { id: string }; data: any }): Promise<any>;
  };
  billingLedger: {
    create(args: { data: any }): Promise<any>;
    findMany(args: { where: any; orderBy?: any }): Promise<any[]>;
  };
}

export class PrismaWalletStore implements WalletStore {
  constructor(private prisma: PrismaClient) {}

  async getBalance(orgId: string): Promise<WalletBalance | null> {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      select: { aiCreditBalance: true, updatedAt: true },
    });

    if (!org) {
      return null;
    }

    return {
      orgId,
      balanceCents: org.aiCreditBalance,
      updatedAt: org.updatedAt,
    };
  }

  async recordTransaction(
    tx: Omit<WalletTransaction, 'id' | 'createdAt'>
  ): Promise<WalletTransaction> {
    const ledgerEntry = await this.prisma.billingLedger.create({
      data: {
        orgId: tx.orgId,
        type: tx.amountCents > 0 ? 'CREDIT' : 'DEBIT',
        amount: Math.abs(tx.amountCents) / 100, // Convert cents to dollars
        meta: {
          memo: tx.memo,
          amountCents: tx.amountCents,
        },
      },
    });

    return {
      id: ledgerEntry.id,
      orgId: tx.orgId,
      amountCents: tx.amountCents,
      memo: tx.memo,
      createdAt: ledgerEntry.createdAt,
    };
  }

  async updateBalance(orgId: string, newBalanceCents: number): Promise<void> {
    await this.prisma.org.update({
      where: { id: orgId },
      data: { aiCreditBalance: newBalanceCents },
    });
  }

  /**
   * Get transaction history for an org
   */
  async getTransactions(orgId: string): Promise<WalletTransaction[]> {
    const ledgerEntries = await this.prisma.billingLedger.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    return ledgerEntries.map((entry: any) => ({
      id: entry.id,
      orgId: entry.orgId,
      amountCents: entry.meta?.amountCents || (entry.type === 'CREDIT' ? 1 : -1) * Math.round(Number(entry.amount) * 100),
      memo: entry.meta?.memo,
      createdAt: entry.createdAt,
    }));
  }
}

