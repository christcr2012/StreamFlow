# @cortiware/agreements

Rule evaluation engine for agreement-based billing and automated charge calculation.

## Overview

This package provides a flexible rule engine for evaluating service agreements and generating charges based on events. It supports:
- Event-based billing triggers
- Multiple charge types (flat fee, per-unit, percentage)
- Filter-based rule matching
- Automatic charge line generation
- Invoice and wallet settlement modes

Use cases:
- Usage-based billing (API calls, storage, bandwidth)
- Service level agreements (SLA penalties, bonuses)
- Tiered pricing (volume discounts, overage charges)
- Event-driven monetization

## Installation

This is an internal package in the Cortiware monorepo.

```json
{
  "dependencies": {
    "@cortiware/agreements": "file:../../packages/agreements"
  }
}
```

## API Reference

### Types

```typescript
type AgreementRule = {
  name: string;
  when: {
    event: string; // event name to match
    filters: Record<string, any>; // gt, gte, lt, lte, eq
  };
  action: {
    type: 'flat_fee' | 'per_unit' | 'percentage';
    amount_cents?: number; // for flat_fee
    unit_cents?: number; // for per_unit
    percentage?: number; // for percentage
  };
  settlement: {
    mode: 'invoice' | 'wallet';
    memo?: string;
  };
};

type AgreementEvent = {
  event: string;
  value: number;
  metadata?: Record<string, any>;
};

type ChargeLine = {
  sku: string;
  qty: number;
  unit_cents?: number;
  total_cents?: number;
  memo?: string;
};

type ChargesResult = {
  orgId: string;
  lines: ChargeLine[];
  total_cents: number;
};
```

### Functions

#### `evaluateRule(rule: AgreementRule, event: AgreementEvent): ChargeLine | null`

Evaluates a single rule against an event. Returns a charge line if the rule matches, null otherwise.

```typescript
import { evaluateRule } from '@cortiware/agreements';

const rule = {
  name: 'API Overage',
  when: {
    event: 'api_calls',
    filters: { gt: 1000 }
  },
  action: {
    type: 'per_unit',
    unit_cents: 10
  },
  settlement: {
    mode: 'invoice',
    memo: 'API overage charges'
  }
};

const event = {
  event: 'api_calls',
  value: 1500
};

const charge = evaluateRule(rule, event);
// Returns: { sku: 'AGREEMENT_API_OVERAGE', qty: 1500, unit_cents: 10, total_cents: 15000, memo: '...' }
```

#### `evaluateAgreement(orgId: string, rules: AgreementRule[], event: AgreementEvent): ChargesResult`

Evaluates all rules against an event and produces a charges result with all matching charge lines.

```typescript
import { evaluateAgreement } from '@cortiware/agreements';

const rules = [
  {
    name: 'Base Fee',
    when: { event: 'monthly_billing', filters: {} },
    action: { type: 'flat_fee', amount_cents: 5000 },
    settlement: { mode: 'invoice' }
  },
  {
    name: 'Storage Overage',
    when: { event: 'storage_gb', filters: { gt: 100 } },
    action: { type: 'per_unit', unit_cents: 50 },
    settlement: { mode: 'wallet' }
  }
];

const event = {
  event: 'storage_gb',
  value: 150
};

const result = evaluateAgreement('org-123', rules, event);
// Returns: { orgId: 'org-123', lines: [...], total_cents: 7500 }
```

## Usage Examples

### Flat Fee Billing

```typescript
import { evaluateAgreement } from '@cortiware/agreements';

const rules = [
  {
    name: 'Monthly Subscription',
    when: {
      event: 'monthly_billing',
      filters: {} // always matches
    },
    action: {
      type: 'flat_fee',
      amount_cents: 9900 // $99.00
    },
    settlement: {
      mode: 'invoice',
      memo: 'Monthly subscription fee'
    }
  }
];

const event = { event: 'monthly_billing', value: 1 };
const result = evaluateAgreement('org-123', rules, event);
```

### Per-Unit Billing

```typescript
import { evaluateAgreement } from '@cortiware/agreements';

const rules = [
  {
    name: 'API Calls',
    when: {
      event: 'api_calls',
      filters: { gte: 0 } // all calls
    },
    action: {
      type: 'per_unit',
      unit_cents: 1 // $0.01 per call
    },
    settlement: {
      mode: 'wallet',
      memo: 'API usage charges'
    }
  }
];

const event = { event: 'api_calls', value: 5000 };
const result = evaluateAgreement('org-123', rules, event);
// total_cents: 5000 (5000 calls × $0.01)
```

### Tiered Pricing with Filters

```typescript
import { evaluateAgreement } from '@cortiware/agreements';

const rules = [
  {
    name: 'Storage Tier 1',
    when: {
      event: 'storage_gb',
      filters: { lte: 100 }
    },
    action: {
      type: 'per_unit',
      unit_cents: 100 // $1.00/GB
    },
    settlement: { mode: 'invoice' }
  },
  {
    name: 'Storage Tier 2',
    when: {
      event: 'storage_gb',
      filters: { gt: 100, lte: 500 }
    },
    action: {
      type: 'per_unit',
      unit_cents: 75 // $0.75/GB (discount)
    },
    settlement: { mode: 'invoice' }
  },
  {
    name: 'Storage Tier 3',
    when: {
      event: 'storage_gb',
      filters: { gt: 500 }
    },
    action: {
      type: 'per_unit',
      unit_cents: 50 // $0.50/GB (bigger discount)
    },
    settlement: { mode: 'invoice' }
  }
];

const event = { event: 'storage_gb', value: 250 };
const result = evaluateAgreement('org-123', rules, event);
// Matches Tier 2: 250 GB × $0.75 = $187.50
```

### Percentage-Based Billing

```typescript
import { evaluateAgreement } from '@cortiware/agreements';

const rules = [
  {
    name: 'Transaction Fee',
    when: {
      event: 'payment_processed',
      filters: { gte: 0 }
    },
    action: {
      type: 'percentage',
      percentage: 2.9 // 2.9%
    },
    settlement: {
      mode: 'wallet',
      memo: 'Payment processing fee'
    }
  }
];

const event = {
  event: 'payment_processed',
  value: 1,
  metadata: {
    base_cents: 10000 // $100.00 payment
  }
};

const result = evaluateAgreement('org-123', rules, event);
// total_cents: 290 (2.9% of $100.00)
```

### SLA Penalty

```typescript
import { evaluateAgreement } from '@cortiware/agreements';

const rules = [
  {
    name: 'Uptime SLA Penalty',
    when: {
      event: 'monthly_uptime_pct',
      filters: { lt: 99.9 } // below 99.9% uptime
    },
    action: {
      type: 'percentage',
      percentage: 10 // 10% credit
    },
    settlement: {
      mode: 'wallet',
      memo: 'SLA credit for downtime'
    }
  }
];

const event = {
  event: 'monthly_uptime_pct',
  value: 98.5,
  metadata: {
    base_cents: 9900 // monthly subscription
  }
};

const result = evaluateAgreement('org-123', rules, event);
// total_cents: 990 (10% credit = $9.90)
```

## Filter Operators

Supported filter operators:
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `eq`: Equal

```typescript
// Examples
{ gt: 100 }        // value > 100
{ gte: 100 }       // value >= 100
{ lt: 100 }        // value < 100
{ lte: 100 }       // value <= 100
{ eq: 100 }        // value === 100
{ gt: 50, lt: 100 } // 50 < value < 100
```

## Charge Types

### Flat Fee
Fixed amount regardless of event value.

```typescript
action: {
  type: 'flat_fee',
  amount_cents: 5000 // $50.00
}
```

### Per Unit
Amount multiplied by event value.

```typescript
action: {
  type: 'per_unit',
  unit_cents: 100 // $1.00 per unit
}
// If event.value = 10, total = $10.00
```

### Percentage
Percentage of base amount from event metadata.

```typescript
action: {
  type: 'percentage',
  percentage: 5 // 5%
}
// Requires event.metadata.base_cents
```

## Settlement Modes

- `invoice`: Generate invoice for customer to pay
- `wallet`: Deduct from customer's wallet balance

## SKU Generation

SKUs are automatically generated from rule names:
```typescript
rule.name = "API Overage"
// SKU: "AGREEMENT_API_OVERAGE"

rule.name = "Monthly Subscription"
// SKU: "AGREEMENT_MONTHLY_SUBSCRIPTION"
```

## Integration with Wallet

```typescript
import { evaluateAgreement } from '@cortiware/agreements';
import { debitOrInvoice } from '@cortiware/wallet';

const result = evaluateAgreement('org-123', rules, event);

if (result.total_cents > 0) {
  const settlement = await debitOrInvoice(
    walletStore,
    result.orgId,
    result.total_cents,
    'Agreement charges',
    result.lines
  );
  
  if (settlement.ok) {
    console.log('Charged to wallet:', settlement.newBalance);
  } else {
    console.log('Invoice generated:', settlement.invoice);
  }
}
```

## Best Practices

1. **Use specific event names** - `api_calls`, `storage_gb`, not generic `usage`
2. **Set appropriate filters** - Avoid overlapping rules for same event
3. **Include memos** - Help customers understand charges
4. **Test rules** - Validate filter logic before production
5. **Monitor charges** - Track generated charges for anomalies

## Related Packages

- `@cortiware/wallet`: Wallet balance and transaction management
- `@cortiware/db`: Database utilities

## Documentation

- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): System architecture

## License

MIT

