// packages/wallet - Wallet balance and transaction management

export type WalletBalance = {
  orgId: string;
  balanceCents: number;
  updatedAt: Date;
};

export type WalletTransaction = {
  id: string;
  orgId: string;
  amountCents: number; // positive: credit, negative: debit
  memo?: string;
  createdAt: Date;
};

export type WalletStore = {
  getBalance(orgId: string): Promise<WalletBalance | null>;
  recordTransaction(tx: Omit<WalletTransaction, 'id' | 'createdAt'>): Promise<WalletTransaction>;
  updateBalance(orgId: string, newBalanceCents: number): Promise<void>;
};

/**
 * In-memory wallet store for testing/dev
 */
export class InMemoryWalletStore implements WalletStore {
  private balances = new Map<string, WalletBalance>();
  private transactions: WalletTransaction[] = [];

  async getBalance(orgId: string): Promise<WalletBalance | null> {
    return this.balances.get(orgId) || null;
  }

  async recordTransaction(tx: Omit<WalletTransaction, 'id' | 'createdAt'>): Promise<WalletTransaction> {
    const transaction: WalletTransaction = {
      ...tx,
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
    };
    this.transactions.push(transaction);
    return transaction;
  }

  async updateBalance(orgId: string, newBalanceCents: number): Promise<void> {
    const existing = this.balances.get(orgId);
    this.balances.set(orgId, {
      orgId,
      balanceCents: newBalanceCents,
      updatedAt: new Date(),
    });
  }

  // Helper for testing
  setBalance(orgId: string, balanceCents: number): void {
    this.balances.set(orgId, { orgId, balanceCents, updatedAt: new Date() });
  }

  getTransactions(orgId: string): WalletTransaction[] {
    return this.transactions.filter(tx => tx.orgId === orgId);
  }
}

/**
 * Debit wallet if sufficient balance, else return 402 payload
 */
export async function debitOrInvoice(
  store: WalletStore,
  orgId: string,
  amountCents: number,
  memo: string,
  lines: Array<{ sku: string; qty: number; unit_cents?: number; total_cents?: number }>
): Promise<{ ok: true; newBalance: number } | { ok: false; status: 402; invoice: any }> {
  const wallet = await store.getBalance(orgId);
  const currentBalance = wallet?.balanceCents || 0;

  if (currentBalance >= amountCents) {
    // Debit wallet
    const newBalance = currentBalance - amountCents;
    await store.recordTransaction({ orgId, amountCents: -amountCents, memo });
    await store.updateBalance(orgId, newBalance);
    return { ok: true, newBalance };
  } else {
    // Return 402 invoice
    return {
      ok: false,
      status: 402,
      invoice: {
        orgId,
        amount_cents: amountCents,
        lines,
        memo,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }
}

// Export database-backed implementation
export { PrismaWalletStore, type PrismaClient } from './PrismaWalletStore';

