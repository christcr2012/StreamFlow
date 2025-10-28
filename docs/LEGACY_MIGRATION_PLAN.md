# Legacy src/ to Monorepo Migration Plan

**Status**: Planning Phase  
**Created**: 2025-01-19  
**Goal**: Complete migration of all legacy code from `src/` to proper monorepo structure with zero legacy code remaining

---

## Executive Summary

The repository was converted from a standard Next.js app to a Turborepo monorepo, but the migration was incomplete. The legacy `src/` directory contains **474 TypeScript/JavaScript files** that need to be properly migrated to:
- `apps/tenant-app/src/` - Tenant-facing application
- `apps/provider-portal/src/` - Provider-facing portal
- `packages/*/src/` - Shared utilities and services

**Critical Principle**: This is an **architecture problem first, code problem second**. We must understand the purpose and dependencies of each piece of code before moving it.

---

## Phase 0: Deep Analysis (CURRENT PHASE)

### 0.1 Inventory by Directory

From initial scan:
```
_disabled/     : 226 files (likely deprecated, needs verification)
app/           : 105 files (pages, API routes, layouts)
components/    : 15 files (UI components)
config/        : 1 file (lead scoring config)
lib/           : 82 files (utilities, helpers, services)
middleware/    : 5 files (auth, rate limiting, etc.)
mocks/         : 3 files (test mocks)
server/        : 8 files (server-side services)
services/      : 27 files (business logic services)
styles/        : 1 file (CSS)
```

### 0.2 Critical Questions to Answer

**Before moving ANY code, we must answer:**

1. **Audience Determination**
   - Is this code tenant-facing, provider-facing, or shared?
   - Which app(s) actually need this code?
   - Is this code currently deployed and working, or is it dead code?

2. **Dependency Mapping**
   - What does this code import?
   - What imports this code?
   - Are there circular dependencies?
   - What external packages does it depend on?

3. **Database Schema**
   - Does this code use Prisma models?
   - Which database does it target (tenant DB or provider DB)?
   - Are there schema mismatches between legacy and current?

4. **Shared vs. App-Specific**
   - Should this be in a shared package?
   - Is it truly reusable or just used by one app?
   - Does it have app-specific dependencies that prevent sharing?

5. **Current State**
   - Is equivalent code already in the target app?
   - Is this newer or older than existing code?
   - Are there conflicts or duplicates?

### 0.3 Analysis Tasks (Must Complete Before Migration)

- [ ] **Map all imports/exports** - Build complete dependency graph
- [ ] **Identify duplicates** - Find code that exists in both src/ and apps/
- [ ] **Categorize by audience** - Tenant, Provider, Shared, or Dead
- [ ] **Trace database usage** - Map Prisma model usage to correct DB
- [ ] **Check deployment status** - Verify what's actually running in production
- [ ] **Document intent** - Understand WHY each piece of code exists

---

## Phase 1: Categorization Strategy

### 1.1 Decision Tree for Each File

```
For each file in src/:
├─ Is it in _disabled/? 
│  └─ YES → Mark for deletion (verify first)
│  └─ NO → Continue
├─ Does it exist in apps/*?
│  └─ YES → Compare versions, keep newer, mark older for deletion
│  └─ NO → Continue
├─ What does it import from @prisma/client?
│  ├─ Tenant models (Org, Lead, Customer, etc.) → tenant-app
│  ├─ Provider models (User, ProviderConfig, etc.) → provider-portal
│  ├─ Both → Needs refactoring or duplication
│  └─ None → Continue
├─ What audience does it serve?
│  ├─ Tenant users → tenant-app
│  ├─ Provider/admin users → provider-portal
│  ├─ Both → shared package
│  └─ Unclear → Needs investigation
└─ Is it truly reusable?
   ├─ YES → shared package
   └─ NO → app-specific
```

### 1.2 Shared Package Candidates

Code that should go into `packages/`:

**Existing packages to extend:**
- `@cortiware/auth-service` - Authentication utilities
- `@cortiware/ui` - UI components
- `@cortiware/db` - Database client
- `@cortiware/themes` - Theming system

**New packages to create:**
- `@cortiware/services` - Shared business logic (audit, metrics, etc.)
- `@cortiware/middleware` - Shared middleware (rate limiting, etc.)
- `@cortiware/validation` - Shared Zod schemas
- `@cortiware/utils` - Pure utility functions

---

## Phase 2: High-Priority Migrations

### 2.1 SAM.gov Integration (Tenant-facing)

**Source:**
- `src/services/sam-gov.service.ts`
- `src/app/(app)/leads/sam-gov/`
- `src/app/api/v2/sam-gov/`

**Destination:** `apps/tenant-app/src/`

**Dependencies to verify:**
- Prisma models: Customer (for storing API keys)
- Lead model (for importing opportunities)
- Auth: tenant authentication
- External: SAM.gov API

**Migration steps:**
1. Verify no duplicate exists in tenant-app
2. Copy service file to `apps/tenant-app/src/services/`
3. Copy UI pages to `apps/tenant-app/src/app/leads/sam-gov/`
4. Copy API routes to `apps/tenant-app/src/app/api/sam-gov/`
5. Update all imports to use tenant-app paths
6. Test on Vercel deployment

### 2.2 v2 CRM APIs (Tenant-facing)

**Source:**
- `src/app/api/v2/leads/`
- `src/app/api/v2/opportunities/`
- `src/app/api/v2/organizations/`
- `src/services/leads.service.ts`
- `src/services/opportunities.service.ts`
- `src/services/organizations.service.ts`

**Destination:** `apps/tenant-app/src/`

**Critical consideration:** These APIs are documented as "100% production ready" but are in legacy location. Need to verify if they're actually deployed.

---

## Phase 3: Shared Services Migration

### 3.1 Audit Logging

**Source:**
- `src/lib/audit-log.ts`
- `src/lib/consolidated-audit.ts`
- `src/lib/federation-audit.ts`
- `src/services/audit-log.service.ts`

**Decision:** Create `@cortiware/audit` package

**Rationale:** Both apps need audit logging, but implementation may differ by database

### 3.2 AI/Metering Services

**Source:**
- `src/lib/aiHelper.ts`
- `src/lib/aiMeter.ts`
- `src/lib/aiMeteredHelper.ts`
- `src/lib/aiService.ts`

**Decision:** Check if duplicates exist in tenant-app, consolidate into shared package or keep app-specific

---

## Phase 4: Authentication & Middleware

### 4.1 Auth Helpers

**Source:**
- `src/lib/auth-owner.ts`
- `src/lib/provider-auth.ts`
- `src/lib/developer-auth.ts`
- `src/lib/accountant-auth.ts`

**Decision:** 
- Provider/developer/accountant → `apps/provider-portal/src/lib/`
- Owner (tenant) → `apps/tenant-app/src/lib/`
- Shared utilities → extend `@cortiware/auth-service`

### 4.2 Middleware

**Source:**
- `src/middleware/` (5 files)
- `src/lib/api/middleware.ts`

**Decision:** Evaluate each middleware for sharing vs. app-specific

---

## Phase 5: UI Components & Pages

### 5.1 Components

**Source:** `src/components/` (15 files)

**Strategy:**
- Truly reusable → `@cortiware/ui`
- App-specific → respective app
- Deprecated → delete

### 5.2 Pages & Layouts

**Source:** `src/app/` (105 files)

**Strategy:** Map each route to correct app based on audience

---

## Phase 6: Verification & Cleanup

### 6.1 Verification Checklist

After each phase:
- [ ] All packages typecheck (`npm run typecheck`)
- [ ] All packages build (`npm run build`)
- [ ] Deploy to Vercel and verify build logs
- [ ] Test migrated features in deployed environment
- [ ] No broken imports
- [ ] No duplicate code
- [ ] Database migrations applied correctly

### 6.2 Final Cleanup

- [ ] Delete `src/` directory entirely
- [ ] Update all documentation
- [ ] Update import paths in any remaining references
- [ ] Archive migration plan for future reference

---

## Risk Mitigation

### High-Risk Areas

1. **Database Schema Mismatches**
   - Risk: Legacy code expects different schema than current
   - Mitigation: Verify Prisma models before migration, create migrations if needed

2. **Circular Dependencies**
   - Risk: Moving code breaks import cycles
   - Mitigation: Build dependency graph first, refactor cycles before moving

3. **Dead Code Removal**
   - Risk: Deleting code that's actually needed
   - Mitigation: Verify deployment status, check git history, search for imports

4. **Breaking Production**
   - Risk: Migration breaks deployed features
   - Mitigation: Test on Vercel after each phase, maintain rollback capability

---

## Critical Findings from Initial Analysis

### Finding 1: Duplicate Pages (Legacy is OLDER)

**tenant-app/src/app/(tenant)/leads/page.tsx** (CURRENT - KEEP)
- Has AI scoring features (`AIScoreBadge`, `aiScore`, `scoreFactors`)
- Uses `/api/leads` (current tenant-app API)
- Better code quality (useCallback fix)
- 275 lines

**src/app/(app)/leads/page.tsx** (LEGACY - DELETE)
- Missing AI features
- Uses `/api/v2/leads` (doesn't exist in tenant-app)
- 279 lines
- **Decision**: DELETE after migrating v2 APIs

### Finding 2: Missing v2 APIs (CRITICAL MIGRATION)

**tenant-app does NOT have `/api/v2/` directory!**

Legacy `src/app/api/v2/` contains production-ready APIs:
- `/api/v2/leads` - Full CRUD with middleware composition
- `/api/v2/opportunities` - Full CRUD
- `/api/v2/organizations` - Full CRUD
- `/api/v2/sam-gov/*` - SAM.gov integration (4 routes)
- `/api/v2/settings/sam-gov` - SAM.gov settings
- `/api/v2/auth/*` - Auth endpoints
- `/api/v2/me` - User profile
- `/api/v2/themes` - Theme management

**These APIs have:**
- Proper middleware composition (`withTenantAuth`, `withRateLimit`, `withIdempotencyRequired`)
- Service layer separation (`leadService`, `opportunityService`, `organizationService`)
- Validation schemas
- Audit logging
- Deduplication logic
- Pagination and filtering

**Current tenant-app has:**
- `/api/leads` - Different implementation
- `/api/customers` - Different from organizations
- NO `/api/v2/` directory at all

**Decision**: Migrate ALL v2 APIs to tenant-app as they are more complete than current APIs

### Finding 3: SAM.gov Integration (COMPLETE FEATURE)

**Legacy location:**
- `src/services/sam-gov.service.ts` - Service layer
- `src/app/(app)/leads/sam-gov/SamGovEnhanced.tsx` - 1200+ line UI
- `src/app/api/v2/sam-gov/*` - 4 API routes
- `src/app/api/v2/settings/sam-gov/*` - Settings API

**tenant-app location:**
- DOES NOT EXIST

**Decision**: Full migration required - this is a complete, production-ready feature

### Finding 4: Service Layer (SHARED CODE)

**Legacy services in `src/services/`:**
- `leads.service.ts` - Used by v2 APIs
- `opportunities.service.ts` - Used by v2 APIs
- `organizations.service.ts` - Used by v2 APIs
- `sam-gov.service.ts` - Used by SAM.gov feature
- `audit-log.service.ts` - Shared utility
- `metrics.service.ts` - Shared utility
- Provider services (accountant, developer, owner, provider subdirs)

**Decision**:
- Tenant services → `apps/tenant-app/src/services/`
- Provider services → `apps/provider-portal/src/services/`
- Truly shared → `packages/@cortiware/services/`

### Finding 5: Middleware & Auth (COMPLEX DEPENDENCIES)

**Legacy middleware in `src/middleware/` and `src/lib/api/middleware.ts`:**
- Composition pattern with `compose()`, `withTenantAuth()`, `withRateLimit()`, etc.
- Used extensively by v2 APIs
- More sophisticated than current tenant-app middleware

**Current tenant-app middleware:**
- Simple route guards in `apps/tenant-app/src/middleware.ts`
- No composition pattern

**Decision**: Migrate middleware composition pattern to tenant-app

### Finding 6: Validation Schemas (MISSING)

**Legacy has `src/lib/validation/`:**
- `leads.ts` - Lead validation schemas
- `opportunities.ts` - Opportunity validation schemas
- `organizations.ts` - Organization validation schemas

**tenant-app has `src/lib/validations/`:**
- `agreement.ts` - Agreement validation
- Different structure

**Decision**: Migrate validation schemas to tenant-app

---

## Revised Migration Strategy

### Phase 0: Analysis Complete ✅

**Key Insights:**
1. Legacy `src/` contains MORE complete features than current tenant-app
2. v2 APIs are production-ready but not deployed
3. SAM.gov is a complete feature missing from tenant-app
4. Service layer is well-architected and needs preservation
5. Middleware composition pattern is superior to current implementation

### Phase 1: Migrate v2 APIs (HIGHEST PRIORITY)

**Why first?**
- These are production-ready APIs that should be deployed
- They have better architecture than current APIs
- Other features depend on them (SAM.gov, legacy pages)

**Steps:**
1. Create `apps/tenant-app/src/app/api/v2/` directory
2. Migrate middleware composition to tenant-app
3. Migrate service layer to tenant-app
4. Migrate validation schemas to tenant-app
5. Migrate v2 API routes one by one
6. Test each route on Vercel
7. Update any references from `/api/leads` to `/api/v2/leads`

### Phase 2: Migrate SAM.gov Integration

**Dependencies:** Phase 1 (v2 APIs)

**Steps:**
1. Migrate `sam-gov.service.ts` to `apps/tenant-app/src/services/`
2. Migrate SAM.gov UI to `apps/tenant-app/src/app/(tenant)/leads/sam-gov/`
3. Migrate SAM.gov API routes to `apps/tenant-app/src/app/api/v2/sam-gov/`
4. Test complete feature on Vercel
5. Add to tenant-app navigation

### Phase 3: Migrate Remaining Services

**Steps:**
1. Audit all services in `src/services/`
2. Categorize by audience (tenant, provider, shared)
3. Migrate to appropriate locations
4. Update all imports

### Phase 4: Migrate Auth & Middleware

**Steps:**
1. Consolidate auth helpers
2. Migrate middleware to appropriate apps
3. Update `@cortiware/auth-service` with shared utilities

### Phase 5: Clean Up Legacy Pages

**Steps:**
1. Compare all pages in `src/app/(app)/` with `apps/tenant-app/src/app/`
2. Keep newer versions
3. Delete older versions
4. Verify no functionality loss

### Phase 6: Delete Legacy Directory

**Steps:**
1. Verify all code migrated
2. Run full typecheck and build
3. Test on Vercel
4. Delete `src/` directory
5. Update documentation

---

## Next Immediate Actions

1. ✅ **Analysis complete** - Understand what needs to be migrated
2. **Create migration branch** - `git checkout -b legacy-migration`
3. **Start Phase 1** - Migrate v2 APIs
4. **Test incrementally** - Deploy to Vercel after each major step
5. **Document decisions** - Update this plan as we learn more

---

**Note**: This plan has been updated based on deep analysis. The migration is more complex than initially thought, but the legacy code is actually BETTER in many ways than current code. We're not just cleaning up - we're upgrading the system.

