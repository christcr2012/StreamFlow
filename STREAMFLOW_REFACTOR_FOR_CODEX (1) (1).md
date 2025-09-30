# STREAMFLOW_REFACTOR_FOR_CODEX.md
> **One-file master instructions for OpenAI Codex**  
> Refactor the existing StreamFlow repo **in place** (no rewrite) to implement and harden:
> - Space-based routing & server guards
> - Tenant scoping (`orgId` everywhere)  
> - Tenant provisioning + industry templates  
> - Owner-configurable RBAC  
> - Offline-first PWA (Dexie + idempotent APIs)  
> - Billing: **Provider subscriptions (hardened)** + **Client billing (Stripe Connect Express)**  
> Keep all current functionality; changes must be incremental and reversible.

---

## How to execute (Codex Agent Operating Rules)
**You are authorized to write code, run terminal commands, and commit/push to the current Git remote if the workspace has Git credentials configured.**
1. Work **phase-by-phase, task-by-task**. Keep diffs **small and runnable**.
2. After each task:
   - Run validations/lint/tests.
   - If successful → **commit** with the template below and **push**.
   - If failures → fix; if blocked by missing decisions → add a clear `TODO(<domain>):` with `BLOCKED_BY:` note and continue.
3. **Never hardcode secrets**. Read from `.env` only; never print secrets to logs or commit history.
4. Ask only if a referenced file is missing or an ambiguity blocks execution. Otherwise proceed with best-practice defaults and leave TODOs.

**Commit message template**
```
<type>(<scope>): <summary>
Context: why/what
Safety: migrations? rollback?
Validation: commands + flows verified
```

**Comment & TODO conventions (apply to every file you touch)**
```ts
/**
 * Module: <short name>
 * Purpose: <what this file does>
 * Scope: <spaces + tenant scoping>
 * Notes: <gotchas/links>
 */
// GUARD: enforce space + permission + tenant scope
// IDEMPOTENCY: short-circuit on seen event/key
// TODO(billing-connect): <actionable item>
// FIXME(offline-sync): <bug needing attention>
// BLOCKED_BY: <task-id or dependency>
// PR-CHECKS:
// - [ ] orgId scoping
// - [ ] requirePolicy + requirePerm
// - [ ] idempotency (if webhook/mutation)
// - [ ] tests added
```

**Quick validation commands**
- `pnpm lint && pnpm typecheck && pnpm test`
- `pnpm dev` and verify routes/guards/offline/billing in **test mode**.

---

## Phase 0 — Preflight (No functional changes)
**Task 0.1 – Branch & docs**
- Create branch: `refactor/architecture-v1`.
- Create `/docs` if missing; add this file if not present.

**Task 0.2 – Repo inventory (script)**
- Add `scripts/audit/inventory.ts` to print:
  - All routes (pages/api)
  - Prisma models (+ which have `orgId`)
  - Places importing Prisma
  - Auth/session helpers
  - Client fetches to `/api/*`
- Run and save output to `/docs/audit-<date>.md`.

**Commit** `chore(audit): repo inventory`

---

## Phase 1 — Spaces & Server Guards (Non-breaking)
**Goal**: Introduce `/client`, `/provider`, `/dev`, `/accounting`; keep old URLs via redirects; add server guards.

**Tasks**
1. Add `src/lib/auth/policy.ts` (space + roles map) and `src/lib/auth/guard.ts` (`requirePolicy`, `requirePerm`, `getSession`).
2. Ensure `/api/me` returns `{ id, orgId, tenantId, space, roles: string[] }`. Update `useMe` types.
3. Create wrapper pages in new namespaces that re-export existing pages (keep old pages for now).
4. Add `src/middleware.ts` to deny early for wrong space/role (403 or redirect).
5. Add guards to each protected page/API.

**Validation**
- Old URLs redirect; cross-space access is denied.

**Commit** `feat(routing): namespaced spaces + server guards + redirects`

---

## Phase 2 — Tenant Scoping (Prisma helpers)
**Goal**: All queries are tenant-scoped.

**Tasks**
- Add `src/lib/db/scope.ts` with `tenantWhere(session)` and `assertTenant(session, entity)`.
- Sweep all API handlers to include `where: { orgId: session.orgId }`; assert before mutate/delete.
- Add unit test for cross-tenant denial.

**Commit** `feat(tenancy): enforce orgId scoping across DB`

---

## Phase 3 — Provisioning & Industry Templates
**Goal**: Idempotent tenant creation + template seeding.

**Tasks**
- Confirm/add models: `TenantSettings`, `Role`, `Permission`, `RolePermission`, `UserRole`, `IntegrationCredential`.
- Add `/config/industryTemplates/*.json` (start with 1–2).
- Implement `src/lib/provisioning/createTenant.ts` (idempotent by `externalCustomerId`).
- Add `POST /api/tenant/register` → orchestrator.
- On login, redirect to `/tenant/{tenantId}/{space}/dashboard`.

**Commit** `feat(provisioning): idempotent tenant creation + templates + owner seeding`

---

## Phase 4 — RBAC (Owner-configurable)
**Goal**: Owner can clone roles & toggle permissions; UI hides; server enforces.

**Tasks**
- Add `src/lib/auth/permissions.ts` registry.
- Implement `hasPerm/requirePerm` and enforce server-side.
- Owner UI: `/client/admin/roles` for role clone + permission toggles.
- Nav reacts to perms; server still enforces.

**Commit** `feat(rbac): owner-configurable roles + enforcement`

---

## Phase 5 — Offline-First (PWA + Dexie + Idempotency)
**Goal**: Core flows usable offline; queued writes replay safely.

**Tasks**
- Add PWA shell (next-pwa + manifest + icons).
- Add Dexie DB (`pending`, `leads`, `workOrders`, …) — every record stores `orgId` + `updatedAt`.
- Add `src/lib/offline/sync.ts`: `useSafeMutation(route,payload)` queues offline ops with `Idempotency-Key`; `replayQueue()` on `online` sends and clears.
- Add `Idempotency` table; wrap mutating endpoints to accept `Idempotency-Key` and short-circuit duplicates.
- Wire worker clock + leads create/edit to `useSafeMutation`.
- Show offline banner; handle 409 conflicts.

**Commit** `feat(offline): PWA + Dexie + idempotent replay`

---

## Phase 6 — Onboarding Wizard
**Goal**: Get new owner to first success fast.

**Tasks**
- Owner wizard (logo/hours/team/integrations/modules).
- Role-based first-run tips for non-owners.
- Dashboard checklist (“Import your first lead”, etc.).

**Commit** `feat(onboarding): owner wizard + checklist`

---

## Phase 7 — Observability & Performance
**Goal**: Confidence and cost control.

**Tasks**
- Audit logs for denials, provisioning steps, replay counts, conflicts.
- E2E tests: provisioning, isolation, offline replay, RBAC, onboarding.
- Perf: tenant indexes; minimal selects; lazy-load heavy modules; cache templates/flags.

**Commit** `chore(ops): audit logs, tests, perf`

---

## Phase 8 — Billing & Payments (Provider + Client via Stripe Connect)

> **Separation of concerns**
> - **Provider billing** (SaaS) uses platform Stripe keys; handles subscriptions and AI token packs.
> - **Client billing** uses **Stripe Connect (Express)** so each tenant bills its own customers through its **own** Stripe account.
> - Each has separate webhook endpoint and secret; both idempotent.

### 8.1 Provider Billing — Audit & Harden
**Tasks**
- Ensure `.env` only has platform keys: `PROVIDER_STRIPE_SECRET_KEY`, `PROVIDER_STRIPE_WEBHOOK_SECRET`, price IDs.
- Create `StripeEvent` table (see 8.6 migration) with PK=`event.id` and `source='provider'` for **idempotency**.
- Implement `/api/stripe/webhook/provider`:
  - Verify signature; if `event.id` exists → `200` and exit.
  - Handle: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.payment_succeeded|failed`.
  - Persist subscription state (e.g., `TenantSubscription` or fields on `TenantSettings`) and map to **feature flags**.
- **AI token packs** (if sold): one-time Checkout → webhook increments `aiTokenBalance` **exactly once**.

**Validation**
- Test Checkout → entitlements update.
- Duplicate event → processed once only.

**Commit** `feat(billing:provider): webhook idempotency + subscription state + entitlements`

### 8.2 Client Billing — Data Model
**Tasks**
- Add model: `TenantStripeConnect(orgId PK, stripeConnectedAccountId ENCRYPTED, connectStatus, createdAt, updatedAt)`.
- Store `acct_…` with **AES-GCM encryption** (helper in 8.7).

**Commit** `feat(billing:client): prisma models for Stripe Connect + encryption`

### 8.3 Connect Onboarding APIs (Owner-only)
**Tasks**
- `POST /api/client-billing/connect/start`: create Express account → account link (`type:'account_onboarding'`) → save `acct_xxx` encrypted with `connectStatus='pending'` → return onboarding URL.
- `GET /api/client-billing/connect/status`: retrieve account; return `details_submitted`, `charges_enabled`, `payouts_enabled`.
- **Guards**: `space='CLIENT'`, `hasPerm('billing.manage')`, scope by `orgId`.

**Commit** `feat(billing:client): connect onboarding endpoints + guards + scoping`

### 8.4 Client Checkout Sessions (On-Behalf-Of)
**Tasks**
- `POST /api/client-billing/checkout`:
  - Load tenant’s `acct_xxx` (decrypt).
  - Create Checkout Session using platform key with:
    - `payment_intent_data: { on_behalf_of: acct_xxx, transfer_data: { destination: acct_xxx } }`
    - Optional `application_fee_amount` (platform fee).
  - Link quote/invoice to Stripe ids.

**Commit** `feat(billing:client): checkout sessions on_behalf_of + destination`

### 8.5 Connect Webhooks (Separate Endpoint)
**Tasks**
- Add `/api/stripe/webhook/connect` with its **own secret**.
- Handle: `checkout.session.completed`, `payment_intent.succeeded|payment_intent.payment_failed`, `charge.refunded`, `account.updated`, `account.application.deauthorized`.
- Use `StripeEvent(event.id, source='connect')` for idempotency.
- Update local invoice/payment + `connectStatus`.

**Commit** `feat(billing:client): connect webhooks + idempotency`

### 8.6 Prisma Migration (Codex: create migration)
Produce a migration with SQL equivalent to:
```sql
CREATE TABLE IF NOT EXISTS "StripeEvent" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL,           -- 'provider' | 'connect'
  "receivedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "StripeEvent_source_idx" ON "StripeEvent" ("source");

CREATE TABLE IF NOT EXISTS "TenantStripeConnect" (
  "orgId" TEXT PRIMARY KEY REFERENCES "Org"("id") ON DELETE CASCADE,
  "stripeConnectedAccountId" TEXT NOT NULL,      -- AES-GCM encrypted at app layer
  "connectStatus" TEXT NOT NULL DEFAULT 'pending', -- pending|complete|restricted
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Validation**
- Migration runs; CRUD works; encrypted storage verified.

**Commit** `chore(billing): prisma migration for events + connect models`

### 8.7 AES-GCM Encryption Helper (Codex: create file)
Create `src/lib/crypto/aes.ts`:
```ts
/**
 * Module: AES-GCM Utilities
 * Purpose: Encrypt/decrypt sensitive strings (e.g., Stripe acct_xxx) at rest.
 * Notes: Requires APP_ENCRYPTION_KEY = 32-byte base64 (256-bit key).
 */
import crypto from 'crypto';

const KEY_B64 = process.env.APP_ENCRYPTION_KEY;
if (!KEY_B64) {
  // TODO(secrets): set APP_ENCRYPTION_KEY in env; 32-byte random key, base64-encoded
}
export function encryptString(plain: string): string {
  const key = Buffer.from(KEY_B64!, 'base64');
  const iv = crypto.randomBytes(12); // 96-bit nonce
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64'); // [12 IV][16 TAG][N DATA]
}
export function decryptString(payloadB64: string): string {
  const key = Buffer.from(KEY_B64!, 'base64');
  const buf = Buffer.from(payloadB64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}
```
Use it for persisting/loading `stripeConnectedAccountId` in Connect models.

**Commit** `feat(secrets): AES-GCM helper for encrypting Stripe acct ids`

### 8.8 Stripe CLI Script (Codex: create file)
Create `scripts/stripe/dev.sh` (chmod +x):
```bash
#!/usr/bin/env bash
# Forward events to both provider and connect webhooks in local dev.
# Requires: stripe CLI logged in; app running at localhost:3000

set -euo pipefail

# Provider (SaaS) webhooks
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed \
  --forward-to http://localhost:3000/api/stripe/webhook/provider \
  >/tmp/stripe-provider.log 2>&1 &

# Connect (tenant sales) webhooks
stripe listen \
  --events checkout.session.completed,payment_intent.succeeded,payment_intent.payment_failed,charge.refunded,account.updated,account.application.deauthorized \
  --forward-to http://localhost:3000/api/stripe/webhook/connect \
  >/tmp/stripe-connect.log 2>&1 &

echo "Stripe forwarding started. Logs: /tmp/stripe-provider.log, /tmp/stripe-connect.log"
```
**Commit** `chore(dev): stripe CLI script for local webhook forwarding`

**Billing QA (Codex run in test mode)**
- Provider: SaaS checkout → entitlements update; duplicate event → single processing.
- Client: Connect onboarding → status OK; tenant checkout → funds route to connected account; webhooks idempotent; deauthorize → `connectStatus` updates.

---

## Final Acceptance Criteria
1) Cross-tenant/space isolation is enforced server-side.
2) Old URLs redirect to `/client|/provider|/dev|/accounting` equivalents.
3) `/api/tenant/register` is idempotent and applies templates.
4) RBAC: Owner can manage roles; server always enforces.
5) Offline: core flows work offline; replay is idempotent (no dupes).
6) Onboarding: owner reaches first success in < 5 minutes.
7) Billing: provider subscriptions hardened; client billing isolated via Connect; both webhook paths idempotent.
8) Observability: audit logs present for denials, provisioning, replay metrics, and billing events.

---

## Git operations (Codex)
- On successful validation for a task:  
  `git add -A && git commit -m "<message>" && git push`  
- If Git is not authenticated, prompt user to authenticate once, then resume.
- Never commit `.env` or secrets.
