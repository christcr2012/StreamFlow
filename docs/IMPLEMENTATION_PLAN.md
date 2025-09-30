# 🚀 STREAMFLOW IMPLEMENTATION PLAN
**Based on:** CODEX_REFACTOR_AUDIT.md  
**Source of Truth:** STREAMFLOW_REFACTOR_FOR_CODEX (1) (1).md  
**Priority:** Critical gaps first, then enhancements

---

## 📊 OVERVIEW

**Total Remaining Work:** ~6-9 days  
**Critical Path:** Phase 8 (Stripe Connect) → Phase 5 (Offline Sync) → Phase 6 (Onboarding)

---

## 🔴 CRITICAL: PHASE 8 - STRIPE CONNECT BILLING (3-4 days)

### 8.1: Provider Billing Audit & Harden (4 hours)

**Current State:**
- ✅ `src/lib/provider-billing.ts` exists
- ✅ `src/pages/api/webhooks/provider-stripe.ts` exists
- ⚠️ No webhook idempotency
- ⚠️ No encryption for sensitive data

**Tasks:**
- [ ] Add `StripeEvent` model to Prisma schema
- [ ] Implement webhook deduplication using `event.id`
- [ ] Add retry logic for failed webhook processing
- [ ] Audit all provider billing functions
- [ ] Add comprehensive error handling
- [ ] Test subscription lifecycle (create/update/cancel)

**Files to Modify:**
- `prisma/schema.prisma` - Add `StripeEvent` model
- `src/lib/provider-billing.ts` - Add error handling
- `src/pages/api/webhooks/provider-stripe.ts` - Add idempotency

---

### 8.2: Client Billing Data Model (2 hours)

**Codex Specification:**
```prisma
model TenantStripeConnect {
  id                String   @id @default(cuid())
  orgId             String   @unique
  org               Org      @relation(fields: [orgId], references: [id])
  
  // Encrypted Stripe account ID
  stripeAccountIdEnc String
  
  // Onboarding status
  onboardingComplete Boolean  @default(false)
  chargesEnabled     Boolean  @default(false)
  payoutsEnabled     Boolean  @default(false)
  
  // Metadata
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  @@index([orgId])
}
```

**Tasks:**
- [ ] Add `TenantStripeConnect` model to schema
- [ ] Add `StripeEvent` model for webhook idempotency
- [ ] Run Prisma migration: `npx prisma migrate dev --name add-stripe-connect`
- [ ] Generate Prisma client: `npx prisma generate`

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add models
- `prisma/migrations/` - New migration

---

### 8.3: AES-GCM Encryption Helper (3 hours)

**Codex Specification:**
```typescript
// src/lib/crypto/aes.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.MASTER_ENC_KEY!, 'base64'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(':');
  
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}
```

**Tasks:**
- [ ] Create `src/lib/crypto/aes.ts`
- [ ] Add `MASTER_ENC_KEY` to `.env.local` (generate 32-byte key)
- [ ] Add `MASTER_ENC_KEY` to Vercel environment variables
- [ ] Write unit tests for encrypt/decrypt
- [ ] Test with sample Stripe account ID

**Environment Setup:**
```bash
# Generate 32-byte key
node -e "console.log(crypto.randomBytes(32).toString('base64'))"
```

**Files to Create:**
- `src/lib/crypto/aes.ts` - Encryption helper
- `src/lib/crypto/aes.test.ts` - Unit tests

---

### 8.4: Connect Onboarding APIs (4 hours)

**Codex Specification:**
```typescript
// POST /api/billing/connect/onboard
// Creates Stripe Connect account and returns onboarding link

// GET /api/billing/connect/status
// Checks onboarding completion status

// POST /api/billing/connect/refresh
// Refreshes onboarding link if incomplete
```

**Tasks:**
- [ ] Create `src/pages/api/billing/connect/onboard.ts`
- [ ] Create `src/pages/api/billing/connect/status.ts`
- [ ] Create `src/pages/api/billing/connect/refresh.ts`
- [ ] Implement Stripe Connect account creation
- [ ] Generate account links for onboarding
- [ ] Store encrypted account ID in `TenantStripeConnect`
- [ ] Add proper error handling and logging

**Files to Create:**
- `src/pages/api/billing/connect/onboard.ts`
- `src/pages/api/billing/connect/status.ts`
- `src/pages/api/billing/connect/refresh.ts`

---

### 8.5: Client Checkout Sessions (On-Behalf-Of) (4 hours)

**Codex Specification:**
```typescript
// POST /api/billing/checkout
// Creates checkout session on behalf of connected account

const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [...],
  success_url: `${APP_URL}/billing/success`,
  cancel_url: `${APP_URL}/billing/cancel`,
  payment_intent_data: {
    application_fee_amount: platformFee, // Your cut
    on_behalf_of: connectedAccountId,
    transfer_data: {
      destination: connectedAccountId,
    },
  },
}, {
  stripeAccount: connectedAccountId, // On-behalf-of header
});
```

**Tasks:**
- [ ] Create `src/pages/api/billing/checkout.ts`
- [ ] Implement on-behalf-of checkout session creation
- [ ] Calculate platform fee (e.g., 2.9% + $0.30)
- [ ] Add success/cancel redirect pages
- [ ] Test with Stripe test mode
- [ ] Add comprehensive error handling

**Files to Create:**
- `src/pages/api/billing/checkout.ts`
- `src/pages/billing/success.tsx`
- `src/pages/billing/cancel.tsx`

---

### 8.6: Connect Webhooks (4 hours)

**Codex Specification:**
```typescript
// POST /api/webhooks/stripe-connect
// Handles Connect account events

// Events to handle:
// - account.updated (onboarding completion)
// - payment_intent.succeeded (client payment)
// - payment_intent.payment_failed
// - charge.succeeded
// - charge.failed
// - payout.paid
// - payout.failed
```

**Tasks:**
- [ ] Create `src/pages/api/webhooks/stripe-connect.ts`
- [ ] Implement signature verification
- [ ] Add event deduplication using `StripeEvent` table
- [ ] Handle account.updated events
- [ ] Handle payment events
- [ ] Update `TenantStripeConnect` status
- [ ] Send notifications on payment success/failure
- [ ] Add comprehensive logging

**Files to Create:**
- `src/pages/api/webhooks/stripe-connect.ts`

---

### 8.7: Stripe CLI Script (1 hour)

**Codex Specification:**
```bash
#!/bin/bash
# scripts/stripe/dev.sh

echo "🔌 Starting Stripe webhook forwarding..."

# Provider webhooks
stripe listen \
  --forward-to localhost:3000/api/webhooks/provider-stripe \
  --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed &

# Client webhooks
stripe listen \
  --forward-to localhost:3000/api/webhooks/stripe \
  --events invoice.payment_succeeded,invoice.payment_failed &

# Connect webhooks
stripe listen \
  --forward-to localhost:3000/api/webhooks/stripe-connect \
  --events account.updated,payment_intent.succeeded,payment_intent.payment_failed &

echo "✅ Webhook forwarding active"
wait
```

**Tasks:**
- [ ] Create `scripts/stripe/dev.sh`
- [ ] Make script executable: `chmod +x scripts/stripe/dev.sh`
- [ ] Test webhook forwarding
- [ ] Document usage in README

**Files to Create:**
- `scripts/stripe/dev.sh`

---

### 8.8: Provider Billing UI (4 hours)

**Tasks:**
- [ ] Create `/provider/billing` page
- [ ] Show all client subscriptions
- [ ] Display revenue metrics
- [ ] Add subscription management (upgrade/downgrade/cancel)
- [ ] Show payment history
- [ ] Add invoice generation

**Files to Create:**
- `src/pages/provider/billing.tsx`
- `src/components/provider/BillingDashboard.tsx`
- `src/components/provider/SubscriptionList.tsx`

---

## 🟡 HIGH PRIORITY: PHASE 5 - OFFLINE SYNC (2-3 days)

### 5.1: Dexie Database Schema (3 hours)

**Codex Specification:**
```typescript
// src/lib/offline/db.ts
import Dexie, { Table } from 'dexie';

interface PendingMutation {
  id?: number;
  orgId: string;
  endpoint: string;
  method: string;
  body: any;
  idempotencyKey: string;
  createdAt: number;
  retries: number;
}

class OfflineDB extends Dexie {
  pending!: Table<PendingMutation>;
  leads!: Table<any>;
  workOrders!: Table<any>;

  constructor() {
    super('StreamFlowOffline');
    this.version(1).stores({
      pending: '++id, orgId, createdAt, idempotencyKey',
      leads: 'id, orgId, updatedAt',
      workOrders: 'id, orgId, updatedAt',
    });
  }
}

export const db = new OfflineDB();
```

**Tasks:**
- [ ] Install Dexie: `pnpm add dexie`
- [ ] Create `src/lib/offline/db.ts`
- [ ] Define Dexie schema
- [ ] Add TypeScript interfaces
- [ ] Test database initialization

**Files to Create:**
- `src/lib/offline/db.ts`

---

### 5.2: useSafeMutation Hook (4 hours)

**Codex Specification:**
```typescript
// src/lib/offline/sync.ts
export function useSafeMutation(endpoint: string, method: string = 'POST') {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const mutate = async (body: any) => {
    const idempotencyKey = `${session?.user?.orgId}-${Date.now()}-${Math.random()}`;

    if (isOnline) {
      try {
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
          body: JSON.stringify(body),
        });
        
        if (res.status === 409) {
          // Conflict - already processed
          return { ok: true, conflict: true };
        }
        
        return await res.json();
      } catch (err) {
        // Network error - queue for later
        await db.pending.add({
          orgId: session?.user?.orgId!,
          endpoint,
          method,
          body,
          idempotencyKey,
          createdAt: Date.now(),
          retries: 0,
        });
        
        return { ok: true, queued: true };
      }
    } else {
      // Offline - queue immediately
      await db.pending.add({
        orgId: session?.user?.orgId!,
        endpoint,
        method,
        body,
        idempotencyKey,
        createdAt: Date.now(),
        retries: 0,
      });
      
      return { ok: true, queued: true };
    }
  };

  return { mutate, isOnline };
}
```

**Tasks:**
- [ ] Create `src/lib/offline/sync.ts`
- [ ] Implement `useSafeMutation` hook
- [ ] Add online/offline detection
- [ ] Implement queue logic
- [ ] Add error handling
- [ ] Write unit tests

**Files to Create:**
- `src/lib/offline/sync.ts`
- `src/lib/offline/sync.test.ts`

---

### 5.3: Replay Queue Function (3 hours)

**Codex Specification:**
```typescript
// src/lib/offline/sync.ts
export async function replayQueue(orgId: string) {
  const pending = await db.pending.where('orgId').equals(orgId).toArray();
  
  for (const mutation of pending) {
    try {
      const res = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': mutation.idempotencyKey,
        },
        body: JSON.stringify(mutation.body),
      });
      
      if (res.ok || res.status === 409) {
        // Success or already processed
        await db.pending.delete(mutation.id!);
      } else if (res.status >= 500) {
        // Server error - retry later
        await db.pending.update(mutation.id!, {
          retries: mutation.retries + 1,
        });
      } else {
        // Client error - remove from queue
        await db.pending.delete(mutation.id!);
      }
    } catch (err) {
      // Network error - keep in queue
      await db.pending.update(mutation.id!, {
        retries: mutation.retries + 1,
      });
    }
  }
}
```

**Tasks:**
- [ ] Implement `replayQueue` function
- [ ] Add retry logic with exponential backoff
- [ ] Handle 409 conflicts gracefully
- [ ] Add comprehensive logging
- [ ] Test with mock API

**Files to Modify:**
- `src/lib/offline/sync.ts`

---

### 5.4: Wire to Worker Clock & Leads (2 hours)

**Tasks:**
- [ ] Update worker clock to use `useSafeMutation`
- [ ] Update leads form to use `useSafeMutation`
- [ ] Add offline banner component
- [ ] Show queue status in UI
- [ ] Test offline → online transition

**Files to Modify:**
- `src/components/WorkerClock.tsx`
- `src/pages/leads/new.tsx`
- `src/components/OfflineBanner.tsx` (create)

---

## 🟢 MEDIUM PRIORITY: PHASE 6 - ONBOARDING WIZARD (1-2 days)

### 6.1: Owner Wizard Component (6 hours)

**Tasks:**
- [ ] Create multi-step wizard component
- [ ] Step 1: Logo upload
- [ ] Step 2: Business hours
- [ ] Step 3: Team invitations
- [ ] Step 4: Integration selection
- [ ] Step 5: Module activation
- [ ] Add progress indicator
- [ ] Save progress between steps

**Files to Create:**
- `src/components/onboarding/OwnerWizard.tsx`
- `src/components/onboarding/StepLogo.tsx`
- `src/components/onboarding/StepHours.tsx`
- `src/components/onboarding/StepTeam.tsx`
- `src/components/onboarding/StepIntegrations.tsx`
- `src/components/onboarding/StepModules.tsx`

---

### 6.2: Dashboard Checklist (2 hours)

**Tasks:**
- [ ] Create checklist component
- [ ] Track completion status
- [ ] Show progress percentage
- [ ] Add "dismiss" functionality
- [ ] Celebrate completion

**Files to Create:**
- `src/components/dashboard/OnboardingChecklist.tsx`

---

## 📅 EXECUTION TIMELINE

### Week 1: Critical Path
- **Days 1-2:** Phase 8.1-8.3 (Models, Encryption, Provider Audit)
- **Days 3-4:** Phase 8.4-8.6 (Connect APIs, Webhooks)
- **Day 5:** Phase 8.7-8.8 (CLI Script, Provider UI)

### Week 2: High Priority
- **Days 6-7:** Phase 5.1-5.3 (Dexie, useSafeMutation, Replay)
- **Day 8:** Phase 5.4 (Wire to Components)

### Week 3: Polish
- **Days 9-10:** Phase 6 (Onboarding Wizard)

---

## ✅ DEFINITION OF DONE

Each phase is complete when:
- [ ] All code is written and tested
- [ ] TypeScript compiles with zero errors
- [ ] All tests pass
- [ ] Code is committed with proper message
- [ ] Changes are pushed to GitHub
- [ ] Documentation is updated
- [ ] User-facing features are tested manually

---

**Next Action:** Begin Phase 8.1 (Provider Billing Audit & Harden)

