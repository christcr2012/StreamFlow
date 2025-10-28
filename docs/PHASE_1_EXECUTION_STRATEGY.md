# Phase 1 Execution Strategy - LLM-Optimized Approach

**Generated:** October 27, 2025  
**Purpose:** Break Phase 1 into micro-phases that leverage LLM strengths and mitigate weaknesses

---

## Core Principles

### Leverage Strengths

1. **Pattern Mastery**: Deeply study 2-3 existing "canonical" examples before creating new files
2. **Batch Consistency**: Create 5-8 related files at a time (small enough to verify, large enough for efficiency)
3. **Immediate Verification**: Typecheck + lint after each batch
4. **Self-Correction**: Fix issues immediately before moving to next batch

### Mitigate Weaknesses

1. **Avoid Context Overload**: Never create >10 files without verification
2. **Prevent Drift**: Re-read the pattern file before each batch
3. **Checkpoint State**: Update todo after each batch completion
4. **Early Error Detection**: Run quality gates frequently

---

## Phase 1 Micro-Phases

### Phase 1.0: Foundation & Pattern Study (15 min)

**Goal:** Establish perfect understanding of patterns before creating anything

**Tasks:**

- [ ] Read 3 existing provider portal API routes to extract canonical pattern
- [ ] Read 3 existing tenant API routes to extract canonical pattern
- [ ] Document the exact auth, validation, error handling patterns
- [ ] Create "pattern template files" to copy from
- [ ] Verify understanding with user if any ambiguity

**Deliverable:** `docs/PHASE_1_PATTERNS.md` with exact code templates

**Success Criteria:** Can recite the pattern from memory

---

### Phase 1.1: Provider Portal - Core Federation (Batch 1)

**Goal:** Create 8 most critical federation routes

**Routes:**

1. `/api/provider/federation/route.ts` (GET - list federations)
2. `/api/provider/federation/keys/route.ts` (GET, POST)
3. `/api/provider/federation/keys/[id]/route.ts` (GET, PUT, DELETE)
4. `/api/provider/federation/oidc/route.ts` (GET, POST)
5. `/api/provider/federation/oidc/test/route.ts` (POST)
6. `/api/provider/federation/providers/route.ts` (GET, POST)
7. `/api/provider/federation/providers/[id]/route.ts` (GET, PUT, DELETE)

**Pattern:** Provider session auth, no orgId scoping (cross-tenant), PLACEHOLDER_block_phase2

**Verification:**

```powershell
npm run typecheck
npm run lint
git add apps/provider-portal/src/app/api/provider/federation
git commit -m "Phase 1.1: Provider federation API scaffolds"
```

**Success Criteria:**

- All 7 routes compile
- 0 TypeScript errors
- 0 lint errors
- Can import and call each route's exports

---

### Phase 1.2: Provider Portal - Monetization (Batch 2)

**Goal:** Create 8 monetization routes

**Routes:**

1. `/api/provider/monetization/route.ts` (GET)
2. `/api/provider/monetization/coupons/route.ts` (GET, POST)
3. `/api/provider/monetization/global-config/route.ts` (GET, PUT)
4. `/api/provider/monetization/invites/route.ts` (GET, POST)
5. `/api/provider/monetization/offers/route.ts` (GET, POST)
6. `/api/provider/monetization/overrides/route.ts` (GET, POST)
7. `/api/provider/monetization/plans/route.ts` (GET, POST)
8. `/api/provider/monetization/prices/route.ts` (GET, POST)

**Pattern:** Same as 1.1

**Verification:** Same as 1.1

---

### Phase 1.3: Provider Portal - Incidents & Leads (Batch 3)

**Goal:** Create 8 incident/lead management routes

**Routes:**

1. `/api/provider/incidents/route.ts` (GET, POST)
2. `/api/provider/incidents/[id]/route.ts` (GET, PUT, DELETE)
3. `/api/provider/incidents/[id]/escalate/route.ts` (POST)
4. `/api/provider/leads/route.ts` (GET)
5. `/api/provider/leads/[id]/dispute/route.ts` (POST)
6. `/api/provider/clients/route.ts` (GET, POST)
7. `/api/provider/clients/[id]/route.ts` (GET, PUT, DELETE)

**Verification:** Same as 1.1

---

### Phase 1.4: Provider Portal - Revenue & Analytics (Batch 4)

**Goal:** Create 8 revenue/analytics routes

**Routes:**

1. `/api/provider/revenue/cohorts/route.ts` (GET)
2. `/api/provider/revenue/forecast/route.ts` (GET)
3. `/api/provider/revenue/summary/route.ts` (GET)
4. `/api/provider/analytics/snapshot/route.ts` (GET)
5. `/api/provider/tenants/route.ts` (GET)
6. `/api/provider/tenants/[id]/notes/route.ts` (GET, POST)
7. `/api/provider/tenants/[id]/overview/route.ts` (GET)
8. `/api/provider/tenants/[id]/tasks/route.ts` (GET, POST)

**Verification:** Same as 1.1

---

### Phase 1.5: Provider Portal - Remaining (Batch 5)

**Goal:** Complete remaining provider routes

**Routes:**

1. `/api/provider/action-center/route.ts` (GET)
2. `/api/provider/billing/retry/route.ts` (POST)
3. `/api/provider/billing/retry/run/route.ts` (POST)
4. `/api/provider/billing/invoices/[id]/remind/route.ts` (POST)
5. `/api/provider/integrations/route.ts` (GET, POST)
6. `/api/provider/invoices/[id]/pdf/route.ts` (GET)
7. `/api/provider/onboarding/[tenantId]/route.ts` (GET, PUT)
8. `/api/provider/onboarding/templates/route.ts` (GET, POST)
9. `/api/provider/tasks/route.ts` (GET, POST)
10. `/api/provider/subscriptions/[id]/extend/route.ts` (POST)
11. `/api/provider/usage/feature/route.ts` (GET)

**Verification:** Same as 1.1 + run full provider portal build

---

### Phase 1.6: Federation API (Batch 6)

**Goal:** Create cross-cutting federation routes

**Routes:**

1. `/api/fed/developers/route.ts` (GET)
2. `/api/fed/developers/diagnostics/route.ts` (GET)
3. `/api/fed/providers/route.ts` (GET)
4. `/api/fed/providers/tenants/route.ts` (GET)
5. `/api/fed/providers/tenants/[id]/route.ts` (GET)
6. `/api/federation/analytics/route.ts` (GET)
7. `/api/federation/billing/invoice/route.ts` (POST)
8. `/api/federation/escalation/route.ts` (POST)
9. `/api/federation/events/route.ts` (GET, POST)
10. `/api/federation/status/route.ts` (GET)
11. `/api/federation/usage/route.ts` (GET)

**Decision Point:** Determine if these go in provider-portal or tenant-app based on existing federation architecture

**Verification:** Same as 1.1

---

### Phase 1.7: Tenant App v2 API (Batch 7)

**Goal:** Complete v2 CRM endpoints

**Routes:**

1. `/api/v2/leads/[id]/route.ts` (GET, PUT, DELETE)
2. `/api/v2/opportunities/[id]/route.ts` (GET, PUT, DELETE)
3. `/api/v2/organizations/[id]/route.ts` (GET, PUT, DELETE)

**Pattern:** Tenant auth with orgId scoping, getAuthContext()

**Verification:** Same as 1.1

---

### Phase 1.8: Analyst Portal API (Batch 8)

**Goal:** Create analyst dashboard routes

**Routes:**

1. `/api/analyst/analytics/revenue/route.ts` (GET)
2. `/api/analyst/analytics/tenants/route.ts` (GET)
3. `/api/analyst/analytics/usage/route.ts` (GET)
4. `/api/analyst/audit/export/route.ts` (GET)
5. `/api/analyst/audit/logs/route.ts` (GET)
6. `/api/analyst/billing/reports/route.ts` (GET)
7. `/api/analyst/incidents/route.ts` (GET)
8. `/api/analyst/metrics/route.ts` (GET)

**Decision Point:** Determine if analyst routes go in provider-portal or separate app

**Verification:** Same as 1.1

---

### Phase 1.9: Developer Portal API (Batch 9)

**Goal:** Create developer tools routes

**Routes:**

1. `/api/developer/ai-assistant/chat/route.ts` (POST)
2. `/api/developer/ai-assistant/generate/route.ts` (POST)
3. `/api/developer/api-explorer/endpoints/route.ts` (GET)
4. `/api/developer/api-explorer/test/route.ts` (POST)
5. `/api/developer/monitoring/infrastructure/route.ts` (GET)
6. `/api/developer/usage/metrics/route.ts` (GET)
7. `/api/developer/webhooks/route.ts` (GET, POST)

**Decision Point:** Determine if developer routes go in provider-portal or separate section

**Verification:** Same as 1.1

---

### Phase 1.10: Owner Portal API (Batch 10)

**Goal:** Create tenant owner self-service routes

**Routes:**

1. `/api/owner/billing/invoices/route.ts` (GET)
2. `/api/owner/billing/pay-now/route.ts` (POST)
3. `/api/owner/billing/payments/route.ts` (GET)
4. `/api/owner/import/route.ts` (POST)
5. `/api/owner/payment-methods/setup/route.ts` (POST)
6. `/api/owner/subscription/change/route.ts` (POST)
7. `/api/owner/subscription/portal/route.ts` (GET)
8. `/api/owner/usage/export/route.ts` (GET)
9. `/api/owner/usage/series/route.ts` (GET)

**Pattern:** Tenant auth + owner role check

**Verification:** Same as 1.1

---

### Phase 1.11: Critical Page Scaffolds (Batch 11)

**Goal:** Create essential page.tsx scaffolds

**Strategy:** Extract list of missing pages from 113 files, prioritize by:

1. Provider portal pages (dashboard, clients, incidents, revenue)
2. Analyst portal pages
3. Developer portal pages
4. Owner/Admin pages

**Batch Size:** 8-10 pages at a time

**Verification:** Typecheck + lint after each 8-10 pages

---

### Phase 1.12: Component & Service Scaffolds (Batch 12)

**Goal:** Create remaining component/service scaffolds

**Strategy:** From 113 missing files, create:

- Modal components (ClientEditModal, IncidentDetailsModal, etc.)
- Service files (import wizard, roofing takeoff services)
- Utility files

**Batch Size:** 8-10 files at a time

**Verification:** Same as above

---

### Phase 1.13: Comprehensive Verification

**Goal:** Prove Phase 1 is 100% complete

**Tasks:**

1. Run `npm run typecheck` - MUST PASS
2. Run `npm run lint` - MUST PASS (warnings OK)
3. Run `npm run ci:placeholders` - Check classification:
   - 0 ACTIONABLE items
   - All TODOs marked as BLOCKED with Phase 2 markers
4. Run `npm run phase:0:all` - Re-audit docs
5. Review `docs/PHASE_0_DOCS_AUDIT.md`:
   - "Endpoints documented but not implemented" should be 0 or very low
   - Any remaining should be Phase 2+ items
6. Run `npm run build` - Ensure full build succeeds
7. Review `.ai-placeholders/placeholders.json` - All items should be BLOCKED

**Success Criteria:**

- Typecheck: PASS ✅
- Lint: PASS ✅
- Placeholders: 0 actionable ✅
- Build: SUCCESS ✅
- Docs audit: <10 missing high-priority endpoints ✅

---

### Phase 1.14: Final Documentation

**Goal:** Document completion for handoff to Phase 2

**Deliverables:**

1. Update `PHASE_1_FINAL_REPORT.md`:
   - Total routes created: ~90
   - Total pages created: ~30
   - Total components/services: ~20
   - Placeholder breakdown: 0 actionable, N blocked
   - Quality gates: All green
2. Update `docs/trace-matrix.md`:
   - Add all new routes
   - Mark all as "Scaffolded - Phase 2 implementation pending"
3. Git commit:

   ```powershell
   git add .
   git commit -m "Phase 1 Complete: 100% architectural scaffolding

   - Created 90 API route scaffolds (provider, federation, tenant, analyst, developer, owner)
   - Created 30 page scaffolds
   - Created 20 component/service scaffolds
   - All scaffolds have PLACEHOLDER_block_phase2 markers
   - Typecheck: PASS
   - Lint: PASS
   - Placeholders: 0 actionable, N legitimately blocked
   - Ready for Phase 2 implementation"
   ```

---

## Execution Rules

### Before Each Batch

1. Re-read the canonical pattern file
2. Review the specific routes for this batch
3. Check existing similar files for any variations

### During Each Batch

1. Create files one at a time
2. Copy exact auth pattern
3. Add PLACEHOLDER_block_phase2 with clear Phase 2 description
4. Include Zod schema stubs
5. Add proper error handling

### After Each Batch

1. Run `npm run typecheck`
2. Run `npm run lint`
3. Fix any errors immediately
4. Commit the batch
5. Update todo status
6. Brief checkpoint summary

### Recovery Protocol

If any batch fails verification:

1. **STOP** - Do not proceed to next batch
2. Read the error messages carefully
3. Fix the specific issues
4. Re-run verification
5. Only proceed when green

---

## Success Metrics

### Per-Batch Metrics

- Files created: X
- TypeScript errors: 0
- Lint errors: 0
- Patterns followed: 100%
- Time to verify: <2 min

### Phase 1 Complete Metrics

- Total API routes: ~90
- Total pages: ~30
- Total components/services: ~20
- Total scaffolds: ~140
- Actionable placeholders: 0
- Blocked placeholders: ~140
- Build status: SUCCESS
- Ready for Phase 2: YES

---

## Estimated Timeline

- Phase 1.0 (Pattern study): 15 min
- Phase 1.1-1.10 (API batches): 2-3 hours (10 batches × 15-20 min each)
- Phase 1.11-1.12 (Pages/components): 1-2 hours
- Phase 1.13 (Verification): 30 min
- Phase 1.14 (Documentation): 15 min

**Total: 4-6 hours of focused, high-quality work**

---

## Ready to Execute?

This strategy ensures:
✅ Small, verifiable batches
✅ Immediate error detection
✅ Pattern consistency
✅ No context overload
✅ Complete audit trail
✅ High-quality scaffolds ready for Phase 2
