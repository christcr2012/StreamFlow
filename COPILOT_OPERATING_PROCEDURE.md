# Copilot Operating Procedure - Cortiware Monorepo

**Adapted for:** Turborepo • Vercel • Neon PostgreSQL • Prisma  
**Generated:** October 27, 2025

---

## Context & Assumptions

### Monorepo Structure

```
cortiware/
├── apps/
│   ├── tenant-app/          # Main tenant SaaS application
│   ├── provider-portal/     # Provider admin portal (separate Prisma schema)
│   ├── marketing-cortiware/ # Marketing site
│   └── marketing-robinson/  # Marketing site (Robinson AI branding)
├── packages/
│   ├── db/                  # Shared Prisma client (tenant schema)
│   ├── auth-service/        # Authentication utilities
│   ├── stripe-service/      # Stripe integration
│   ├── twilio-service/      # Twilio SMS integration
│   ├── resend-service/      # Email service
│   ├── queue/               # BullMQ job queue
│   ├── wallet/              # Wallet balance management
│   ├── kv/                  # Redis/KV store utilities
│   ├── ui/                  # Shared UI components (Tailwind)
│   ├── ui-components/       # Component library
│   ├── themes/              # Theme system
│   ├── verticals/           # Vertical-specific logic
│   └── config/              # Shared configuration
├── services/
│   └── worker/              # Background job worker
├── prisma/
│   └── schema.prisma        # Tenant database schema (2004 lines, 95 models)
└── docs/                    # Documentation & trace matrices
```

### Technology Stack

- **Monorepo:** Turborepo with npm workspaces
- **Database:** Neon PostgreSQL (pooled + direct connections)
- **ORM:** Prisma v6.16.2
  - **Dual Schema Setup:**
    - `prisma/schema.prisma` → Tenant database (@prisma/client-tenant)
    - `apps/provider-portal/prisma/schema.prisma` → Provider database
- **Deployment:** Vercel (4 apps: tenant-app, provider-portal, 2 marketing sites)
- **Frontend:** Next.js 15 App Router, React 18, Tailwind CSS, SWR
- **Backend:** Next.js API Routes (serverless functions)
- **Auth:** Session-based (cookies), RBAC system
- **Package Manager:** npm (not pnpm - use `npm` in all commands)

### Current State (Post-Audit)

- ✅ **Phase 0-2 Partially Complete:** Onboarding & monetization production-ready
- ⚠️ **Phase 2 Gaps:** 30 models partially implemented (stubs)
- ❌ **Phase 2 Gaps:** 25 models not implemented
- 🎯 **Target:** Complete Phase 3A-4 (CRM functionality, operational features)

### Prisma Source of Truth

The schema is the authority for domain intent. Key characteristics:

- **95 total models** across both schemas
- **Enums:** 16 enums for type safety
- **Relations:** Complex many-to-many, self-referential relationships
- **Phase Markers:** Models marked with `// Phase 1` or `// Phase 2` comments
- **Migration Status:** Schema drift exists (code ahead of database)

### Goal

Autonomous execution through Phase 3A-4 unless a blocker requires user input.

---

## Global Rules

1. **Work Schema-First:** Infer planned features from Prisma models, relations, fields, and enums
2. **Keep Phases in Order:** Do not skip sub-phases
3. **Maintain Trace Matrix:** Map Prisma entities → backend → frontend → tests
4. **Correct Workspace Placement:** Code goes in the right app/package
5. **Incremental PRs:** Each PR passes CI, removes placeholders, implements vertical slice
6. **Dual Schema Awareness:** Tenant vs Provider schemas are separate
7. **Use npm (not pnpm):** Package manager is npm, scripts use `npm run`
8. **Turborepo Cache:** Leverage remote cache for builds
9. **Environment Variables:** Follow existing patterns in turbo.json globalEnv

---

## PHASE 0 — Schema + Documentation Audit & Plan Synthesis

**Status:** ✅ COMPLETE (Audit delivered October 27, 2025)

### Deliverables Created

- ✅ `/PRISMA_SCHEMA_AUDIT.md` - Comprehensive gap analysis (95 models analyzed)
- ✅ `/AUDIT_SUMMARY.md` - Executive summary with priorities
- ✅ `/IMPLEMENTATION_CHECKLIST.md` - Tracking tool with checkboxes
- ✅ `/docs/PHASE_0_DOCS_AUDIT.md` - Documentation ↔ code conformance audit (endpoints, file paths, coverage)

### Existing Reference Documents

- `/UNIMPLEMENTED_FEATURES_SCAN.md` - Previous feature scan
- `/IMPLEMENTATION_STATUS.md` - Status by category
- `/ACTUAL_REMAINING_WORK.md` - 134+ GitHub issues cataloged
- `/PROVIDER_PORTAL_AUDIT.md` - Provider portal gaps

### Phase 0 Sub-Tasks (Completed)

- ✅ 0.1: Parsed both Prisma schemas (tenant + provider)
- ✅ 0.2: Detected 95 models, 30 partial, 25 missing implementations
- ✅ 0.3: Created trace matrix in audit document
- ✅ 0.4: Emitted work plan (Phase 3A-4 roadmap)
- ✅ 0.5: Ready for GitHub issue creation

### Additional Phase 0 Tasks (Ongoing / Repeatable)

- 🔁 0.6: Documentation ↔ Code Conformance Audit
  - Scan all project docs for referenced files and routes
  - Compare against actual repository files and Next.js App Router API routes
  - Identify: documented-but-missing, existing-but-undocumented, endpoint mismatches
  - Output: `/docs/PHASE_0_DOCS_AUDIT.md`
  - Command: `npm run phase:0:docs` or `npm run phase:0:all`

### Next Action

Create `/docs/trace-matrix.md` and `/docs/work-plan.md` from audit findings, then proceed to Phase 1 scaffolding.

---

## PHASE 1 — Scaffolding with Placeholders

**Status:** ⚠️ PARTIALLY COMPLETE (Many stubs exist, need formalization)

**Goal:** Ensure the entire planned system exists structurally with typed placeholders.

### Sub-Phases

#### 1.1 Turborepo Layout Verification

**Current State:** ✅ Mostly complete, needs validation

**Tasks:**

- [x] Verify turbo.json pipeline tasks (build, lint, test, typecheck, prisma:generate)
- [x] Confirm all apps have package.json with proper scripts
- [x] Confirm all packages have tsconfig.json extending root
- [ ] Add missing packages for Phase 3 features if needed
- [ ] Ensure all package.json files have consistent build/dev/test scripts

**Verification Commands:**

```bash
# Validate Turborepo config
npx turbo run build --dry-run

# Check for missing scripts
npm run typecheck
npm run lint
npm run test
```

#### 1.2 DB Layer - Prisma Alignment

**Current State:** ⚠️ Schema drift detected

**Tasks:**

- [ ] Run `npx prisma validate --schema=prisma/schema.prisma`
- [ ] Run `npx prisma validate --schema=apps/provider-portal/prisma/schema.prisma`
- [ ] Review migration status: `npx prisma migrate status`
- [ ] Create Phase 2 migration: `npx prisma migrate dev --name phase_2_models`
- [ ] Generate Prisma clients: `npm run prisma:generate`
- [ ] Verify client generation in packages/db (if applicable)

**Expected Models to Migrate:**

- TimeEntry, Subcontractor, RecurringService, JobCost, VerticalPack (Phase 2)
- Communication, CommunicationThread (Phase 1 scaffolding)
- AIBudget, AIAlert, FeatureFlag, FeatureModule (Phase 1 scaffolding)
- SubscriptionTier, TenantSubscription, TenantUsage (Phase 1 scaffolding)

#### 1.3 Backend - Stub APIs with TODOs

**Current State:** ⚠️ Many stubs exist, need review/completion

**Location:** `apps/tenant-app/src/app/api/`

**Tasks:**

- [ ] Audit existing stub APIs (identified in grep search):
  - `/api/ai/usage` (stub)
  - `/api/ai/alerts` (stub)
  - `/api/communications/threads` (partial)
  - `/api/time-tracking` (stub)
  - `/api/subcontractors` (stub)
  - `/api/recurring-services` (stub)
  - `/api/job-costing` (stub)
  - `/api/notifications` (stub)
  - `/api/reports` (stub)
  - `/api/documents` (stub)
  - `/api/features` (stub)
  - `/api/vertical-packs` (stub)
  - `/api/permissions` (stub)
  - `/api/schedule/jobs` (stub)
  - `/api/schedule/technicians` (stub)

- [ ] Create missing API v2 endpoints:
  - `/api/v2/leads` (currently returns 501)
  - `/api/v2/opportunities` (currently returns [])
  - `/api/v2/organizations` (partial)

- [ ] Ensure all API routes have:
  - Typed request/response interfaces
  - Input validation (Zod schemas)
  - Auth middleware (getAuthContext)
  - Error handling (createSafeErrorResponse)
  - TODO comments for business logic

**Pattern:**

```typescript
// apps/tenant-app/src/app/api/[feature]/route.ts
import { getAuthContext } from "@/lib/auth";
import { createSafeErrorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma"; // or @prisma/client-tenant

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) return createSafeErrorResponse("Unauthorized", 401);

    // TODO: Implement real query
    const data = []; // Placeholder

    return Response.json({ data });
  } catch (error) {
    return createSafeErrorResponse(error);
  }
}
```

#### 1.4 Frontend - Stub Pages/Components

**Current State:** ⚠️ Many stub pages exist with warning banners

**Location:** `apps/tenant-app/src/app/` and `apps/tenant-app/src/components/`

**Tasks:**

- [ ] Remove "Phase 1 stub" warning banners (mark with TODO instead)
- [ ] Create missing CRM pages:
  - `/leads/page.tsx` (list view)
  - `/leads/[id]/page.tsx` (detail view)
  - `/leads/new/page.tsx` (create form)
  - `/contacts/page.tsx`
  - `/opportunities/page.tsx`
  - `/opportunities/[id]/page.tsx`
  - `/organizations/page.tsx`
  - `/fleet/page.tsx`
  - `/admin/page.tsx`
  - `/reports/page.tsx` (different from current stub)

- [ ] Create placeholder components:
  - `LeadList.tsx`, `LeadDetail.tsx`, `LeadForm.tsx`
  - `OpportunityKanban.tsx`, `OpportunityDetail.tsx`
  - `DocumentLibrary.tsx`, `DocumentUpload.tsx`
  - `AnalyticsDashboard.tsx`, `ReportBuilder.tsx`

- [ ] Add Zod schemas for forms:
  - `schemas/lead.ts`, `schemas/opportunity.ts`, etc.
  - Mark validation rules with TODOs

**Pattern:**

```typescript
// apps/tenant-app/src/app/leads/page.tsx
'use client';
import { useState } from 'react';

export default function LeadsPage() {
  // TODO: Fetch real leads from /api/v2/leads
  const [leads, setLeads] = useState([]);

  return (
    <div>
      <h1>Leads</h1>
      {/* TODO: Add filters, pagination, create button */}
      <p>TODO: Wire to API v2</p>
    </div>
  );
}
```

#### 1.5 Infrastructure & Environment

**Current State:** ✅ Mostly complete

**Tasks:**

- [ ] Verify `.env.example` files in each app
- [ ] Update `/docs/env-variables.md` with all required vars:
  - `AUTH_TICKET_HMAC_SECRET`
  - `TENANT_COOKIE_SECRET`
  - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
  - `SENDGRID_API_KEY` or `AWS_SES_*`
  - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
  - `VERCEL_BLOB_READ_WRITE_TOKEN`
- [ ] Document Neon branch strategy (main, preview, development)
- [ ] Add Vercel project configuration notes

#### 1.6 Tests - Placeholder Test Files

**Current State:** ⚠️ Some tests exist, need expansion

**Locations:**

- `/tests/unit/` - Unit tests
- `/tests/e2e/` - E2E tests
- `/tests/e2e-playwright/` - Playwright E2E tests

**Tasks:**

- [ ] Create unit test files for new APIs:
  - `tests/unit/api/v2/leads.test.ts`
  - `tests/unit/api/v2/opportunities.test.ts`
  - `tests/unit/services/ai-usage-tracker.test.ts`
  - `tests/unit/services/communication-sender.test.ts`

- [ ] Create E2E test files:
  - `tests/e2e-playwright/tenant-app/crm/leads.spec.ts`
  - `tests/e2e-playwright/tenant-app/crm/opportunities.spec.ts`
  - `tests/e2e-playwright/tenant-app/time-tracking.spec.ts`

- [ ] Add TODO test cases with example structure:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Leads CRM", () => {
  test("should list leads", async ({ page }) => {
    // TODO: Implement test
    await page.goto("/leads");
    // TODO: Add assertions
  });

  test("should create new lead", async ({ page }) => {
    // TODO: Implement test
  });
});
```

#### 1.7 Update Trace Matrix

**Tasks:**

- [ ] Create `/docs/trace-matrix.md` with 100% structural coverage
- [ ] Format: Model.Field → Backend → Frontend → Tests
- [ ] Example row:

```
| Lead.email | /api/v2/leads (GET/POST) | /leads (list), /leads/new (form) | leads.spec.ts |
```

### Deliverable

A fully compilable repo with no missing files, all TODOs clearly marked, trace matrix at 100% structural coverage.

### Checkpoint Output

```
PHASE 1 SUMMARY
- Files touched: ~50
- New API routes: 3 (v2 endpoints)
- New pages: 7 (CRM pages)
- TODOs added: ~100
- Trace matrix coverage: 100% structural
- Tests scaffolded: 20 files
- Migration created: phase_2_models
Next: PHASE 2 - Implementation
```

---

## PHASE 2 — Implementation & Enhancements

**Status:** 🎯 TARGET PHASE (Focus on Phase 3A-4 from audit)

**Goal:** Replace all TODOs with real implementations, one vertical slice at a time.

### Vertical Slices (Priority Order from Audit)

#### Slice 1: API v2 Endpoints (5 days)

**Models:** Lead, Opportunity, Org  
**Backend:** `/api/v2/leads`, `/api/v2/opportunities`, `/api/v2/organizations`  
**Frontend:** None yet (APIs first)

**Sub-phases:**

- 2.1: Implement Lead CRUD with Prisma
  - Add deduplication by email/phone (identityHash)
  - Add pagination (cursor-based)
  - Add filtering (status, sourceType, date range)
  - Add AI score calculation
- 2.1: Implement Opportunity CRUD
  - Add stage progression logic
  - Add value tracking (estValue, valueType)
  - Add customer relation validation
- 2.1: Complete Organization implementation
  - Add hierarchy support (parent/child orgs)
  - Add contact aggregation
- 2.2: Add input validation (Zod)
- 2.2: Enforce auth (orgId scoping)
- 2.4: Add structured logging
- 2.6: Remove all TODOs from these files

#### Slice 2: AI Usage Tracking (2 days)

**Models:** AIUsageEvent, AIBudget, AIAlert  
**Backend:** `/api/ai/usage`, background service  
**Frontend:** `/settings/ai-usage` (dashboard)

**Sub-phases:**

- 2.1: Implement AIUsageEvent logging
  - Log on every AI API call
  - Store tokens, cost, feature, model
- 2.1: Implement AIBudget updates
  - Update currentSpend on each log
  - Check threshold (alertThreshold %)
- 2.1: Implement AIAlert creation
  - Create alert when threshold hit
  - Create alert on budget exceeded
- 2.2: Add budget enforcement (hardLimit flag)
- 2.3: Wire dashboard to real data
- 2.6: Remove stub implementation

#### Slice 3: Communication System (3 days)

**Models:** Communication, CommunicationThread  
**Backend:** `/api/communications`, Twilio/SendGrid services  
**Frontend:** `/communications` page

**Sub-phases:**

- 2.1: Integrate Twilio SDK (packages/twilio-service)
  - Use org's Twilio credentials from Org model
  - Implement SMS sending
  - Add delivery webhook handler
- 2.1: Integrate SendGrid/AWS SES (packages/resend-service)
  - Use org's email config from Org model
  - Implement email sending
  - Add delivery webhook handler
- 2.1: Implement type detection
  - Check customer preference
  - Fallback to phone → SMS, email → email
- 2.2: Update Communication.status on webhooks
- 2.3: Wire frontend to real sending
- 2.6: Remove "Phase 1 stub" warning

#### Slice 4: CRM Frontend Pages (7-10 days)

**Models:** Lead, Customer, Opportunity, Org  
**Backend:** Uses API v2 endpoints (Slice 1)  
**Frontend:** 7 CRM pages

**Sub-phases:**

- 2.3: Build `/leads` page
  - List view with SWR data fetching
  - Filters (status, source, date)
  - Detail view with activity timeline
  - Create/edit form with validation
  - Convert to customer action
- 2.3: Build `/contacts` page
  - Customer contact list
  - Contact CRUD forms
  - Link to customers
- 2.3: Build `/opportunities` page
  - Kanban board by stage
  - Drag-drop stage changes
  - Value tracking
- 2.3: Build `/organizations` page
  - Org hierarchy tree
  - Contact/opportunity aggregation
- 2.3: Build `/fleet` page
  - Asset/vehicle list
  - Maintenance tracking (if schema exists)
- 2.3: Build `/admin` page
  - User management
  - Org settings
  - Integration configs
- 2.3: Build `/reports` page
  - Sales pipeline charts
  - Lead conversion funnel
  - Revenue analytics
- 2.5: Optimize with pagination, memoization
- 2.6: Remove all TODOs

#### Slice 5: Time Tracking (3 days)

**Models:** TimeEntry  
**Backend:** `/api/time-tracking`  
**Frontend:** `/time-tracking` page

**Sub-phases:**

- 2.1: Implement TimeEntry CRUD
- 2.1: Add GPS capture endpoints
- 2.1: Calculate hours, overtime, pay
- 2.1: Implement approval workflow
- 2.3: Build clock in/out UI
- 2.3: Add GPS permission prompt
- 2.3: Build manager approval interface
- 2.6: Remove stub warning

#### Slice 6: Recurring Services (2 days)

**Models:** RecurringService  
**Backend:** `/api/recurring-services`, cron job  
**Frontend:** `/recurring-services` page

**Sub-phases:**

- 2.1: Implement auto job creation (packages/queue)
- 2.1: Add renewal workflow
- 2.1: Send customer confirmation emails
- 2.3: Add auto-job toggle UI
- 2.3: Add schedule preview
- 2.6: Remove stub warning

#### Slice 7: Job Costing (2 days)

**Models:** JobCost  
**Backend:** `/api/job-costing`  
**Frontend:** `/job-costing` page

**Sub-phases:**

- 2.1: Implement JobCost CRUD
- 2.1: Auto-calculate variance, profit margin
- 2.1: Add budget threshold alerts
- 2.3: Build cost entry forms
- 2.3: Add variance/profit charts
- 2.6: Remove stub warning

#### Slice 8: Subcontractor Management (1 day)

**Models:** Subcontractor  
**Backend:** `/api/subcontractors`  
**Frontend:** `/subcontractors` page

**Sub-phases:**

- 2.1: Implement Subcontractor CRUD
- 2.1: Add insurance validation
- 2.3: Add document upload UI
- 2.3: Add rating display
- 2.6: Remove stub warning

### Implementation Standards

#### Code Quality

- **TypeScript:** Strict mode, no `any` types
- **Error Handling:** Use `createSafeErrorResponse()` wrapper
- **Auth:** Every API route must call `getAuthContext()`
- **Validation:** Zod schemas for all inputs
- **Prisma:** Use transactions for multi-step operations
- **Logging:** Structured JSON logs with context

#### Patterns

```typescript
// API Route Pattern
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const leadSchema = z.object({
  email: z.string().email().optional(),
  company: z.string().min(1),
  // ... more fields
});

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = leadSchema.parse(body);

    const lead = await prisma.lead.create({
      data: {
        ...validated,
        orgId: auth.orgId,
        identityHash: generateHash(validated.email, validated.phone),
      },
    });

    return Response.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Deliverable

Fully functional vertical slices with no TODOs, ready for testing.

### Checkpoint Output (Per Slice)

```
SLICE {N} COMPLETE
- Model: {ModelName}
- Backend files: {count}
- Frontend files: {count}
- Tests added: {count}
- TODOs removed: {count}
- Migration applied: {yes/no}
Next: Slice {N+1} or PHASE 3
```

---

## PHASE 3 — Validation, Testing, and Release Readiness

**Goal:** Guarantee correctness and deployability.

### Sub-Phases

#### 3.1 Write/Complete Tests (Per Slice)

**Tasks:**

- [ ] Unit tests for API routes (80% coverage target)
- [ ] Unit tests for services (business logic)
- [ ] Integration tests for Prisma queries
- [ ] E2E tests for critical paths (Playwright)

**Commands:**

```bash
npm run test:unit
npm run test:e2e:playwright
```

#### 3.2 Run Tests Locally & Fix Failures

**Tasks:**

- [ ] Run all unit tests: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e:playwright`
- [ ] Fix failures until green
- [ ] Target: ~80-90% critical path coverage

#### 3.3 Add/Update CI (GitHub Actions)

**Tasks:**

- [ ] Ensure `.github/workflows/ci.yml` includes:
  - `npm install`
  - `npm run build`
  - `npm run typecheck`
  - `npx prisma validate`
  - `npm run lint`
  - `npm run test`
  - Check for TODO/PLACEHOLDER in code (exclude /docs)

**Example Check:**

```yaml
- name: Check for placeholders
  run: |
    if grep -r "TODO\|PLACEHOLDER" --exclude-dir={docs,node_modules,.next} .; then
      echo "Found TODO/PLACEHOLDER in code"
      exit 1
    fi
```

#### 3.4 Verify Vercel Preview Deploy

**Tasks:**

- [ ] Push to GitHub, trigger Vercel preview
- [ ] Run smoke E2E against preview URL
- [ ] Verify Neon database connection
- [ ] Check Prisma client generation in Vercel build

**Command:**

```bash
npm run test:e2e:vercel
```

#### 3.5 Final Documentation

**Tasks:**

- [ ] Update `/docs/trace-matrix.md` (100% implemented)
- [ ] Update `/docs/work-plan.md` (mark completed)
- [ ] Update `/README.md` with new features
- [ ] Update `/docs/env-variables.md` with new vars
- [ ] Create runbook for deployments

### Deliverable

Green CI, passing E2E on Vercel preview, documentation updated, zero placeholders in code.

### Checkpoint Output

```
PHASE 3 SUMMARY
- Tests written: {count}
- Tests passing: {count}/{count}
- CI status: GREEN
- Preview deploy: SUCCESS
- E2E smoke tests: PASSING
- Placeholders remaining: 0
- Documentation updated: YES
Next: Production deployment
```

---

## Interaction Protocol

### Autonomy

- **Default:** Proceed through sub-phases autonomously
- **Progress Updates:** Output checkpoint summary at end of each phase
- **Continue Automatically:** Unless blocker detected

### Blockers (Pause & Request Input)

When blocked, create GitHub issue with label `blocker` and include:

- What is blocked
- Required information/action
- Impact on timeline

**Common Blockers:**

- Missing environment secrets (API keys)
- Prisma migration conflicts
- Failing CI that can't be auto-fixed
- Breaking changes requiring architectural decision

### Progress Output Format

```
PHASE {N} SUMMARY
- Files touched: {count}
- New modules: [list]
- TODOs remaining: {count}
- Tests (added/passed): {added}/{passed}
- Open issues created: {count}
- Duration: {hours}
Next: PHASE {N+1} [auto-starting in 5s]
```

---

## Cortiware-Specific Conventions

### Package Manager

✅ **Use `npm` (not pnpm)**

```bash
npm install
npm run dev
npm run build
```

### Turborepo Commands

```bash
npm run dev           # Run all apps in parallel
npm run build         # Build all apps
npm run lint          # Lint all apps
npm run typecheck     # TypeScript check all apps
npm run test          # Run all tests
```

### Prisma Commands

```bash
# Tenant schema
npm run prisma:migrate:tenant
npm run prisma:studio:tenant
npm run prisma:generate

# Provider schema
npm run prisma:migrate:provider
npm run prisma:studio:provider
```

### Testing Commands

```bash
npm run test:unit                  # Unit tests
npm run test:e2e:playwright        # Playwright E2E
npm run test:e2e:tenant            # Tenant app E2E
npm run test:e2e:provider          # Provider portal E2E
npm run test:e2e:all               # All tests
```

### Environment Files

- Root: `.env` (shared vars)
- Per app: `apps/{app}/.env.local` (app-specific)
- Keep secrets in Vercel environment variables
- Update `/docs/env-variables.md` when adding new vars

### Neon Database

- **Pooled Connection:** Use for queries (DATABASE_URL)
- **Direct Connection:** Use for migrations (DIRECT_DATABASE_URL)
- **Branch Strategy:** main (production), preview (PR previews), dev (local)
- **Migration Pattern:** Idempotent, test on dev branch first

### Shared Packages

- Import from packages: `import { X } from '@/packages/db'` or relative paths
- Prisma client: Generated in `node_modules/@prisma/client-tenant`
- Shared types: Define in packages/db or packages/config
- Shared UI: Use packages/ui or packages/ui-components

### File Naming

- API routes: `route.ts` (Next.js 15 App Router)
- Pages: `page.tsx`
- Client components: `{name}-client.tsx` (for 'use client')
- Services: `{name}.service.ts`
- Types: `{name}.types.ts`
- Schemas: `{name}.schema.ts` (Zod)

### Code Organization

```
apps/tenant-app/src/
├── app/
│   ├── api/           # API routes (route.ts)
│   ├── {page}/        # Pages (page.tsx)
│   └── layout.tsx
├── components/        # React components
├── lib/               # Utilities, auth, prisma
├── schemas/           # Zod validation schemas
└── types/             # TypeScript types
```

---

## Current Phase Status

### Completed

- ✅ **Phase 0:** Schema audit complete, gap analysis done
- ✅ **Phase 1 (Partial):** Many stubs exist, need formalization
- ⚠️ **Phase 2 (Partial):** Onboarding & monetization production-ready

### Active Focus

🎯 **Phase 1 Completion:** Formalize all stubs, create missing scaffolds  
🎯 **Phase 2 Implementation:** Implement vertical slices per audit priorities

### Timeline

- **Phase 1 Completion:** 1-2 weeks
- **Phase 2 Implementation:** 8-12 weeks (per audit estimate)
- **Phase 3 Validation:** 2-3 weeks

---

## Quick Reference

### Starting a New Slice

1. Review Prisma model(s) for the slice
2. Check trace matrix for existing coverage
3. Implement backend (API + service + repository)
4. Implement frontend (page + components + forms)
5. Write tests (unit + integration + e2e)
6. Update trace matrix
7. Remove all TODOs
8. Output checkpoint summary

### Before Each Commit

```bash
npm run typecheck    # No TypeScript errors
npm run lint         # No lint errors
npm run test         # All tests pass
```

### Before Each PR

```bash
npm run prisma:generate     # Regenerate Prisma clients
npm run build               # Ensure builds pass
npm run test:e2e:all        # Full E2E suite
```

### Deployment Checklist

- [ ] Prisma migration applied to Neon
- [ ] Environment variables set in Vercel
- [ ] Feature flags configured
- [ ] Vercel preview deploy successful
- [ ] E2E smoke tests pass on preview
- [ ] Documentation updated

---

**Ready to execute Phase 1 completion and Phase 2 implementation per audit priorities.**
