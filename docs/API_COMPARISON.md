# API Comparison: Legacy v2 vs Current Tenant-App

**Purpose**: Determine which APIs are better before migration  
**Date**: 2025-01-19

---

## Comparison Methodology

For each API endpoint, compare:
1. **Architecture**: Middleware composition, service layer, validation
2. **Features**: Rate limiting, idempotency, audit logging, error handling
3. **Code Quality**: TypeScript types, error handling, documentation
4. **Functionality**: Pagination, filtering, search, deduplication
5. **Auth**: Authentication method and security

---

## 1. Leads API

### Current Tenant-App: `/api/leads`

**File**: `apps/tenant-app/src/app/api/leads/route.ts`

**Architecture**:
- ❌ No middleware composition
- ❌ No service layer (direct Prisma calls in route)
- ✅ Inline validation with Zod schemas
- ❌ No rate limiting
- ❌ No idempotency
- ❌ No audit logging

**Auth**:
- Simple cookie check (`rs_client`, `client-session`, `ws_client`)
- Simplified orgId extraction (comment says "in production, decode JWT")
- ⚠️ **SECURITY CONCERN**: Not using proper JWT decoding

**Features**:
- ✅ Pagination with cursor
- ✅ Filtering by status and sourceType
- ✅ AI scoring fields (aiScore, scoreFactors)
- ❌ No search functionality
- ❌ No deduplication

**Code Quality**:
- ✅ TypeScript with Zod validation
- ✅ Proper error handling
- ⚠️ Direct Prisma calls (no abstraction)

**Lines of Code**: 208

---

### Legacy v2: `/api/v2/leads`

**File**: `src/app/api/v2/leads/route.ts`

**Architecture**:
- ✅ Middleware composition (`compose`, `withTenantAuth`, `withRateLimit`, `withIdempotencyRequired`)
- ✅ Service layer (`leadService.list()`, `leadService.create()`)
- ✅ Separate validation module (`validateLeadCreate`)
- ✅ Rate limiting with preset `api`
- ✅ Idempotency for POST requests
- ✅ Audit logging (in service layer)

**Auth**:
- Proper middleware (`withTenantAuth()`)
- Injects `x-org-id` and `x-user-id` headers
- ✅ **SECURE**: Proper authentication flow

**Features**:
- ✅ Pagination with cursor
- ✅ Filtering by status and sourceType
- ✅ Search with `q` parameter
- ✅ Deduplication (in service layer)
- ❌ No AI scoring fields (older implementation)

**Code Quality**:
- ✅ TypeScript with separate validation
- ✅ Clean separation of concerns
- ✅ Service layer abstraction
- ✅ Proper error responses (`jsonOk`, `jsonError`)

**Lines of Code**: 58 (much cleaner due to abstraction)

---

### **VERDICT: Leads API**

**Winner**: **HYBRID APPROACH NEEDED**

**Reasoning**:
- Legacy v2 has SUPERIOR architecture (middleware, service layer, security)
- Current tenant-app has NEWER features (AI scoring)
- **Solution**: Migrate v2 architecture but ADD AI scoring fields

**Action**:
1. Use v2 API structure as base
2. Add AI scoring fields to service layer
3. Update validation schemas to include AI fields
4. Keep current tenant-app as `/api/leads` for backward compatibility
5. Add v2 as `/api/v2/leads` with enhanced features

---

## 2. Customers/Organizations API

### Current Tenant-App: `/api/customers`

**File**: `apps/tenant-app/src/app/api/customers/route.ts`

**Architecture**:
- ✅ Uses `getAuthContext()` from `@cortiware/auth-service`
- ✅ Separate validation schemas (`CreateCustomerSchema`, `CustomerFilterSchema`)
- ✅ Error handler (`createSafeErrorResponse`)
- ❌ No rate limiting
- ❌ No idempotency
- ❌ No audit logging

**Auth**:
- ✅ Proper auth context with `@cortiware/auth-service`
- ✅ Checks `isAuthenticated` and `orgId`

**Features**:
- ✅ Search with `query` parameter (company, name, email)
- ✅ Tag filtering
- ✅ Pagination (page/limit style, not cursor)
- ✅ Includes related data (contacts, job count, invoice count)
- ✅ Total count for pagination

**Code Quality**:
- ✅ TypeScript with Zod validation
- ✅ Proper error handling
- ✅ Clean code structure

**Lines of Code**: 108

---

### Legacy v2: `/api/v2/organizations`

**File**: `src/app/api/v2/organizations/route.ts`

**Architecture**:
- ✅ Middleware composition (`compose`, `withTenantAuth`, `withRateLimit`, `withIdempotencyRequired`)
- ✅ Service layer (`organizationService`)
- ✅ Separate validation module
- ✅ Rate limiting
- ✅ Idempotency for POST
- ✅ Audit logging (in service layer)

**Auth**:
- ✅ Proper middleware (`withTenantAuth()`)
- ✅ Header injection

**Features**:
- ✅ Pagination with cursor
- ✅ Search with `q` parameter
- ❌ No tag filtering
- ❌ No related data includes
- ❌ No total count

**Code Quality**:
- ✅ TypeScript with separate validation
- ✅ Clean separation of concerns
- ✅ Service layer abstraction

---

### **VERDICT: Customers/Organizations API**

**Winner**: **HYBRID APPROACH NEEDED**

**Reasoning**:
- Current tenant-app has BETTER features (tags, includes, total count)
- Legacy v2 has BETTER architecture (middleware, security)
- **Solution**: Merge the best of both

**Action**:
1. Keep current `/api/customers` as-is (it's good!)
2. Add middleware composition for security
3. Add rate limiting and idempotency
4. Consider v2 as optional enhancement, not replacement

---

## 3. Opportunities API

### Current Tenant-App: `/api/opportunities`

**Status**: ❌ **DOES NOT EXIST**

---

### Legacy v2: `/api/v2/opportunities`

**File**: `src/app/api/v2/opportunities/route.ts`

**Status**: ✅ **EXISTS** with full CRUD

**Architecture**:
- ✅ Full middleware composition
- ✅ Service layer
- ✅ Validation schemas
- ✅ Rate limiting, idempotency, audit logging

---

### **VERDICT: Opportunities API**

**Winner**: **LEGACY v2** (no competition)

**Reasoning**:
- Tenant-app has NO opportunities API
- Legacy v2 has complete implementation
- **Solution**: Migrate v2 opportunities API directly

**Action**:
1. Migrate `/api/v2/opportunities` to tenant-app
2. This is a net-new feature addition

---

## Overall Strategy

### DO NOT blindly replace tenant-app APIs!

**Approach**:

1. **Leads API**: 
   - Enhance v2 with AI scoring from current
   - Deploy as `/api/v2/leads` (new endpoint)
   - Keep `/api/leads` for backward compatibility
   - Gradually migrate clients to v2

2. **Customers API**:
   - Enhance current `/api/customers` with middleware
   - Add rate limiting and idempotency
   - Keep as `/api/customers` (no v2 needed)
   - Legacy `/api/v2/organizations` can be deprecated

3. **Opportunities API**:
   - Migrate v2 directly (no conflict)
   - Deploy as `/api/v2/opportunities`

4. **Infrastructure**:
   - Migrate middleware composition to tenant-app
   - Migrate service layers
   - Migrate validation schemas
   - Add to existing APIs incrementally

---

## Migration Priority (REVISED)

### Phase 1A: Infrastructure (No Breaking Changes)
1. Migrate middleware composition
2. Migrate rate-limiter and idempotency-store
3. Migrate validation schemas
4. Migrate service layers

### Phase 1B: New Endpoints (Additive Only)
1. Add `/api/v2/opportunities` (new feature)
2. Add `/api/v2/leads` (enhanced version, keep old)
3. Add `/api/v2/me` (user profile)

### Phase 1C: Enhance Existing (Non-Breaking)
1. Add middleware to `/api/customers`
2. Add middleware to `/api/leads`
3. Add rate limiting across the board

### Phase 2: SAM.gov Integration
- Depends on Phase 1 infrastructure
- Net-new feature, no conflicts

---

## Key Insight

**The legacy v2 APIs are NOT universally better!**

- v2 has better **architecture** (middleware, service layer, security)
- Current tenant-app has better **features** (AI scoring, tags, includes)
- **Best approach**: Merge the strengths, don't replace blindly

**User was RIGHT to stop me!** I was about to make a mistake by assuming v2 was always better.

