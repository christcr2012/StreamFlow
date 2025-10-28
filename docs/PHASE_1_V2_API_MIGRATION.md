# Phase 1: v2 API Migration - Detailed Plan (REVISED)

**Status**: In Progress
**Started**: 2025-01-19
**Goal**: Merge the best of legacy v2 and current tenant-app APIs

---

## CRITICAL REVISION (2025-01-19)

**User caught a major mistake**: I was about to blindly replace tenant-app APIs with v2 APIs without proper comparison!

**Key Finding**:
- Legacy v2 APIs have BETTER **architecture** (middleware, service layer, security)
- Current tenant-app APIs have BETTER **features** (AI scoring, tags, includes)
- **Solution**: HYBRID APPROACH - merge strengths, don't replace blindly

See `docs/API_COMPARISON.md` for detailed analysis.

---

## Revised Strategy

### 1. Infrastructure Migration (Non-Breaking)
- Migrate middleware composition framework
- Migrate rate-limiter and idempotency-store
- Migrate service layers
- Migrate validation schemas
- **DO NOT** replace existing APIs yet

### 2. Additive Endpoints (New Features)
- Add `/api/v2/opportunities` (tenant-app has none)
- Add `/api/v2/leads` (enhanced version with AI scoring)
- Keep existing `/api/leads` for backward compatibility

### 3. Enhance Existing (Non-Breaking)
- Add middleware to existing `/api/customers`
- Add middleware to existing `/api/leads`
- Add rate limiting across the board

---

## Dependencies to Migrate (in order)

### 1. Core Infrastructure

#### 1.1 API Response Helpers
- **Source**: `src/lib/api/response.ts`
- **Destination**: `apps/tenant-app/src/lib/api/response.ts`
- **Purpose**: `jsonOk()`, `jsonError()` helpers used by all v2 APIs
- **Dependencies**: None

#### 1.2 Middleware Composition
- **Source**: `src/lib/api/middleware.ts`
- **Destination**: `apps/tenant-app/src/lib/api/middleware.ts`
- **Purpose**: `compose()`, `withTenantAuth()`, `withRateLimit()`, `withIdempotencyRequired()`
- **Dependencies**: 
  - Rate limiting (`src/lib/rate-limit.ts` or `src/lib/rate-limiter.ts`)
  - Idempotency store (`src/lib/idempotency-store.ts`)
  - Auth helpers (`src/lib/auth-owner.ts` or tenant auth)

#### 1.3 Rate Limiting
- **Source**: `src/lib/rate-limit.ts` and `src/lib/rate-limiter.ts`
- **Destination**: `apps/tenant-app/src/lib/rate-limit.ts`
- **Purpose**: Rate limiting for API endpoints
- **Dependencies**: Redis or in-memory store
- **Note**: Check if tenant-app already has rate limiting

#### 1.4 Idempotency Store
- **Source**: `src/lib/idempotency-store.ts`
- **Destination**: `apps/tenant-app/src/lib/idempotency-store.ts`
- **Purpose**: Prevent duplicate requests
- **Dependencies**: Redis or KV store
- **Note**: May use `@cortiware/kv` package

### 2. Validation Schemas

#### 2.1 Lead Validation
- **Source**: `src/lib/validation/leads.ts`
- **Destination**: `apps/tenant-app/src/lib/validations/leads.ts`
- **Purpose**: Zod schemas for lead creation/update
- **Dependencies**: Zod

#### 2.2 Opportunity Validation
- **Source**: `src/lib/validation/opportunities.ts`
- **Destination**: `apps/tenant-app/src/lib/validations/opportunities.ts`
- **Purpose**: Zod schemas for opportunity creation/update
- **Dependencies**: Zod

#### 2.3 Organization Validation
- **Source**: `src/lib/validation/organizations.ts`
- **Destination**: `apps/tenant-app/src/lib/validations/organizations.ts`
- **Purpose**: Zod schemas for organization (Customer) creation/update
- **Dependencies**: Zod

### 3. Service Layer

#### 3.1 Lead Service
- **Source**: `src/services/leads.service.ts`
- **Destination**: `apps/tenant-app/src/services/leads.service.ts`
- **Purpose**: Business logic for leads (list, create, update, delete, deduplication)
- **Dependencies**: 
  - Prisma client
  - Audit logging
  - Lead scoring (if used)

#### 3.2 Opportunity Service
- **Source**: `src/services/opportunities.service.ts`
- **Destination**: `apps/tenant-app/src/services/opportunities.service.ts`
- **Purpose**: Business logic for opportunities
- **Dependencies**: Prisma client, audit logging

#### 3.3 Organization Service
- **Source**: `src/services/organizations.service.ts`
- **Destination**: `apps/tenant-app/src/services/organizations.service.ts`
- **Purpose**: Business logic for organizations (Customer entities)
- **Dependencies**: Prisma client, audit logging

### 4. API Routes

#### 4.1 Leads API
- **Source**: 
  - `src/app/api/v2/leads/route.ts` (GET, POST)
  - `src/app/api/v2/leads/[id]/route.ts` (GET, PATCH, DELETE)
- **Destination**: 
  - `apps/tenant-app/src/app/api/v2/leads/route.ts`
  - `apps/tenant-app/src/app/api/v2/leads/[id]/route.ts`
- **Dependencies**: All of the above

#### 4.2 Opportunities API
- **Source**: 
  - `src/app/api/v2/opportunities/route.ts`
  - `src/app/api/v2/opportunities/[id]/route.ts`
- **Destination**: 
  - `apps/tenant-app/src/app/api/v2/opportunities/route.ts`
  - `apps/tenant-app/src/app/api/v2/opportunities/[id]/route.ts`

#### 4.3 Organizations API
- **Source**: 
  - `src/app/api/v2/organizations/route.ts`
  - `src/app/api/v2/organizations/[id]/route.ts`
- **Destination**: 
  - `apps/tenant-app/src/app/api/v2/organizations/route.ts`
  - `apps/tenant-app/src/app/api/v2/organizations/[id]/route.ts`

#### 4.4 Auth API
- **Source**: 
  - `src/app/api/v2/auth/login/route.ts`
  - `src/app/api/v2/auth/logout/route.ts`
- **Destination**: 
  - `apps/tenant-app/src/app/api/v2/auth/login/route.ts`
  - `apps/tenant-app/src/app/api/v2/auth/logout/route.ts`
- **Note**: May conflict with existing `/api/auth/login` - need to evaluate

#### 4.5 User Profile API
- **Source**: `src/app/api/v2/me/route.ts`
- **Destination**: `apps/tenant-app/src/app/api/v2/me/route.ts`
- **Purpose**: Get current user profile

#### 4.6 Themes API
- **Source**: `src/app/api/v2/themes/route.ts`
- **Destination**: `apps/tenant-app/src/app/api/v2/themes/route.ts`
- **Note**: May conflict with existing `/api/theme` - need to evaluate

---

## Migration Steps (Detailed)

### Step 1: Prepare Infrastructure ✅

1. Create directory structure:
   ```bash
   mkdir -p apps/tenant-app/src/lib/api
   mkdir -p apps/tenant-app/src/lib/validations
   mkdir -p apps/tenant-app/src/services
   mkdir -p apps/tenant-app/src/app/api/v2
   ```

2. Review existing tenant-app code for conflicts:
   - Check if `apps/tenant-app/src/lib/rate-limit.ts` exists
   - Check if `apps/tenant-app/src/lib/auth-context.ts` can be used instead of `auth-owner.ts`
   - Identify any duplicate functionality

### Step 2: Migrate Core Infrastructure

**Order matters! Each file depends on previous ones.**

1. **API Response Helpers** (no dependencies)
   - Copy `src/lib/api/response.ts` → `apps/tenant-app/src/lib/api/response.ts`
   - Update imports to use tenant-app paths
   - Test: Create simple test route that uses `jsonOk()` and `jsonError()`

2. **Rate Limiting** (check for existing first)
   - Review `apps/tenant-app/src/lib/rate-limit.ts` (if exists)
   - Compare with `src/lib/rate-limit.ts` and `src/lib/rate-limiter.ts`
   - Migrate or consolidate
   - Test: Create test route with rate limiting

3. **Idempotency Store**
   - Copy `src/lib/idempotency-store.ts` → `apps/tenant-app/src/lib/idempotency-store.ts`
   - Update to use `@cortiware/kv` if available
   - Test: Create test route with idempotency

4. **Middleware Composition**
   - Copy `src/lib/api/middleware.ts` → `apps/tenant-app/src/lib/api/middleware.ts`
   - Update auth middleware to use tenant-app's auth system
   - Update imports for rate-limit and idempotency-store
   - Test: Create test route with composed middleware

### Step 3: Migrate Validation Schemas

1. Copy validation files:
   - `src/lib/validation/leads.ts` → `apps/tenant-app/src/lib/validations/leads.ts`
   - `src/lib/validation/opportunities.ts` → `apps/tenant-app/src/lib/validations/opportunities.ts`
   - `src/lib/validation/organizations.ts` → `apps/tenant-app/src/lib/validations/organizations.ts`

2. Update imports in each file

3. Test: Import and use schemas in test file

### Step 4: Migrate Service Layer

1. **Lead Service**
   - Copy `src/services/leads.service.ts` → `apps/tenant-app/src/services/leads.service.ts`
   - Update Prisma import to use tenant-app's client
   - Update any audit logging imports
   - Review for any provider-specific code that needs removal
   - Test: Call service methods directly

2. **Opportunity Service**
   - Same process as Lead Service

3. **Organization Service**
   - Same process as Lead Service
   - Note: This uses `Customer` model, verify schema compatibility

### Step 5: Migrate API Routes (One at a time!)

**For each API route:**
1. Copy route file to tenant-app
2. Update all imports
3. Run typecheck
4. Test locally (if possible without breaking existing)
5. Deploy to Vercel
6. Test deployed endpoint
7. Commit

**Order:**
1. `/api/v2/me` (simplest, no dependencies)
2. `/api/v2/leads` (collection + detail)
3. `/api/v2/opportunities` (collection + detail)
4. `/api/v2/organizations` (collection + detail)
5. `/api/v2/auth/*` (evaluate conflicts first)
6. `/api/v2/themes` (evaluate conflicts first)

### Step 6: Update Client Code

1. Find all references to `/api/leads` in tenant-app
2. Evaluate if they should use `/api/v2/leads` instead
3. Update gradually or create adapter layer

### Step 7: Verification

1. Run typecheck: `npm run typecheck`
2. Run build: Deploy to Vercel (no local builds!)
3. Test all endpoints:
   - GET /api/v2/leads
   - POST /api/v2/leads
   - GET /api/v2/leads/[id]
   - PATCH /api/v2/leads/[id]
   - DELETE /api/v2/leads/[id]
   - (Same for opportunities and organizations)
4. Verify middleware:
   - Rate limiting works
   - Idempotency works
   - Auth works
   - Audit logging works

---

## Risks & Mitigation

### Risk 1: Import Path Conflicts
- **Issue**: `@/lib/...` paths may resolve differently
- **Mitigation**: Use explicit relative paths during migration, then refactor

### Risk 2: Prisma Model Differences
- **Issue**: Legacy code may expect different schema
- **Mitigation**: Compare schemas first, create migrations if needed

### Risk 3: Breaking Existing APIs
- **Issue**: Current `/api/leads` may be in use
- **Mitigation**: Keep both during transition, deprecate old gradually

### Risk 4: Missing Dependencies
- **Issue**: Legacy code may use packages not in tenant-app
- **Mitigation**: Check package.json, install missing deps

---

## Success Criteria

- [ ] All v2 API routes respond correctly
- [ ] Middleware composition works (auth, rate limit, idempotency)
- [ ] Service layer functions correctly
- [ ] Validation schemas work
- [ ] No TypeScript errors
- [ ] Vercel build succeeds
- [ ] All tests pass (if any)
- [ ] Documentation updated

---

## Next Phase

After Phase 1 complete → **Phase 2: Migrate SAM.gov Integration**

