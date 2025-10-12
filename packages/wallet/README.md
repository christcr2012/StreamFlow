# @cortiware/wallet

Wallet balance and transaction management for prepaid billing and credits.

## Overview

This package provides wallet functionality for managing customer balances and transactions:
- Balance tracking per organization
- Transaction recording (credits and debits)
- Automatic debit-or-invoice logic
- In-memory store for development/testing
- Database store interface for production

Use cases:
- Prepaid billing (customers load wallet, charges deduct)
- Credits and refunds
- SLA credits
- Promotional credits
- Usage-based billing with wallet fallback

## Installation

This is an internal package in the Cortiware monorepo.

```json
{
  "dependencies": {
    "@cortiware/wallet": "file:../../packages/wallet"
  }
}
```

## API Reference

### Types

```typescript
type WalletBalance = {
  orgId: string;
  balanceCents: number;
  updatedAt: Date;
};

type WalletTransaction = {
  id: string;
  orgId: string;
  amountCents: number; // positive: credit, negative: debit
  memo?: string;
  createdAt: Date;
};

type WalletStore = {
  getBalance(orgId: string): Promise<WalletBalance | null>;
  recordTransaction(tx: Omit<WalletTransaction, 'id' | 'createdAt'>): Promise<WalletTransaction>;
  updateBalance(orgId: string, newBalanceCents: number): Promise<void>;
};
```

### Classes

#### `InMemoryWalletStore`

In-memory implementation of WalletStore for development and testing.

```typescript
import { InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();

// Set initial balance (testing helper)
store.setBalance('org-123', 10000); // $100.00

// Get balance
const balance = await store.getBalance('org-123');

// Record transaction
await store.recordTransaction({
  orgId: 'org-123',
  amountCents: -500, // debit $5.00
  memo: 'API usage'
});

// Get transactions (testing helper)
const transactions = store.getTransactions('org-123');
```

### Functions

#### `debitOrInvoice(store, orgId, amountCents, memo, lines)`

Attempts to debit wallet if sufficient balance exists, otherwise returns invoice payload.

```typescript
async function debitOrInvoice(
  store: WalletStore,
  orgId: string,
  amountCents: number,
  memo: string,
  lines: Array<{ sku: string; qty: number; unit_cents?: number; total_cents?: number }>
): Promise<
  | { ok: true; newBalance: number }
  | { ok: false; status: 402; invoice: any }
>
```

## Usage Examples

### Basic Wallet Operations

```typescript
import { InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();

// Initialize wallet with $100
store.setBalance('org-123', 10000);

// Get current balance
const balance = await store.getBalance('org-123');
console.log('Balance:', balance?.balanceCents); // 10000

// Record a credit (add funds)
await store.recordTransaction({
  orgId: 'org-123',
  amountCents: 5000, // +$50.00
  memo: 'Wallet top-up'
});

// Update balance
await store.updateBalance('org-123', 15000);

// Record a debit (charge)
await store.recordTransaction({
  orgId: 'org-123',
  amountCents: -2000, // -$20.00
  memo: 'API usage charges'
});

await store.updateBalance('org-123', 13000);
```

### Debit or Invoice Pattern

```typescript
import { debitOrInvoice, InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();
store.setBalance('org-123', 10000); // $100.00

const lines = [
  { sku: 'API_CALLS', qty: 1000, unit_cents: 1, total_cents: 1000 }
];

const result = await debitOrInvoice(
  store,
  'org-123',
  1000, // $10.00
  'API usage',
  lines
);

if (result.ok) {
  console.log('Charged to wallet. New balance:', result.newBalance);
  // Output: Charged to wallet. New balance: 9000
} else {
  console.log('Insufficient funds. Invoice:', result.invoice);
}
```

### Insufficient Balance Handling

```typescript
import { debitOrInvoice, InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();
store.setBalance('org-123', 500); // $5.00

const lines = [
  { sku: 'STORAGE', qty: 100, unit_cents: 100, total_cents: 10000 }
];

const result = await debitOrInvoice(
  store,
  'org-123',
  10000, // $100.00
  'Storage charges',
  lines
);

if (!result.ok) {
  console.log('Status:', result.status); // 402
  console.log('Invoice:', result.invoice);
  // {
  //   orgId: 'org-123',
  //   amount_cents: 10000,
  //   lines: [...],
  //   memo: 'Storage charges',
  //   due_date: '2025-11-11T...'
  // }
}
```

### Integration with Agreements

```typescript
import { evaluateAgreement } from '@cortiware/agreements';
import { debitOrInvoice, InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();
store.setBalance('org-123', 50000); // $500.00

const rules = [
  {
    name: 'API Usage',
    when: { event: 'api_calls', filters: { gte: 0 } },
    action: { type: 'per_unit', unit_cents: 1 },
    settlement: { mode: 'wallet', memo: 'API usage charges' }
  }
];

const event = { event: 'api_calls', value: 10000 };
const charges = evaluateAgreement('org-123', rules, event);

const result = await debitOrInvoice(
  store,
  charges.orgId,
  charges.total_cents,
  'Monthly API usage',
  charges.lines
);

if (result.ok) {
  console.log('Charged:', charges.total_cents, 'New balance:', result.newBalance);
} else {
  console.log('Invoice generated:', result.invoice);
}
```

### Transaction History

```typescript
import { InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();
store.setBalance('org-123', 10000);

// Record multiple transactions
await store.recordTransaction({
  orgId: 'org-123',
  amountCents: 5000,
  memo: 'Wallet top-up'
});

await store.recordTransaction({
  orgId: 'org-123',
  amountCents: -1000,
  memo: 'API usage'
});

await store.recordTransaction({
  orgId: 'org-123',
  amountCents: -500,
  memo: 'Storage charges'
});

// Get transaction history (testing helper)
const transactions = store.getTransactions('org-123');
console.log('Transactions:', transactions);
// [
//   { id: 'txn_...', orgId: 'org-123', amountCents: 5000, memo: 'Wallet top-up', createdAt: ... },
//   { id: 'txn_...', orgId: 'org-123', amountCents: -1000, memo: 'API usage', createdAt: ... },
//   { id: 'txn_...', orgId: 'org-123', amountCents: -500, memo: 'Storage charges', createdAt: ... }
// ]
```

### Promotional Credits

```typescript
import { InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();

// Award promotional credit
await store.recordTransaction({
  orgId: 'org-123',
  amountCents: 10000, // $100.00 credit
  memo: 'Welcome bonus'
});

await store.updateBalance('org-123', 10000);

const balance = await store.getBalance('org-123');
console.log('Balance after promo:', balance?.balanceCents); // 10000
```

### SLA Credits

```typescript
import { InMemoryWalletStore } from '@cortiware/wallet';

const store = new InMemoryWalletStore();
store.setBalance('org-123', 0);

// Award SLA credit for downtime
await store.recordTransaction({
  orgId: 'org-123',
  amountCents: 990, // $9.90 credit (10% of $99 subscription)
  memo: 'SLA credit for 98.5% uptime (below 99.9% SLA)'
});

await store.updateBalance('org-123', 990);
```

## Production Implementation

For production, implement a database-backed WalletStore:

```typescript
import { PrismaClient } from '@prisma/client';
import type { WalletStore } from '@cortiware/wallet';

class PrismaWalletStore implements WalletStore {
  constructor(private prisma: PrismaClient) {}

  async getBalance(orgId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { orgId }
    });
    
    return wallet ? {
      orgId: wallet.orgId,
      balanceCents: wallet.balanceCents,
      updatedAt: wallet.updatedAt
    } : null;
  }

  async recordTransaction(tx) {
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        orgId: tx.orgId,
        amountCents: tx.amountCents,
        memo: tx.memo
      }
    });
    
    return {
      id: transaction.id,
      orgId: transaction.orgId,
      amountCents: transaction.amountCents,
      memo: transaction.memo || undefined,
      createdAt: transaction.createdAt
    };
  }

  async updateBalance(orgId: string, newBalanceCents: number) {
    await this.prisma.wallet.upsert({
      where: { orgId },
      create: { orgId, balanceCents: newBalanceCents },
      update: { balanceCents: newBalanceCents }
    });
  }
}
```

## Best Practices

1. **Always use transactions** - Ensure balance updates and transaction records are atomic
2. **Validate amounts** - Ensure amountCents is an integer (no fractional cents)
3. **Include memos** - Help customers understand charges and credits
4. **Handle 402 responses** - Present invoices to customers when wallet is insufficient
5. **Audit transactions** - Keep complete transaction history for reconciliation
6. **Set balance limits** - Prevent negative balances or excessive credits

## Error Handling

```typescript
import { debitOrInvoice } from '@cortiware/wallet';

try {
  const result = await debitOrInvoice(store, orgId, amount, memo, lines);
  
  if (result.ok) {
    // Success - charged to wallet
    return { success: true, balance: result.newBalance };
  } else {
    // Insufficient funds - return invoice
    return { success: false, invoice: result.invoice };
  }
} catch (error) {
  console.error('Wallet operation failed:', error);
  throw error;
}
```

## Testing

```typescript
import { InMemoryWalletStore, debitOrInvoice } from '@cortiware/wallet';

describe('Wallet', () => {
  test('debit with sufficient balance', async () => {
    const store = new InMemoryWalletStore();
    store.setBalance('org-123', 10000);
    
    const result = await debitOrInvoice(store, 'org-123', 5000, 'Test', []);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.newBalance).toBe(5000);
    }
  });
  
  test('invoice with insufficient balance', async () => {
    const store = new InMemoryWalletStore();
    store.setBalance('org-123', 1000);
    
    const result = await debitOrInvoice(store, 'org-123', 5000, 'Test', []);
    
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.invoice.amount_cents).toBe(5000);
    }
  });
});
```

## Related Packages

- `@cortiware/agreements`: Rule evaluation engine for billing
- `@cortiware/db`: Database utilities

## Documentation

- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): System architecture

## License

MIT

