# Phase 1 Scaffold Plan

**Generated:** 2025-10-28T00:04:18.409Z

## Executive Summary

### Path Analysis

- Total documented paths not found: 363
- Legitimate missing files: 115
- External references (ignore): 22
- Glob patterns (documentation): 36

### Endpoint Analysis

- Total endpoints documented but not implemented: 76
- High priority (Phase 1): 15
- Medium priority (Phase 1): 24
- Low priority (Phase 2+): 37

## Missing Endpoints by Category

### Tenant Portal (14 endpoints)

- `/api/cleaning/billing` - Phase 2 (high priority)
- `/api/cleaning/billing/generate-invoice` - Phase 2 (high priority)
- `/api/cleaning/checklist-templates` - Phase 2 (high priority)
- `/api/cleaning/contracts/[id]` - Phase 2 (high priority)
- `/api/cleaning/estimates/[id]` - Phase 2 (high priority)
- `/api/cleaning/estimates/[id]/ai` - Phase 2 (high priority)
- `/api/cleaning/leads/[id]` - Phase 2 (high priority)
- `/api/cleaning/qa/inspections` - Phase 2 (high priority)
- `/api/cleaning/qa/inspections/[id]` - Phase 2 (high priority)
- `/api/cleaning/work-orders/[id]` - Phase 2 (high priority)
- `/api/cleaning/work-orders/[id]/events` - Phase 2 (high priority)
- `/api/v2/leads/[id]` - Phase 1 (high priority)
- `/api/v2/opportunities/[id]` - Phase 1 (high priority)
- `/api/v2/organizations/[id]` - Phase 1 (high priority)

### Analyst Portal (8 endpoints)

- `/api/analyst/analytics/revenue` - Phase 1 (medium priority)
- `/api/analyst/analytics/tenants` - Phase 1 (medium priority)
- `/api/analyst/analytics/usage` - Phase 1 (medium priority)
- `/api/analyst/audit/export` - Phase 1 (medium priority)
- `/api/analyst/audit/logs` - Phase 1 (medium priority)
- `/api/analyst/billing/reports` - Phase 1 (medium priority)
- `/api/analyst/incidents` - Phase 1 (medium priority)
- `/api/analyst/metrics` - Phase 1 (medium priority)

### Developer Portal (7 endpoints)

- `/api/developer/ai-assistant/chat` - Phase 1 (medium priority)
- `/api/developer/ai-assistant/generate` - Phase 1 (medium priority)
- `/api/developer/api-explorer/endpoints` - Phase 1 (medium priority)
- `/api/developer/api-explorer/test` - Phase 1 (medium priority)
- `/api/developer/monitoring/infrastructure` - Phase 1 (medium priority)
- `/api/developer/usage/metrics` - Phase 1 (medium priority)
- `/api/developer/webhooks` - Phase 1 (medium priority)

### Owner Portal (9 endpoints)

- `/api/owner/billing/invoices` - Phase 1 (medium priority)
- `/api/owner/billing/pay-now` - Phase 1 (medium priority)
- `/api/owner/billing/payments` - Phase 1 (medium priority)
- `/api/owner/import` - Phase 1 (medium priority)
- `/api/owner/payment-methods/setup` - Phase 1 (medium priority)
- `/api/owner/subscription/change` - Phase 1 (medium priority)
- `/api/owner/subscription/portal` - Phase 1 (medium priority)
- `/api/owner/usage/export` - Phase 1 (medium priority)
- `/api/owner/usage/series` - Phase 1 (medium priority)

### Federation Portal (1 endpoints)

- `/api/federation/escalation` - Phase 1 (high priority)

### Other Portal (37 endpoints)

- `/api/[feature]` - Phase 2 (low priority)
- `/api/admin` - Phase 2 (low priority)
- `/api/analyst` - Phase 2 (low priority)
- `/api/auth` - Phase 2 (low priority)
- `/api/auth/2fa/setup` - Phase 2 (low priority)
- `/api/auth/2fa/verify` - Phase 2 (low priority)
- `/api/billing` - Phase 2 (low priority)
- `/api/billing/get` - Phase 2 (low priority)
- `/api/billing/invoices` - Phase 2 (low priority)
- `/api/billing/list` - Phase 2 (low priority)
- `/api/developer` - Phase 2 (low priority)
- `/api/fed` - Phase 2 (low priority)
- `/api/federation` - Phase 2 (low priority)
- `/api/health` - Phase 2 (low priority)
- `/api/integrations/stripe/create-hosted-invoice` - Phase 2 (low priority)
- `/api/leads/[id]/invoices` - Phase 2 (low priority)
- `/api/login` - Phase 2 (low priority)
- `/api/monetization/subscriptions` - Phase 2 (low priority)
- `/api/monetization]` - Phase 2 (low priority)
- `/api/onboarding` - Phase 2 (low priority)
- `/api/onboarding/accept` - Phase 2 (low priority)
- `/api/onboarding/accept-public` - Phase 2 (low priority)
- `/api/onboarding/validate` - Phase 2 (low priority)
- `/api/onboarding/verify` - Phase 2 (low priority)
- `/api/opportunities` - Phase 2 (low priority)
- `/api/opportunities]` - Phase 2 (low priority)
- `/api/owner` - Phase 2 (low priority)
- `/api/packs/purchase` - Phase 2 (low priority)
- `/api/provider` - Phase 2 (low priority)
- `/api/resource` - Phase 2 (low priority)
- `/api/resource/[id]` - Phase 2 (low priority)
- `/api/settings` - Phase 2 (low priority)
- `/api/user/change-email` - Phase 2 (low priority)
- `/api/v1/federation/webhook/[id]` - Phase 2 (low priority)
- `/api/v1/federation/webhook/register` - Phase 2 (low priority)
- `/api/v2` - Phase 2 (low priority)
- `/api/wallet/topup` - Phase 2 (low priority)

## Missing Files

These files are referenced in docs but not found in the codebase:

- `apps/<app>/src/app/api/<segments>/route.ts`
- `apps/admin`
- `apps/backend/app.js`
- `apps/customer-portal`
- `apps/developer-portal`
- `apps/marketing-cortiware/src/config/pricing.ts`
- `apps/provider-portal/.env`
- `apps/provider-portal/import-wizard/`
- `apps/provider-portal/lib/prisma.ts`
- `apps/provider-portal/next.config.mjs`
- `apps/provider-portal/roofing-takeoff/`
- `apps/provider-portal/src/app/(admin)/admin/`
- `apps/provider-portal/src/app/(analyst)/analyst/`
- `apps/provider-portal/src/app/(analyst)/analyst/dashboard/page.tsx`
- `apps/provider-portal/src/app/(authenticated)/admin/pricing/page.tsx`
- `apps/provider-portal/src/app/(owner)/infrastructure/page.tsx`
- `apps/provider-portal/src/app/(provider)/dashboard/`
- `apps/provider-portal/src/app/(provider)/import-wizard/`
- `apps/provider-portal/src/app/(provider)/roofing-takeoff/`
- `apps/provider-portal/src/app/api/analyst/`
- `apps/provider-portal/src/app/api/provider/events/route.ts`
- `apps/provider-portal/src/app/api/provider/migrate/route.ts`
- `apps/provider-portal/src/app/provider/clients/ClientEditModal.tsx`
- `apps/provider-portal/src/app/provider/dashboard/`
- `apps/provider-portal/src/app/provider/federation/FederationClient.tsx`
- `apps/provider-portal/src/app/provider/federation/ProviderEditModal.tsx`
- `apps/provider-portal/src/app/provider/incidents/IncidentDetailsModal.tsx`
- `apps/provider-portal/src/app/provider/incidents/IncidentEditModal.tsx`
- `apps/provider-portal/src/app/provider/infrastructure/`
- `apps/provider-portal/src/app/provider/invoices/InvoiceDetailsModal.tsx`
- `apps/provider-portal/src/app/provider/invoices/InvoiceListTable.tsx`
- `apps/provider-portal/src/app/provider/onboarding/page.tsx`
- `apps/provider-portal/src/app/provider/revenue/page.tsx`
- `apps/provider-portal/src/app/provider/sam-gov/`
- `apps/provider-portal/src/app/provider/settings/GeneralSettings.tsx`
- `apps/provider-portal/src/app/provider/settings/NotificationSettings.tsx`
- `apps/provider-portal/src/app/provider/settings/SecuritySettings.tsx`
- `apps/provider-portal/src/app/provider/settings/integrations/page.tsx`
- `apps/provider-portal/src/app/provider/settings/security/page.tsx`
- `apps/provider-portal/src/components/AdminNav.tsx`
- `apps/provider-portal/src/components/AnalystNav.tsx`
- `apps/provider-portal/src/components/DeveloperNav.tsx`
- `apps/provider-portal/src/components/ai-usage-chart.tsx`
- `apps/provider-portal/src/lib/federation/__tests__/idempotency.test.ts`
- `apps/provider-portal/src/lib/federation/__tests__/ratelimit.test.ts`
- `apps/provider-portal/src/lib/federation/__tests__/rbac-middleware.test.ts`
- `apps/provider-portal/src/lib/federation/__tests__/signature.test.ts`
- `apps/provider-portal/src/lib/federation/__tests__/verify.test.ts`
- `apps/provider-portal/src/lib/federation/__tests__/webhooks.test.ts`
- `apps/provider-portal/src/lib/tenant-scope.ts`
- `apps/staff-mobile`
- `apps/tenant-app/.env.local`
- `apps/tenant-app/lib/prisma.ts`
- `apps/tenant-app/prisma/migrations/YYYYMMDD_add_cleaning_models/migration.sql`
- `apps/tenant-app/prisma/schema.prisma`
- `apps/tenant-app/src/app/(app)/leads/sam-gov/`
- `apps/tenant-app/src/app/(app)/leads/sam-gov/SamGovEnhanced.tsx`
- `apps/tenant-app/src/app/(app)/leads/sam-gov/page.tsx`
- `apps/tenant-app/src/app/(tenant)/cleaning/qa/inspections/page.tsx`
- `apps/tenant-app/src/app/(tenant)/cleaning/schedule/page.tsx`
- `apps/tenant-app/src/app/(tenant)/customers/`
- `apps/tenant-app/src/app/(tenant)/leads/sam-gov/`
- `apps/tenant-app/src/app/api/cron/cleaning/create-inspections/route.ts`
- `apps/tenant-app/src/app/api/cron/cleaning/expand-schedules/route.ts`
- `apps/tenant-app/src/app/api/cron/cleaning/generate-invoices/route.ts`
- `apps/tenant-app/src/app/api/federation/`
- `apps/tenant-app/src/app/api/opportunities/`
- `apps/tenant-app/src/app/api/sam-gov/`
- `apps/tenant-app/src/app/api/v2/auth/login/route.ts`
- `apps/tenant-app/src/app/api/v2/auth/logout/route.ts`
- `apps/tenant-app/src/app/api/v2/me/route.ts`
- `apps/tenant-app/src/app/api/v2/sam-gov/`
- `apps/tenant-app/src/app/api/v2/sam-gov/analytics/route.ts`
- `apps/tenant-app/src/app/api/v2/sam-gov/import/route.ts`
- `apps/tenant-app/src/app/api/v2/sam-gov/saved-searches/route.ts`
- `apps/tenant-app/src/app/api/v2/sam-gov/search/route.ts`
- `apps/tenant-app/src/app/api/v2/themes/route.ts`
- `apps/tenant-app/src/app/customers/new-customer-client.tsx`
- `apps/tenant-app/src/app/invoices/new-invoice-client.tsx`
- `apps/tenant-app/src/app/jobs/new-job-client.tsx`
- `apps/tenant-app/src/app/leads/sam-gov/`
- `apps/tenant-app/src/app/recurring-invoices/recurring-invoices-client.tsx`
- `apps/tenant-app/src/components/ui/skeleton.tsx`
- `apps/tenant-app/src/lib/validations/leads.ts`
- `apps/tenant-app/src/lib/validations/opportunities.ts`
- `apps/tenant-app/src/lib/validations/organizations.ts`
- `apps/tenant-app/src/services/leads.service.ts`
- `apps/tenant-app/src/services/opportunities.service.ts`
- `apps/tenant-app/src/services/organizations.service.ts`
- `apps/tenant-app/src/services/sam-gov.service.ts`
- `apps/web`
- `apps/{app}/.env.local`
- `packages/@cortiware/services/`
- `packages/auth-service/src/csrf.ts`
- `packages/backend/`
- `packages/backend/.lintstagedrc.json`
- `packages/config/src/env.ts`
- `packages/core`
- `packages/fast-check`
- `packages/frontend/`
- `packages/frontend/.lintstagedrc.json`
- `packages/github-mcp/README.md`
- `packages/google-workspace-mcp/README.md`
- `packages/neon-mcp/README.md`
- `packages/pricing`
- `packages/types`
- `packages/ui-utils`
- `packages/ui/utils`
- `packages/vercel-mcp/EXPANSION_COMPLETE.md`
- `packages/verticals/cleaning/estimator.ts`
- `packages/verticals/cleaning/pricebook.json`
- `packages/verticals/src/packs/my-vertical.ts`
- `prisma/migrations/20250120_materialized_views/migration.sql`
- `prisma/migrations/add_photo_caption_and_public_ids`
- `prisma/seed-leads.ts`

## Phase 1 Action Items

### High Priority Scaffolds (Required for Phase 1 Completion)

Total: 15 endpoint scaffolds

#### Tenant App API Routes (14)

Location: `apps/tenant-app/src/app/api/`

- [ ] Create `cleaning/billing/route.ts`
  - Endpoint: `/api/cleaning/billing`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/billing/generate-invoice/route.ts`
  - Endpoint: `/api/cleaning/billing/generate-invoice`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/checklist-templates/route.ts`
  - Endpoint: `/api/cleaning/checklist-templates`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/contracts/[id]/route.ts`
  - Endpoint: `/api/cleaning/contracts/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/estimates/[id]/route.ts`
  - Endpoint: `/api/cleaning/estimates/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/estimates/[id]/ai/route.ts`
  - Endpoint: `/api/cleaning/estimates/[id]/ai`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/leads/[id]/route.ts`
  - Endpoint: `/api/cleaning/leads/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/qa/inspections/route.ts`
  - Endpoint: `/api/cleaning/qa/inspections`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/qa/inspections/[id]/route.ts`
  - Endpoint: `/api/cleaning/qa/inspections/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/work-orders/[id]/route.ts`
  - Endpoint: `/api/cleaning/work-orders/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `cleaning/work-orders/[id]/events/route.ts`
  - Endpoint: `/api/cleaning/work-orders/[id]/events`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `v2/leads/[id]/route.ts`
  - Endpoint: `/api/v2/leads/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `v2/opportunities/[id]/route.ts`
  - Endpoint: `/api/v2/opportunities/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2
- [ ] Create `v2/organizations/[id]/route.ts`
  - Endpoint: `/api/v2/organizations/[id]`
  - Auth: getAuthContext()
  - Placeholder: PLACEHOLDER_block_phase2

#### Federation API Routes (1)

Location: `apps/provider-portal/src/app/api/fed/` or `apps/tenant-app/src/app/api/federation/`

- [ ] Create route for `/api/federation/escalation`
  - Determine correct app (provider vs tenant)
  - Add federation auth middleware

### Medium Priority Scaffolds (24)

Analyst, Developer, Owner portals - can be scaffolded after high priority:

- `/api/analyst/analytics/revenue` (analyst)
- `/api/analyst/analytics/tenants` (analyst)
- `/api/analyst/analytics/usage` (analyst)
- `/api/analyst/audit/export` (analyst)
- `/api/analyst/audit/logs` (analyst)
- `/api/analyst/billing/reports` (analyst)
- `/api/analyst/incidents` (analyst)
- `/api/analyst/metrics` (analyst)
- `/api/developer/ai-assistant/chat` (developer)
- `/api/developer/ai-assistant/generate` (developer)
- `/api/developer/api-explorer/endpoints` (developer)
- `/api/developer/api-explorer/test` (developer)
- `/api/developer/monitoring/infrastructure` (developer)
- `/api/developer/usage/metrics` (developer)
- `/api/developer/webhooks` (developer)
- `/api/owner/billing/invoices` (owner)
- `/api/owner/billing/pay-now` (owner)
- `/api/owner/billing/payments` (owner)
- `/api/owner/import` (owner)
- `/api/owner/payment-methods/setup` (owner)
- `/api/owner/subscription/change` (owner)
- `/api/owner/subscription/portal` (owner)
- `/api/owner/usage/export` (owner)
- `/api/owner/usage/series` (owner)

## Scaffold Patterns

### API Route Scaffold Template

```typescript
// apps/[app]/src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const schema = z.object({
  // TODO Phase 2: Add validation schema
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PLACEHOLDER_block_phase2: Implement real query
    // Phase 2: Query from Prisma, apply orgId scoping, return data
    const data = [];

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/[feature]");
  }
}
```
