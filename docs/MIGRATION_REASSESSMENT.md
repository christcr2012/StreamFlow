# Migration Reassessment: Understanding Legacy Structure

**Date**: 2025-01-19  
**Critical Discovery**: Legacy system had BOTH provider portal AND tenant app in single repo

---

## The Real Legacy Structure

### Legacy System (`src/`)

The legacy system was a **SINGLE MONOLITHIC APP** containing:

1. **Tenant App Routes** (`src/app/(app)/`)
   - For CLIENT TENANT USERS
   - Cookie: `rs_user` or `mv_user`
   - Routes: `/dashboard`, `/leads`, `/opportunities`, `/organizations`, `/settings`
   - Comment in layout: "authenticated CLIENT TENANT USERS"

2. **Provider Portal Routes** (`src/app/(developer)/`, `src/app/(owner)/`, `src/app/(accountant)/`)
   - For PROVIDER USERS (developers, owners, accountants)
   - Cookies: `rs_developer`, `rs_provider`, etc.
   - Routes: `/developer/*`, `/owner/*`, `/accountant/*`
   - Comment in layout: "PROVIDER DEVELOPER USERS"

3. **Shared Infrastructure** (`src/lib/`, `src/services/`)
   - Used by BOTH tenant and provider sides
   - Middleware, rate limiting, idempotency, Redis, etc.

4. **Shared APIs** (`src/app/api/`)
   - `/api/v2/*` - Tenant APIs
   - `/api/developer/*` - Provider APIs
   - `/api/owner/*` - Provider APIs
   - `/api/accountant/*` - Provider APIs

### Monorepo System (Current)

After migration to Turborepo:

1. **`apps/tenant-app/`** - Separate app for CLIENT TENANT USERS
   - Rebuilt from memory
   - Has some features (AI scoring, better auth)
   - Missing features (SAM.gov, opportunities, v2 APIs, middleware)

2. **`apps/provider-portal/`** - Separate app for PROVIDER USERS
   - Already has infrastructure (redis, rate-limiter, idempotency, middleware)
   - Has provider-specific features

3. **`apps/marketing-cortiware/`** - Marketing site (NOT part of migration)

4. **`apps/marketing-robinson/`** - Marketing site (NOT part of migration)

5. **`packages/*`** - Shared packages
   - `@cortiware/auth-service` - Shared auth
   - `@cortiware/db` - Shared database
   - `@cortiware/themes` - Shared themes
   - etc.

---

## Assessment of Phase 1 Work

### ✅ What I Did Right

**Migrated to tenant-app**:
- ✅ Redis client
- ✅ Rate limiter
- ✅ Idempotency store
- ✅ Middleware composition framework
- ✅ API response helpers

**Why This Was Correct**:
- Provider-portal ALREADY has all this infrastructure (already migrated earlier!)
- Tenant-app was MISSING it (forgotten during rebuild)
- I was recovering forgotten features for tenant-app

### ❌ What I Need to Verify

**Question**: Did I migrate the RIGHT version?

Let me compare:
- Legacy `src/lib/redis.ts` → Provider-portal has it (identical)
- Legacy `src/lib/rate-limiter.ts` → Provider-portal has it
- Legacy `src/lib/idempotency-store.ts` → Provider-portal has it
- Legacy `src/lib/api/middleware.ts` → Provider-portal has it

**Conclusion**: Provider-portal was ALREADY migrated from legacy! I just needed to add the same infrastructure to tenant-app.

### ✅ Phase 1 Status: CORRECT

My Phase 1 work was correct:
- Provider-portal already has the infrastructure (migrated earlier)
- Tenant-app was missing it (forgotten during rebuild)
- I recovered it for tenant-app

---

## Revised Migration Strategy

### Categorization Framework

For each legacy file, determine:

1. **Tenant-Only** → Migrate to `apps/tenant-app/` only
   - Files in `src/app/(app)/`
   - Tenant-specific APIs in `src/app/api/v2/`
   - Tenant-specific services

2. **Provider-Only** → Check if already in `apps/provider-portal/`
   - Files in `src/app/(developer)/`, `src/app/(owner)/`, `src/app/(accountant)/`
   - Provider-specific APIs in `src/app/api/developer/`, `/api/owner/`, `/api/accountant/`
   - Provider-specific services

3. **Shared Infrastructure** → Check both apps
   - If provider-portal has it: Add to tenant-app only
   - If neither has it: Add to both OR create shared package
   - Examples: middleware, rate-limiter, redis, validation schemas

4. **Shared Services** → Evaluate case-by-case
   - If truly shared: Consider `packages/*`
   - If app-specific logic: Duplicate with modifications

---

## Revised Phase Plan

### Phase 1: Infrastructure Recovery (IN PROGRESS)

**Status**: ✅ CORRECT - Tenant-app now has infrastructure that provider-portal already had

**Completed**:
- ✅ Redis client → tenant-app (provider-portal already has)
- ✅ Rate limiter → tenant-app (provider-portal already has)
- ✅ Idempotency store → tenant-app (provider-portal already has)
- ✅ Middleware framework → tenant-app (provider-portal already has)

**Remaining**:
- Validation schemas → Check if provider-portal has them, add to tenant-app
- Service layers → Determine which are tenant-specific vs provider-specific

### Phase 2: Tenant-Specific Feature Recovery

**Focus**: Features from `src/app/(app)/` that are missing from `apps/tenant-app/`

**Items**:
1. **SAM.gov Integration** (TENANT-ONLY)
   - `src/app/(app)/leads/sam-gov/` → `apps/tenant-app/src/app/(tenant)/leads/sam-gov/`
   - `src/services/sam-gov.service.ts` → `apps/tenant-app/src/services/`
   - `src/app/api/v2/sam-gov/` → `apps/tenant-app/src/app/api/sam-gov/`

2. **Opportunities Management** (TENANT-ONLY)
   - `src/app/(app)/opportunities/` → `apps/tenant-app/src/app/(tenant)/opportunities/`
   - `src/services/opportunities.service.ts` → `apps/tenant-app/src/services/`
   - `src/app/api/v2/opportunities/` → `apps/tenant-app/src/app/api/opportunities/`

3. **v2 Tenant APIs** (TENANT-ONLY)
   - `src/app/api/v2/leads/` → Enhance existing `apps/tenant-app/src/app/api/leads/`
   - `src/app/api/v2/organizations/` → Enhance existing `apps/tenant-app/src/app/api/customers/`

4. **Tenant Service Layers** (TENANT-ONLY)
   - `src/services/leads.service.ts` → `apps/tenant-app/src/services/`
   - `src/services/organizations.service.ts` → `apps/tenant-app/src/services/`

### Phase 3: Provider-Specific Verification

**Focus**: Verify provider-portal has everything from legacy provider routes

**Check**:
1. Does provider-portal have all features from `src/app/(developer)/`?
2. Does provider-portal have all features from `src/app/(owner)/`?
3. Does provider-portal have all features from `src/app/(accountant)/`?
4. Does provider-portal have all APIs from `src/app/api/developer/`, `/owner/`, `/accountant/`?

**Action**: Only migrate if missing

### Phase 4: Shared Validation & Utilities

**Focus**: Validation schemas and utilities that both apps need

**Items**:
- Validation schemas → Add to tenant-app (provider-portal likely has them)
- Shared utilities → Evaluate for `packages/*` vs app-specific

### Phase 5: Cleanup

**Focus**: Delete legacy `src/` after verification

---

## Key Insights

### 1. Provider-Portal Was Already Migrated

Provider-portal already has:
- ✅ Redis client
- ✅ Rate limiter
- ✅ Idempotency store
- ✅ Middleware framework
- ✅ Provider-specific routes and APIs

**Implication**: Most of my work is recovering TENANT-SPECIFIC features that were forgotten during tenant-app rebuild.

### 2. Tenant-App Was Rebuilt From Memory

Tenant-app is missing:
- ❌ SAM.gov integration (complete feature)
- ❌ Opportunities management
- ❌ v2 API architecture
- ❌ Service layers
- ❌ Middleware composition (NOW ADDED ✅)
- ❌ Rate limiting (NOW ADDED ✅)
- ❌ Idempotency (NOW ADDED ✅)

**Implication**: Focus on tenant-app recovery, not provider-portal.

### 3. Marketing Sites Are Separate

`apps/marketing-cortiware/` and `apps/marketing-robinson/` are NOT part of this migration.

**Implication**: Ignore them completely.

---

## Next Steps

### Immediate (Phase 1 Completion)

1. ✅ Verify Phase 1 work is correct (DONE - it is!)
2. Migrate validation schemas to tenant-app
3. Migrate tenant-specific service layers

### Then (Phase 2)

1. Migrate SAM.gov integration to tenant-app
2. Migrate opportunities management to tenant-app
3. Enhance existing tenant APIs with v2 architecture

### Finally (Phase 3-5)

1. Verify provider-portal completeness
2. Add any missing shared utilities
3. Delete legacy `src/` directory

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Tenant-app has all infrastructure (redis, rate-limiter, idempotency, middleware)
- ✅ Tenant-app has validation schemas
- ✅ Tenant-app has service layers
- ✅ All typechecks pass
- ✅ Vercel builds succeed

### Phase 2 Complete When:
- ✅ Tenant-app has SAM.gov integration
- ✅ Tenant-app has opportunities management
- ✅ Tenant-app has enhanced APIs with v2 architecture
- ✅ All features work end-to-end

### Phase 3 Complete When:
- ✅ Provider-portal verified complete
- ✅ No missing features from legacy

### Migration Complete When:
- ✅ All tenant features recovered
- ✅ All provider features verified
- ✅ Legacy `src/` directory deleted
- ✅ Clean monorepo structure
- ✅ Zero technical debt

