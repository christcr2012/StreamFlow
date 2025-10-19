# Migration Strategy: Recovering Lost Development Work

**Date**: 2025-01-19  
**Status**: Planning Complete - Ready to Execute

---

## The Real Situation

### What Actually Happened

1. **Original System**: Built in standard repo structure (`src/`)
2. **Monorepo Migration**: Structure changed to Turborepo, but migration was incomplete
3. **User's Response**: Thought work was lost, started rebuilding from memory in new structure
4. **Reality**: Original work still exists in `src/`, just not migrated

### The Result

We now have **TWO parallel implementations**:

- **Legacy (`src/`)**: Original complete implementation with features user forgot about
- **Current (`apps/tenant-app/src/`)**: Rebuilt from memory, some features better, some missing

---

## Migration Goal (REVISED)

**NOT**: "Migrate legacy code to new structure"  
**ACTUALLY**: "Recover forgotten features and merge them into the rebuilt system"

### Approach

For each feature/file:

1. **Compare**: What exists in legacy vs current?
2. **Evaluate**: Which version is better? What's missing from each?
3. **Merge**: Take the best of both, enhance current system with forgotten features
4. **Preserve**: Keep improvements from the rebuild (AI scoring, better auth, etc.)
5. **Add**: Bring back forgotten features (SAM.gov, v2 APIs, middleware, etc.)

---

## Comparison Framework

For each feature, ask:

### Architecture
- Which has better code structure?
- Which has better separation of concerns?
- Which is more maintainable?

### Features
- What features exist in legacy but not current?
- What features exist in current but not legacy?
- Which implementation is more complete?

### Quality
- Which has better TypeScript types?
- Which has better error handling?
- Which has better documentation?

### Decision
- **Keep Current + Add Missing**: Current is better, add legacy features
- **Replace with Legacy**: Legacy is clearly superior
- **Merge Both**: Take best parts of each
- **Build New**: Both are incomplete, build fresh using both as reference

---

## Phase-by-Phase Strategy

### Phase 1: Infrastructure Recovery

**Goal**: Add forgotten infrastructure to current system

**Items to Recover**:

1. **Middleware Composition Framework** (`src/lib/api/middleware.ts`)
   - Legacy has sophisticated `compose()` pattern
   - Current has simple inline auth checks
   - **Action**: Add middleware framework to current, enhance existing APIs

2. **Rate Limiter** (`src/lib/rate-limiter.ts`)
   - Legacy has token bucket algorithm with Redis support
   - Current has simple in-memory rate limiting
   - **Action**: Replace current with legacy version (clearly superior)

3. **Idempotency Store** (`src/lib/idempotency-store.ts`)
   - Legacy has complete implementation
   - Current has none
   - **Action**: Add to current (net-new feature)

4. **Service Layers** (`src/services/`)
   - Legacy has `leads.service.ts`, `opportunities.service.ts`, `organizations.service.ts`
   - Current has direct Prisma calls in routes
   - **Action**: Add service layers, refactor routes to use them

5. **Validation Schemas** (`src/lib/validation/`)
   - Legacy has separate validation modules
   - Current has inline Zod schemas
   - **Action**: Extract to separate modules for reusability

**Outcome**: Current system gains enterprise-grade infrastructure

---

### Phase 2: Feature Recovery

**Goal**: Add forgotten features to current system

**Items to Recover**:

1. **SAM.gov Integration** (COMPLETE FEATURE)
   - `src/services/sam-gov.service.ts` - Service layer
   - `src/app/(app)/leads/sam-gov/SamGovEnhanced.tsx` - 1200+ line UI
   - `src/app/api/v2/sam-gov/*` - 4 API routes
   - Current has: NOTHING
   - **Action**: Add complete feature to current (this is a major recovery!)

2. **Opportunities Management**
   - `src/app/api/v2/opportunities/*` - Full CRUD API
   - `src/services/opportunities.service.ts` - Service layer
   - Current has: NOTHING
   - **Action**: Add complete feature to current

3. **v2 API Endpoints**
   - Legacy has `/api/v2/leads`, `/api/v2/organizations`, `/api/v2/opportunities`
   - Current has `/api/leads`, `/api/customers` (different structure)
   - **Action**: Add v2 endpoints as enhanced versions, keep current for compatibility

4. **Auth Endpoints** (`src/app/api/v2/auth/*`)
   - Legacy has auth APIs
   - Current may have different auth flow
   - **Action**: Compare and merge best approach

5. **User Profile** (`src/app/api/v2/me`)
   - Legacy has user profile endpoint
   - Current may have different implementation
   - **Action**: Add if missing, enhance if exists

**Outcome**: Current system gains all forgotten features

---

### Phase 3: UI Recovery

**Goal**: Add forgotten UI pages and components

**Items to Recover**:

1. **SAM.gov Lead Generation UI**
   - `src/app/(app)/leads/sam-gov/SamGovEnhanced.tsx`
   - Complete UI with search, filters, saved searches, import
   - **Action**: Add to `apps/tenant-app/src/app/(tenant)/leads/sam-gov/`

2. **Legacy Pages** (`src/app/(app)/*`)
   - Compare each page with current `apps/tenant-app/src/app/(tenant)/*`
   - Identify missing pages or better implementations
   - **Action**: Add missing pages, enhance existing with forgotten features

3. **Components** (`src/components/*`)
   - 15 components in legacy
   - Compare with current components
   - **Action**: Add missing components, merge improvements

**Outcome**: Current system gains all forgotten UI features

---

### Phase 4: Configuration & Utilities Recovery

**Goal**: Add forgotten utilities and configurations

**Items to Recover**:

1. **Lead Scoring Config** (`src/config/lead-scoring.ts`)
   - Legacy has configuration
   - Current has AI scoring (better!)
   - **Action**: Merge configs, keep AI scoring, add any missing rules

2. **Server Services** (`src/server/*`)
   - 8 files in legacy
   - Compare with current server-side code
   - **Action**: Add missing server utilities

3. **Middleware** (`src/middleware/*`)
   - 5 middleware files in legacy
   - Compare with current middleware
   - **Action**: Add missing middleware, merge improvements

4. **Mocks** (`src/mocks/*`)
   - Test mocks in legacy
   - **Action**: Add to current for better testing

**Outcome**: Current system gains all forgotten utilities

---

### Phase 5: Cleanup

**Goal**: Remove legacy directory after successful migration

**Actions**:

1. Verify ALL features migrated
2. Run full typecheck and build
3. Test on Vercel deployment
4. Delete `src/` directory
5. Update documentation

**Outcome**: Clean monorepo with all features recovered

---

## Key Principles

### 1. Preserve Current Improvements

The rebuild has improvements that must be kept:

- ✅ AI scoring for leads
- ✅ Better auth with `@cortiware/auth-service`
- ✅ Tag filtering for customers
- ✅ Related data includes
- ✅ Any other features built from memory

### 2. Recover Forgotten Features

Legacy has features user forgot about:

- ✅ SAM.gov integration (MAJOR!)
- ✅ Opportunities management
- ✅ Middleware composition
- ✅ Rate limiting and idempotency
- ✅ Service layer architecture
- ✅ v2 API endpoints

### 3. Merge, Don't Replace

For each feature:
- Start with current implementation
- Add missing features from legacy
- Enhance with best parts of both
- Result: Better than either alone

### 4. Additive, Not Destructive

- Add new endpoints (`/api/v2/*`) alongside existing
- Add new pages alongside existing
- Add new features without breaking current
- Gradual migration, not big bang

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Middleware composition framework added
- ✅ Rate limiter upgraded
- ✅ Idempotency store added
- ✅ Service layers created
- ✅ Validation schemas extracted
- ✅ All existing APIs still work
- ✅ Typecheck passes
- ✅ Vercel build succeeds

### Phase 2 Complete When:
- ✅ SAM.gov integration fully functional
- ✅ Opportunities API added
- ✅ v2 endpoints added
- ✅ All forgotten features recovered
- ✅ All existing features still work
- ✅ Typecheck passes
- ✅ Vercel build succeeds

### Phase 3 Complete When:
- ✅ SAM.gov UI added
- ✅ All missing pages added
- ✅ All missing components added
- ✅ Navigation updated
- ✅ All features accessible
- ✅ Typecheck passes
- ✅ Vercel build succeeds

### Phase 4 Complete When:
- ✅ All utilities recovered
- ✅ All configs merged
- ✅ All middleware added
- ✅ Testing improved
- ✅ Typecheck passes
- ✅ Vercel build succeeds

### Phase 5 Complete When:
- ✅ Legacy `src/` directory deleted
- ✅ All features verified working
- ✅ Documentation updated
- ✅ Clean monorepo structure
- ✅ Zero technical debt from migration

---

## Next Steps

1. **Execute Phase 1**: Infrastructure Recovery
   - Start with middleware composition
   - Add rate limiter and idempotency
   - Create service layers
   - Extract validation schemas
   - Verify with typecheck and Vercel build

2. **Execute Phase 2**: Feature Recovery
   - Add SAM.gov integration (biggest win!)
   - Add opportunities management
   - Add v2 endpoints
   - Verify all features work

3. **Execute Phase 3**: UI Recovery
   - Add SAM.gov UI
   - Add missing pages
   - Update navigation

4. **Execute Phase 4**: Utilities Recovery
   - Add missing utilities
   - Merge configs
   - Improve testing

5. **Execute Phase 5**: Cleanup
   - Delete legacy directory
   - Final verification
   - Documentation update

---

## The Big Picture

**What we're really doing**: Recovering months of development work that user thought was lost!

**The prize**: A system that combines:
- Original complete implementation (legacy)
- Improved rebuild (current)
- Result: Better than either alone

**Timeline**: Methodical, verified at each step, no shortcuts, full E2E implementation.

