# Phase Automation Workflow - Complete Guide

**Date**: October 27, 2025  
**Status**: Active automation infrastructure  
**Purpose**: Step-by-step guide for AI agents and developers to execute Phase 1-3 development cycles

---

## 🎯 Overview

The Cortiware codebase uses an automated Phase-based development workflow that integrates:

- **CI/CD validation** (GitHub Actions)
- **Automatic issue generation** (placeholder → GitHub issue sync)
- **Phase tracking** (structured documentation)
- **Quality gates** (TypeScript, placeholders, tests)

This document explains how to use the automation infrastructure to systematically eliminate placeholders and build out features.

---

## 📊 Phase Definition

### Phase 0: Schema + Documentation Audit & Planning

**Goal**: Analyze both Prisma schemas and audit the codebase against all project documentation to build an authoritative implementation plan.  
**Output**: Gap analysis (schema + docs), trace matrix, vertical slices, docs-code conformance report  
**Automation**: `npm run phase:0:all` (runs schema audit, docs audit, and updates trace matrix)

### Phase 1: Scaffolding

**Goal**: Create all file structures with TODOs  
**Output**: API routes, pages, services with typed interfaces  
**Quality Gate**: Must compile, no runtime implementation yet

### Phase 2: Implementation

**Goal**: Replace TODOs with real code  
**Output**: Working APIs, frontend data fetching, business logic  
**Quality Gate**: Tests pass, no actionable placeholders in `/apps` or `/packages`

### Phase 3: Testing & Validation

**Goal**: Add E2E tests, optimize, fix bugs  
**Output**: Production-ready features with test coverage  
**Quality Gate**: E2E passing, performance acceptable

---

## 🚀 Complete Workflow

### Step 1: Run Phase 0 Audits (Schema + Docs)

```powershell
# Option A: Full Phase 0 end-to-end (recommended)
npm run phase:0:all

# Option B: Run audits individually
# 1) Schema gap analysis
npm run phase:0
# 2) Documentation ↔ code conformance audit
npm run phase:0:docs
# 3) Refresh trace matrix
npm run trace:update

# Output files:
# - reports/schema-gap-report.md (if emitted by schema audit)
# - docs/trace-matrix.md (refreshed)
# - docs/work-plan.md (if emitted by schema audit)
# - docs/PHASE_0_DOCS_AUDIT.md (new: docs ↔ code gaps)
```

**When to use**:

- New Prisma models added
- Starting a major feature area
- Need to understand full scope
- Suspect documentation drift vs code

### Step 2: Check Current Placeholder Status

```powershell
# Scan codebase for placeholders and classify them
npm run ci:placeholders

# Output:
# - Console summary (blocked vs actionable vs docs)
# - .ai-placeholders/github-issues.json (for sync)
# - .ai-placeholders/report.md (detailed report)
```

**What it detects**:

- `TODO Phase 2:` markers
- `FIXME`, `HACK`, `XXX` comments
- `status: 501` responses
- "Not implemented" phrases
- "Coming Soon" placeholders

**Classification**:

- **BLOCKED**: Dependencies not ready (won't fail CI)
- **ACTIONABLE**: Can be implemented now (**FAILS CI** in strict mode)
- **DOCUMENTATION**: Informational only (allowed)

### Step 3: Sync Placeholders to GitHub Issues

```powershell
# Dry run (see what would be created)
npm run ci:placeholders:sync

# Actually create issues
SYNC_ISSUES=true GITHUB_TOKEN=<token> REPO=owner/repo npm run ci:placeholders:sync
```

**What it does**:

1. Reads `.ai-placeholders/github-issues.json`
2. Creates GitHub issues for each **BLOCKED** placeholder
3. Labels: `placeholder`, `blocked`, `phase-N`
4. Deduplicates using `<!-- placeholder-id: ... -->` in body

**When to use**:

- After major scaffolding work (Phase 1)
- To track dependencies for Phase 2 implementation
- Automatic on push to `main` (see `.github/workflows/ci.yml`)

### Step 4: Select Work Items (Vertical Slices)

**Priority Order** (from `PHASE_2_STUB_AUDIT.md`):

1. **API v2 Endpoints** - Foundation for frontend
2. **AI Usage Tracking** - High business value
3. **Communication System** - Customer-facing
4. **CRM Frontend Pages** - User workflows
5. **Operations Features** - Internal tools

**Vertical Slice Pattern**:

```
Pick one feature (e.g., "AI Usage Tracking")
├── Phase 1: Scaffold (if missing)
│   ├── API routes with Zod schemas
│   ├── Frontend pages with TypeScript interfaces
│   └── Service classes with method signatures
├── Phase 2: Implement
│   ├── Wire API to Prisma
│   ├── Add useSWR to frontend
│   └── Implement service logic
└── Phase 3: Test
    ├── Add E2E test
    └── Verify in Vercel preview
```

### Step 5: Implement a Vertical Slice (Phase 1 → 2 → 3)

#### Phase 1: Scaffold (if missing)

**Example: Create incidents pages**

```powershell
# File: apps/tenant-app/src/app/(tenant)/incidents/page.tsx
# Pattern: List page with TODO markers
```

**Checklist**:

- [ ] Create API route: `apps/tenant-app/src/app/api/incidents/route.ts`
- [ ] Add Zod schema for validation
- [ ] Add `getAuthContext()` guard
- [ ] Add TODO markers: `// TODO Phase 2: Implement Prisma query`
- [ ] Create frontend page: `apps/tenant-app/src/app/(tenant)/incidents/page.tsx`
- [ ] Add TypeScript interfaces
- [ ] Add TODO markers: `// TODO Phase 2: Implement useSWR from /api/incidents`
- [ ] Verify compiles: `npm run typecheck`

#### Phase 2: Implement

**Example: Wire AI usage tracking**

```powershell
# Edit: apps/tenant-app/src/app/api/ai/usage/route.ts
# Change: Return placeholder → Query AIUsageEvent table
# Add: Aggregation logic, date filtering
```

**Checklist**:

- [ ] Replace `// TODO Phase 2` with real Prisma queries
- [ ] Add error handling with `createSafeErrorResponse`
- [ ] Test locally: `npm run dev`
- [ ] Add useSWR to frontend: `const { data } = useSWR('/api/ai/usage')`
- [ ] Remove TODO markers
- [ ] Verify: `npm run ci:placeholders` (count should decrease)
- [ ] Commit: `git commit -m "feat: implement AI usage tracking API"`

#### Phase 3: Test & Validate

**Add E2E test**:

```typescript
// File: tests/e2e-playwright/tenant-app/ai-usage.spec.ts
import { test, expect } from "@playwright/test";

test.describe("AI Usage Tracking", () => {
  test("should display usage dashboard", async ({ page }) => {
    await page.goto("/settings/ai-usage");
    await expect(page.locator("h1")).toContainText("AI Usage");
    // TODO: Add more assertions
  });
});
```

**Run tests**:

```powershell
npm run test:e2e:playwright
```

**Verify in Vercel preview**:

1. Push branch: `git push origin feature/ai-usage`
2. Wait for preview deploy (automatic)
3. Run E2E against preview: `TENANT_APP_URL=<preview-url> npm run test:e2e:tenant`

### Step 6: CI Validation (Automatic on Push)

**What CI checks** (`.github/workflows/ci.yml`):

1. ✅ **TypeScript**: `npm run typecheck`
2. ✅ **Lint**: `npm run lint`
3. ✅ **Placeholders**: `npm run ci:placeholders` (strict mode)
   - **FAILS** if actionable placeholders in `/apps` or `/packages`
   - **ALLOWS** placeholders in `/docs`
4. ✅ **Unit Tests**: `npm run test:unit` + `npm run test:coverage`
5. ✅ **Route Count**: Max 36 routes per app
6. ✅ **Migration Safety**: No conflicting migrations

**On main branch**:

- Automatically syncs placeholders to GitHub issues
- Triggers Vercel deployment

### Step 7: Monitor Progress

**Track completion**:

```powershell
# Count remaining TODOs by phase
grep -r "TODO Phase 2" apps/ packages/ | wc -l

# View placeholder report
cat .ai-placeholders/report.md

# Check GitHub issues
gh issue list --label placeholder
```

**Update checkpoint docs**:

- `PHASE_1_PROGRESS_CHECKPOINT.md` - Track Phase 1 scaffolding %
- `PHASE_2_STUB_AUDIT.md` - Track Phase 2 implementation status
- `PHASE_2_COMPLETION_REPORT.md` - Final Phase 2 report

---

## 🔄 Iteration Loop

**Repeat until all placeholders eliminated**:

```
┌─────────────────────────────────────────┐
│  1. Run ci:placeholders                 │
│     → Identify actionable TODOs         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Pick highest-priority slice         │
│     → Use PHASE_2_STUB_AUDIT.md         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Implement (Phase 2)                 │
│     → Replace TODOs with real code      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Add tests (Phase 3)                 │
│     → E2E for critical paths            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Push & verify CI                    │
│     → All checks green                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. Merge to main                       │
│     → Auto-deploy to Vercel             │
└──────────────┬──────────────────────────┘
               │
               └──────────────┐
                              │
                              ▼
                     ┌────────────────┐
                     │  ALL DONE?     │
                     │  Placeholders  │
                     │  = 0 in /apps  │
                     └────────┬───────┘
                              │
                    ┌─────────┴─────────┐
                    │ No                │ Yes → 🎉 PRODUCTION READY
                    ▼                   │
                 (Repeat)               ▼
                                    Document
                                    & Deploy
```

---

## 🛠️ Tools & Scripts Reference

### Placeholder Detection

```powershell
npm run ci:placeholders          # Scan & classify
npm run ci:placeholders:sync     # Create GitHub issues
```

### Phase 0 (Schema Analysis)

```powershell
npm run phase:0                  # Full schema audit
npm run trace:update             # Update trace matrix
```

### Quality Checks

```powershell
npm run typecheck               # TypeScript compilation
npm run lint                    # ESLint
npm run test                    # Unit tests
npm run test:e2e:playwright     # E2E tests
```

### Development

```powershell
npm run dev                     # Start all apps
npm run prisma:generate         # Regenerate clients
npm run prisma:migrate:tenant   # Tenant DB migration
npm run prisma:migrate:provider # Provider DB migration
```

---

## 📝 Documentation Updates

**After completing a phase**:

1. **Update checkpoint doc**:

   ```markdown
   ## Phase N Progress

   ✅ Feature A: 100% (10/10 tasks)
   🟡 Feature B: 60% (6/10 tasks)
   ⏳ Feature C: 0% (0/10 tasks)
   ```

2. **Update trace matrix** (`docs/trace-matrix.md`):

   ```markdown
   | Model | Backend          | Frontend  | Tests            | Status |
   | ----- | ---------------- | --------- | ---------------- | ------ |
   | Lead  | ✅ /api/v2/leads | ✅ /leads | ✅ leads.spec.ts | 100%   |
   ```

3. **Create completion report** (if phase complete):

   ```markdown
   # Phase N Completion Report

   **Date**: YYYY-MM-DD
   **Implemented**: [List features]
   **Remaining**: [List gaps]
   **Next**: Phase N+1
   ```

---

## 🚨 Troubleshooting

### CI Fails on Placeholders

**Error**: `❌ Placeholder check failed: 15 actionable placeholders found`

**Solution**:

1. Run locally: `npm run ci:placeholders`
2. Review `.ai-placeholders/report.md`
3. Implement or reclassify:
   - Implement → Remove TODO
   - Blocked → Add `[blocked: reason]` marker
   - Docs only → Move to `/docs` directory

### TypeScript Errors After Scaffolding

**Error**: `Type 'any' is not assignable...`

**Solution**:

1. Define proper TypeScript interfaces
2. Use Prisma types: `import type { Lead } from '@prisma/client-tenant'`
3. Run: `npm run typecheck` to verify

### E2E Tests Fail on Preview

**Error**: Tests timeout or 404

**Solution**:

1. Check Vercel deployment logs
2. Verify DATABASE_URL is set in Vercel project
3. Check build-time guards are in place
4. Re-run: `npm run test:e2e:vercel`

---

## 📚 Related Documentation

- **Architecture**: `ARCHITECTURE_SEPARATION.md` - System boundaries
- **Build Guards**: `BUILD_TIME_DATA_FETCH_GUARDS.md` - Local build patterns
- **Stub Audit**: `PHASE_2_STUB_AUDIT.md` - Current implementation status
- **Operating Procedure**: `COPILOT_OPERATING_PROCEDURE.md` - AI agent guide
- **Agent Handoff**: `AGENT_HANDOFF_PROMPT.md` - Session continuation

---

## 🎯 Success Criteria

**Phase 1 Complete**:

- ✅ All pages exist with TypeScript interfaces
- ✅ All API routes exist with Zod schemas
- ✅ All service classes exist with method signatures
- ✅ `npm run typecheck` passes
- ✅ TODO markers clearly indicate Phase 2 work

**Phase 2 Complete**:

- ✅ No actionable placeholders in `/apps` or `/packages`
- ✅ All APIs return real data (no 501 responses)
- ✅ All frontend pages fetch from APIs
- ✅ `npm run ci:placeholders` passes
- ✅ Vercel preview deploys successfully

**Phase 3 Complete**:

- ✅ E2E tests cover critical paths
- ✅ `npm run test:e2e:playwright` passes
- ✅ Performance acceptable (< 3s page loads)
- ✅ Production deployment successful

**Production Ready**:

- ✅ All phases complete for feature
- ✅ Security review passed (if needed)
- ✅ Documentation updated
- ✅ Stakeholders approved
- ✅ Monitoring/alerts configured

---

## 🤖 For AI Agents

**When starting a session**:

1. Read this document first
2. Check `AGENT_HANDOFF_PROMPT.md` for current status
3. Run `npm run ci:placeholders` to assess work
4. Review `PHASE_2_STUB_AUDIT.md` for priorities
5. Follow the iteration loop above

**When completing work**:

1. Update checkpoint documents
2. Run all quality checks
3. Create handoff document for next agent
4. Push changes and verify CI

**Key principles**:

- Work in vertical slices (one feature at a time)
- Always follow established patterns
- Never skip quality gates
- Document what you've done

---

**Last Updated**: October 27, 2025  
**Maintainer**: Robinson AI Systems  
**Automation Status**: ✅ Fully operational
