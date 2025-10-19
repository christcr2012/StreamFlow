# Migration: Correct Understanding

**Date**: 2025-01-19  
**Critical Correction**: Provider and Tenant apps are DIFFERENT systems that connect to each other

---

## The Correct Understanding

### Provider Portal (`apps/provider-portal/`)

**Purpose**: Internal tool for Robinson AI Systems employees to manage the Cortiware platform

**Users**: 
- Robinson AI Systems employees (providers, developers, owners, accountants)
- NOT tenant company employees
- NOT tenant company customers

**Functionality**:
- Manage tenant organizations
- Monitor platform health
- Configure features and pricing
- View analytics across all tenants
- Manage billing and subscriptions
- Developer tools (API keys, webhooks)

**Database**: Separate provider database

**Auth**: Provider-specific authentication (rs_provider, rs_developer cookies)

---

### Tenant App (`apps/tenant-app/`)

**Purpose**: Customer-facing application for tenant companies (e.g., HVAC companies, law firms)

**Users**:
- Employees of tenant companies
- NOT Robinson AI Systems employees

**Functionality**:
- CRM (leads, customers, opportunities)
- SAM.gov lead generation
- Job management
- Invoicing
- Industry-specific features

**Database**: Separate tenant database

**Auth**: Tenant-specific authentication (rs_user, rs_client cookies)

---

## How They Connect

**Provider Portal → Tenant App**:
- Provider creates/configures tenant organizations
- Provider sets feature flags, pricing, limits
- Provider monitors tenant usage and health
- Provider manages billing

**Tenant App → Provider Portal**:
- Tenant app reports usage metrics
- Tenant app sends webhook events
- Tenant app requests features/support

**They are NOT the same app with different views - they are separate systems!**

---

## Legacy Structure Reanalysis

### What Legacy `src/` Actually Contained

Looking at the route groups:

1. **`src/app/(app)/`** - TENANT APP ROUTES
   - `/dashboard`, `/leads`, `/opportunities`, `/organizations`, `/settings`
   - For tenant company employees
   - Cookie: `rs_user` or `mv_user`

2. **`src/app/(developer)/`** - PROVIDER PORTAL ROUTES (Developer view)
   - For Robinson AI Systems developers
   - Cookie: `rs_developer`

3. **`src/app/(owner)/`** - PROVIDER PORTAL ROUTES (Owner view)
   - For Robinson AI Systems owners
   - Cookie: `rs_provider` or similar

4. **`src/app/(accountant)/`** - PROVIDER PORTAL ROUTES (Accountant view)
   - For Robinson AI Systems accountants
   - Cookie: specific accountant cookie

### What This Means

**Legacy system had BOTH apps in one codebase**:
- Tenant app routes: `(app)/`
- Provider portal routes: `(developer)/`, `(owner)/`, `(accountant)/`

**After monorepo split**:
- Tenant routes → Should be in `apps/tenant-app/`
- Provider routes → Should be in `apps/provider-portal/`

---

## Correct Migration Strategy

### Shared Infrastructure (Both Apps Need)

**These are utilities that BOTH apps need independently**:

- ✅ Redis client - Both apps need Redis
- ✅ Rate limiter - Both apps need rate limiting
- ✅ Idempotency store - Both apps need idempotency
- ✅ Middleware composition - Both apps need middleware
- ✅ API response helpers - Both apps need consistent responses

**What I Did**: ✅ CORRECT
- Added to tenant-app (which was missing them)
- Provider-portal already has them (added earlier)
- Both apps now have the same infrastructure utilities

**Why This Is Right**:
- Both apps are separate Next.js applications
- Both need their own rate limiting, Redis connections, middleware
- They don't share these at runtime - each app has its own instance
- The CODE is shared (same implementation), but RUNTIME is separate

---

### Tenant-Specific Features (Tenant App Only)

**These belong ONLY in `apps/tenant-app/`**:

1. **SAM.gov Integration**
   - `src/app/(app)/leads/sam-gov/` → `apps/tenant-app/src/app/(tenant)/leads/sam-gov/`
   - Tenant companies search for government contracts
   - Provider portal doesn't need this

2. **Opportunities Management**
   - `src/app/(app)/opportunities/` → `apps/tenant-app/src/app/(tenant)/opportunities/`
   - Tenant companies manage sales opportunities
   - Provider portal doesn't manage tenant opportunities

3. **Customer/Lead Management**
   - `src/app/(app)/leads/` → `apps/tenant-app/src/app/(tenant)/leads/`
   - `src/app/(app)/organizations/` → `apps/tenant-app/src/app/(tenant)/customers/`
   - Tenant companies manage their customers
   - Provider portal manages tenant organizations (different!)

4. **Tenant APIs**
   - `src/app/api/v2/leads/` → `apps/tenant-app/src/app/api/leads/`
   - `src/app/api/v2/opportunities/` → `apps/tenant-app/src/app/api/opportunities/`
   - `src/app/api/v2/organizations/` → `apps/tenant-app/src/app/api/customers/`

5. **Tenant Services**
   - `src/services/leads.service.ts` → `apps/tenant-app/src/services/leads.service.ts`
   - `src/services/opportunities.service.ts` → `apps/tenant-app/src/services/opportunities.service.ts`
   - `src/services/sam-gov.service.ts` → `apps/tenant-app/src/services/sam-gov.service.ts`

---

### Provider-Specific Features (Provider Portal Only)

**These belong ONLY in `apps/provider-portal/`**:

1. **Tenant Management** (Provider manages tenant orgs)
   - `src/app/(owner)/verticals/` → `apps/provider-portal/src/app/provider/...`
   - Provider creates/configures tenant organizations
   - Already in provider-portal

2. **Platform Analytics** (Provider monitors all tenants)
   - `src/app/(developer)/...` → `apps/provider-portal/src/app/developer/...`
   - Provider views usage across all tenants
   - Already in provider-portal

3. **Billing & Monetization** (Provider manages billing)
   - Provider sets pricing, manages subscriptions
   - Already in provider-portal

4. **Developer Tools** (Provider manages API keys)
   - API explorer, webhooks, usage monitoring
   - Already in provider-portal

---

## What I Need to Do

### Phase 1: Infrastructure (CORRECT - DONE ✅)

**What I Did**:
- Added redis, rate-limiter, idempotency, middleware to tenant-app
- Provider-portal already has these (added earlier)

**Why This Was Right**:
- Both apps are separate systems
- Both need the same infrastructure utilities
- They run independently, don't share at runtime
- Code is duplicated (or could be in shared package), but that's correct

### Phase 2: Tenant Feature Recovery (NEXT)

**What I Need to Do**:
- Migrate features from `src/app/(app)/` to `apps/tenant-app/`
- These are TENANT-SPECIFIC features
- Provider portal doesn't need them

**Items**:
1. SAM.gov integration (tenant companies search government contracts)
2. Opportunities management (tenant companies manage sales)
3. Enhanced lead/customer management
4. Tenant-specific services and APIs

### Phase 3: Provider Verification (LIKELY DONE)

**What I Need to Check**:
- Does provider-portal have all features from `src/app/(developer)/`, `(owner)/`, `(accountant)/`?
- Likely already complete (provider-portal looks comprehensive)

### Phase 4: Cleanup

**Final Step**:
- Delete legacy `src/` directory
- Verify both apps work independently

---

## Key Insights (CORRECTED)

### 1. Two Separate Systems

- **Provider Portal**: Internal tool for Robinson AI Systems
- **Tenant App**: Customer-facing app for tenant companies
- They connect via APIs, but are separate applications

### 2. Shared Infrastructure ≠ Same App

- Both apps need redis, rate-limiting, middleware
- But they run separately with separate instances
- Duplicating infrastructure code is CORRECT

### 3. Features Are App-Specific

- SAM.gov, opportunities, leads → Tenant app only
- Tenant management, platform analytics → Provider portal only
- They serve different users with different needs

### 4. My Phase 1 Work Was Correct

- I added infrastructure to tenant-app that it was missing
- Provider-portal already has the same infrastructure
- Both apps now have what they need to run independently

---

## Next Steps (CONFIRMED CORRECT)

1. ✅ Phase 1 complete - Infrastructure recovered for tenant-app
2. ⏭️ Phase 2 - Migrate tenant-specific features (SAM.gov, opportunities, etc.)
3. ⏭️ Phase 3 - Verify provider-portal completeness
4. ⏭️ Phase 4 - Cleanup legacy directory

**Focus**: Recover forgotten TENANT features for tenant-app
**Not**: Make provider-portal and tenant-app the same
**Not**: Share runtime infrastructure between apps

