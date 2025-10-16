# Cortiware Master Implementation Plan - Complete Technical Order

**Date**: 2025-10-16  
**Goal**: Build the best system in the best way possible  
**Approach**: Technical excellence over speed  
**Status**: Ready to Execute

---

## 🎯 Executive Summary

This plan integrates ALL outstanding work across the Cortiware system:
1. **Cleaning Vertical** (production-ready implementation)
2. **Provider Portal Fixes** (critical settings, analytics, missing features)
3. **Test Data & Integration Testing** (5 complete verticals)
4. **Technical Debt Resolution** (from all audit documents)
5. **Missing Features** (documented but not implemented)

**Total Estimated Effort**: 80-120 hours (2-3 weeks full-time)  
**Phases**: 10 phases in proper technical dependency order

---

## 📊 Current State Analysis

### What's Complete ✅
- ✅ Turborepo monorepo structure
- ✅ Next.js 15.1.0 apps (tenant-app, provider-portal)
- ✅ Prisma ORM with Neon Postgres
- ✅ Authentication system (Option C)
- ✅ Stripe integration
- ✅ Wallet system
- ✅ Theme system
- ✅ Basic vertical packs (5 complete, 13 skeletons)
- ✅ CI/CD with GitHub Actions
- ✅ Vercel deployments

### What's Broken/Incomplete ❌
- ❌ Provider Portal settings (no persistence)
- ❌ Provider Portal analytics (empty state issues)
- ❌ 4 major Provider Portal features (documented but not implemented)
- ❌ 13 vertical packs (skeleton only)
- ❌ Test data (no test tenants)
- ❌ Integration testing (provider ↔ tenant)
- ❌ Technical debt (in-memory stores, missing error handling)

---

## 🏗️ Implementation Phases (Technical Dependency Order)

### **PHASE 0: Foundation & Cleanup** (4-6 hours)

**Goal**: Ensure solid foundation before building

**Tasks**:
1. ✅ **Fix Current Vercel Deployment Issues**
   - Resolve any pending typecheck errors
   - Ensure both apps deploy successfully
   - Verify CI/CD pipeline is green

2. ✅ **Database Schema Audit**
   - Review Prisma schema for completeness
   - Identify missing tables/fields
   - Plan migrations for all upcoming features

3. ✅ **Documentation Consolidation**
   - Archive outdated docs (mark as HISTORICAL)
   - Create single source of truth for each feature
   - Update AI_AGENT_REFERENCE.md with current state

4. ✅ **Dependency Audit**
   - Verify all `@types/*` in correct location
   - Update outdated packages
   - Remove unused dependencies

**Deliverables**:
- ✅ Green CI/CD pipeline
- ✅ Clean Prisma schema baseline
- ✅ Consolidated documentation
- ✅ Updated dependencies

**Verification**:
```bash
npm run typecheck  # All apps
npm run build      # All apps (locally for verification only)
npm run test       # All tests passing
```

---

### **PHASE 1: Database Schema - Complete** (6-8 hours)

**Goal**: Add ALL missing database models in one migration

**Why First**: All subsequent features depend on database schema

**Tasks**:

1. ✅ **Cleaning Vertical Models** (from CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md)
   - CleaningLead
   - CleaningEstimate
   - CleaningContract
   - CleaningWorkOrder
   - CleaningWorkOrderEvent
   - CleaningInspection
   - CleaningChecklistTemplate

2. ✅ **Provider Portal Models** (from PROVIDER_PORTAL_ISSUES_AND_FIXES_2025-10-16.md)
   - Expand ProviderConfig (settings fields)
   - Add missing indexes
   - Add RLS policies

3. ✅ **Missing Core Models** (from ACTUAL_REMAINING_WORK.md)
   - Activity table (referenced in TODOs)
   - Enhanced audit logging tables
   - Missing CRM fields

4. ✅ **Vertical Pack Support Models**
   - Generic work order tables
   - Generic scheduling tables
   - Generic QA/inspection tables

**Deliverables**:
- ✅ Single comprehensive migration
- ✅ Updated Prisma schema
- ✅ Generated Prisma client
- ✅ Migration applied to Neon database

**Verification**:
```bash
cd apps/tenant-app
npx prisma migrate dev --name complete_schema_2025_10_16
npx prisma generate
npx prisma studio  # Verify tables exist
```

---

### **PHASE 2: Enhanced Vertical Packs** (8-10 hours)

**Goal**: Upgrade all 5 complete vertical packs with real logic

**Why Second**: Provides foundation for test data and tenant features

**Tasks**:

1. ✅ **Cleaning Vertical** (PRIORITY - most comprehensive)
   - Enhanced forms (lead, estimate, work-order)
   - Detailed pricebook with SKUs
   - Real estimation logic
   - Checklist templates (residential, commercial, post-construction)
   - AI estimator function (wallet-guarded)
   - File: `packages/verticals/src/packs/cleaning.ts`
   - Supporting files: `packages/verticals/cleaning/*`

2. ✅ **Port-a-John Vertical** (already most complete)
   - Verify existing implementation
   - Add any missing estimation logic
   - Add checklist templates

3. ✅ **Fencing Vertical**
   - Enhanced estimation (materials + labor)
   - Add measurement helpers
   - Add installation checklists

4. ✅ **Appliance Rental Vertical**
   - Enhanced pricing (daily/weekly/monthly)
   - Add delivery/setup logic
   - Add maintenance checklists

5. ✅ **Roll-Off Vertical**
   - Enhanced pricing (size + duration)
   - Add weight limits
   - Add disposal checklists

**Deliverables**:
- ✅ 5 production-ready vertical packs
- ✅ Comprehensive forms for each
- ✅ Real estimation logic (no placeholders)
- ✅ Checklist templates
- ✅ Unit tests for estimation logic

**Verification**:
```typescript
// Test each vertical pack
import { pack } from '@cortiware/verticals/cleaning';
const estimate = pack.estimate({ spaceType: 'residential', squareFeet: 2000 });
console.log(estimate); // Should return real numbers, not placeholders
```

---

### **PHASE 3: Provider Portal - Critical Fixes** (8-10 hours)

**Goal**: Fix broken settings and analytics

**Why Third**: Needed before test data (settings configure provider behavior)

**Tasks**:

1. ✅ **Settings Persistence** (CRITICAL)
   - Complete `/api/provider/settings` endpoint
   - Update settings page to use real API
   - Add encryption for API keys
   - Add Zod validation
   - Add toast notifications
   - Add test functionality
   - Files:
     - `apps/provider-portal/src/app/api/provider/settings/route.ts` (enhance)
     - `apps/provider-portal/src/app/provider/settings/page.tsx` (rewrite)

2. ✅ **Analytics Empty State**
   - Add empty state UI
   - Calculate real metrics from database
   - Add error handling
   - Add loading states
   - File: `apps/provider-portal/src/app/provider/analytics/page.tsx`

3. ✅ **Security Settings**
   - 2FA toggle (implementation)
   - Session timeout configuration
   - IP whitelist management
   - File: `apps/provider-portal/src/app/provider/settings/security/page.tsx`

4. ✅ **Integration Settings**
   - Stripe configuration
   - SAM.gov configuration
   - API rate limit settings
   - File: `apps/provider-portal/src/app/provider/settings/integrations/page.tsx`

**Deliverables**:
- ✅ Working settings persistence
- ✅ Encrypted API key storage
- ✅ Analytics with real data
- ✅ Security features implemented
- ✅ Integration settings functional

**Verification**:
1. Save settings → Refresh page → Settings persist
2. Test Stripe connection → Success/failure feedback
3. View analytics → Real data or empty state (no errors)

---

### **PHASE 4: Test Data & Seed Scripts** (6-8 hours)

**Goal**: Create comprehensive test data for all 5 verticals

**Why Fourth**: Needs vertical packs and database schema

**Tasks**:

1. ✅ **Seed Script Structure**
   - File: `scripts/seed-test-tenants.ts`
   - Reusable functions for each entity type
   - Idempotent (can run multiple times)

2. ✅ **Test Tenants** (5 tenants, one per vertical)
   - Clean Sweep Services (Cleaning)
   - Mile High Fence Co (Fencing)
   - Rocky Mountain Portables (Port-a-John)
   - Front Range Dumpsters (Roll-Off)
   - Appliance Rentals Plus (Appliance Rental)

3. ✅ **Test Data Per Tenant**
   - Organization record
   - Owner user (with bcrypt password)
   - Active subscription
   - 5-10 leads (mix of statuses)
   - 2-3 invoices (paid, overdue, pending)
   - API usage data
   - Vertical-specific pricing

4. ✅ **Test Credentials**
   - Format: `{vertical}@test.cortiware.com` / `Test123!`
   - Document in `docs/TEST_CREDENTIALS.md`

**Deliverables**:
- ✅ Seed script (`scripts/seed-test-tenants.ts`)
- ✅ 5 test tenants with full data
- ✅ Test credentials documented
- ✅ Seed can be run repeatedly (idempotent)

**Verification**:
```bash
npm run seed:test-tenants
# Verify in Prisma Studio
npx prisma studio
# Verify login
# Visit tenant-app, login with cleaning@test.cortiware.com / Test123!
```

---

### **PHASE 5: Cleaning Vertical - API Routes** (10-12 hours)

**Goal**: Implement complete API for cleaning vertical

**Why Fifth**: Needs database schema and vertical pack

**Tasks**:

1. ✅ **Leads API**
   - `GET /api/cleaning/leads` - List leads
   - `POST /api/cleaning/leads` - Create lead
   - `GET /api/cleaning/leads/[id]` - Get lead
   - `PATCH /api/cleaning/leads/[id]` - Update lead
   - `DELETE /api/cleaning/leads/[id]` - Delete lead

2. ✅ **Estimates API**
   - `GET /api/cleaning/estimates` - List estimates
   - `POST /api/cleaning/estimates` - Create estimate
   - `GET /api/cleaning/estimates/[id]` - Get estimate
   - `PATCH /api/cleaning/estimates/[id]` - Update estimate
   - `POST /api/cleaning/estimates/[id]/ai` - AI estimator (wallet-guarded)

3. ✅ **Contracts API**
   - `GET /api/cleaning/contracts` - List contracts
   - `POST /api/cleaning/contracts` - Create contract
   - `GET /api/cleaning/contracts/[id]` - Get contract
   - `PATCH /api/cleaning/contracts/[id]` - Update contract

4. ✅ **Work Orders API**
   - `GET /api/cleaning/work-orders` - List work orders
   - `POST /api/cleaning/work-orders` - Create work order
   - `GET /api/cleaning/work-orders/[id]` - Get work order
   - `PATCH /api/cleaning/work-orders/[id]` - Update work order
   - `POST /api/cleaning/work-orders/[id]/events` - Add event

5. ✅ **QA/Inspections API**
   - `GET /api/cleaning/qa/inspections` - List inspections
   - `POST /api/cleaning/qa/inspections` - Create inspection
   - `GET /api/cleaning/qa/inspections/[id]` - Get inspection
   - `PATCH /api/cleaning/qa/inspections/[id]` - Update inspection

6. ✅ **Billing API**
   - `GET /api/cleaning/billing` - List billables
   - `POST /api/cleaning/billing/generate-invoice` - Generate invoice

**Patterns to Follow**:
- Use existing auth middleware
- Zod validation on all inputs
- Idempotency keys for mutations
- Consistent error responses
- Audit logging

**Deliverables**:
- ✅ 25+ API endpoints
- ✅ Zod schemas for validation
- ✅ Error handling
- ✅ Audit logging
- ✅ Unit tests for each endpoint

**Verification**:
```bash
# Test each endpoint with curl or Postman
curl -X GET http://localhost:3000/api/cleaning/leads \
  -H "Cookie: rs_client=<session>"
```

---

### **PHASE 6: Cleaning Vertical - Tenant UI** (12-15 hours)

**Goal**: Build complete tenant-facing UI for cleaning

**Why Sixth**: Needs API routes

**Tasks**:

1. ✅ **Leads Kanban Board**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/leads/page.tsx`
   - Drag-and-drop between columns (NEW, CONTACTED, ESTIMATED, WON, LOST)
   - Quick actions (call, email, estimate)
   - Filters (date range, status, source)

2. ✅ **Lead Detail & AI Estimate**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/leads/[id]/page.tsx`
   - Lead information form
   - AI estimate button (wallet-guarded)
   - 3 options display (Good/Better/Best)
   - Convert to estimate

3. ✅ **Estimate Builder**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/estimates/[id]/page.tsx`
   - Template selection
   - Line item editor
   - Pricing calculator
   - Preview & send

4. ✅ **Contract Editor**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/contracts/[id]/page.tsx`
   - RRULE editor (recurrence)
   - SLA configuration
   - Price escalators
   - E-signature integration

5. ✅ **Schedule Board**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/schedule/page.tsx`
   - Drag-and-drop scheduling
   - Calendar view
   - Map view
   - Assignment to cleaners

6. ✅ **Work Order Detail**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/schedule/[id]/page.tsx`
   - Checklist completion
   - Photo upload
   - Signature capture
   - Timeline/events

7. ✅ **QA Inspections**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/qa/inspections/page.tsx`
   - Inspection list
   - Scoring interface
   - Defect heatmap
   - Trends chart

8. ✅ **Billing Review**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/billing/page.tsx`
   - Pre-billing review
   - Generate invoices
   - Stripe integration

9. ✅ **Analytics Dashboard**
   - File: `apps/tenant-app/src/app/(tenant)/cleaning/analytics/page.tsx`
   - Job profitability
   - Schedule adherence
   - QA scores
   - Lead→win funnel

**UI Components to Create**:
- `DragDropScheduleBoard` - Drag-and-drop scheduling
- `RRuleEditor` - Recurrence rule editor
- `ChecklistDesigner` - Checklist template builder
- `InspectionScoring` - QA scoring interface
- `EstimateOptionCard` - Good/Better/Best options
- `MapView` - Site locations map

**Deliverables**:
- ✅ 9 complete pages
- ✅ 6+ reusable components
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications

**Verification**:
1. Navigate to `/cleaning/leads` → See Kanban board
2. Create lead → AI estimate → 3 options appear
3. Accept estimate → Create contract → RRULE saves
4. Schedule work order → Drag to cleaner → Assignment saves

---

### **PHASE 7: Cleaning Vertical - Automation** (4-6 hours)

**Goal**: Implement cron jobs for automation

**Why Seventh**: Needs database, API, and UI

**Tasks**:

1. ✅ **Schedule Expansion Cron**
   - File: `apps/tenant-app/src/app/api/cron/cleaning/expand-schedules/route.ts`
   - Runs every 15 minutes
   - Expands RRULE contracts into work orders
   - Skips holidays
   - Creates 8 weeks ahead

2. ✅ **Invoice Generation Cron**
   - File: `apps/tenant-app/src/app/api/cron/cleaning/generate-invoices/route.ts`
   - Runs nightly (2 AM)
   - Creates invoices from completed work orders
   - Applies pricing/taxes
   - Sends to Stripe

3. ✅ **Inspection Creation Cron**
   - File: `apps/tenant-app/src/app/api/cron/cleaning/create-inspections/route.ts`
   - Runs daily (6 AM)
   - Randomly selects work orders for QA
   - Target percentage (e.g., 10%)
   - Creates inspection records

4. ✅ **Vercel Cron Configuration**
   - File: `vercel.json`
   - Add cron schedules
   - Secure with CRON_SECRET

**Deliverables**:
- ✅ 3 cron jobs
- ✅ Vercel cron configuration
- ✅ Logging and error handling
- ✅ Idempotent execution

**Verification**:
```bash
# Test locally
curl -X POST http://localhost:3000/api/cron/cleaning/expand-schedules \
  -H "Authorization: Bearer $CRON_SECRET"

# Verify in Vercel dashboard after deploy
# Check cron logs
```

---

### **PHASE 8: Provider Portal - Missing Features** (15-20 hours)

**Goal**: Implement 4 major missing features

**Why Eighth**: Needs test data to test against

**Tasks**:

1. ✅ **Tenant Onboarding** (replaces Provisioning)
   - File: `apps/provider-portal/src/app/provider/onboarding/page.tsx`
   - Onboarding wizard
   - Vertical selection
   - Initial configuration
   - Welcome email
   - Estimated: 4-5 hours

2. ✅ **Provider Action Center**
   - File: `apps/provider-portal/src/app/provider/action-center/page.tsx`
   - Unified queue (disputes, overdue invoices, expiring subscriptions)
   - Priority sorting
   - Quick actions (approve, reject, send reminder)
   - Bulk operations
   - Estimated: 5-6 hours

3. ✅ **Revenue Intelligence v1**
   - File: `apps/provider-portal/src/app/provider/revenue/page.tsx`
   - MRR/ARR calculation
   - Revenue forecasting
   - Cohort analysis
   - Expansion metrics
   - Estimated: 4-5 hours

4. ✅ **Client Success Workspace** (Account 360)
   - File: `apps/provider-portal/src/app/provider/clients/[id]/page.tsx`
   - Complete tenant profile
   - Health score
   - Activity timeline
   - Usage metrics
   - Churn risk indicators
   - Estimated: 4-5 hours

**Deliverables**:
- ✅ 4 major features
- ✅ API endpoints for each
- ✅ UI pages
- ✅ Real data integration
- ✅ Analytics and reporting

**Verification**:
1. Onboard new tenant → Wizard completes → Tenant created
2. View Action Center → See pending items → Take action → Item resolved
3. View Revenue Intelligence → See MRR/ARR → Forecast accurate
4. View Client Success → See health score → Activity timeline populated

---

### **PHASE 9: Integration Testing** (8-10 hours)

**Goal**: Test provider ↔ tenant integration end-to-end

**Why Ninth**: Needs all features implemented

**Tasks**:

1. ✅ **Provider Portal Testing**
   - Login as provider
   - View all 5 test tenants
   - Check tenant health scores
   - View API usage
   - Take actions (approve disputes, etc.)
   - Generate reports

2. ✅ **Tenant App Testing**
   - Login as each test tenant
   - Create leads
   - Generate estimates (AI)
   - Create contracts
   - Schedule work orders
   - Complete work
   - Generate invoices

3. ✅ **Integration Flows**
   - Tenant creates lead → Provider sees in analytics
   - Tenant disputes lead → Provider sees in Action Center
   - Tenant uses AI → Provider sees usage/cost
   - Tenant pays invoice → Provider sees revenue
   - Tenant subscription expires → Provider sees alert

4. ✅ **E2E Test Suite**
   - Update existing E2E tests
   - Add cleaning vertical tests
   - Add provider portal tests
   - Run against deployed Vercel environments

**Deliverables**:
- ✅ Integration test scenarios documented
- ✅ E2E tests passing
- ✅ Bug fixes for any issues found
- ✅ Integration test report

**Verification**:
```bash
npm run test:e2e:vercel
# All tests passing
```

---

### **PHASE 10: Technical Debt & Polish** (10-12 hours)

**Goal**: Resolve remaining technical debt

**Why Last**: Cleanup after all features implemented

**Tasks**:

1. ✅ **Replace In-Memory Stores**
   - Wallet store → Prisma/DB
   - Feature flags → Prisma/DB
   - Rate limit store → Vercel KV
   - Idempotency store → Vercel KV
   - Nonce store → Vercel KV

2. ✅ **Error Handling Audit**
   - Add try-catch to all service functions
   - Add error boundaries to all pages
   - Add graceful degradation
   - Add retry logic where appropriate

3. ✅ **Performance Optimization**
   - Add database indexes
   - Optimize queries (N+1 issues)
   - Add caching where appropriate
   - Optimize bundle size

4. ✅ **Documentation Updates**
   - Update all README files
   - Add inline code documentation
   - Update API documentation
   - Create deployment guide
   - Create troubleshooting guide

5. ✅ **Security Audit**
   - Review all API endpoints for auth
   - Review all database queries for RLS
   - Review all user inputs for validation
   - Review all secrets for encryption

**Deliverables**:
- ✅ No in-memory stores
- ✅ Comprehensive error handling
- ✅ Optimized performance
- ✅ Complete documentation
- ✅ Security audit report

**Verification**:
```bash
npm run typecheck  # No errors
npm run lint       # No errors
npm run test       # All passing
npm run build      # Successful (verify on Vercel only)
```

---

## 📊 Success Criteria

### Technical Excellence
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ All tests passing
- ✅ All Vercel deployments successful
- ✅ All CI/CD checks green

### Feature Completeness
- ✅ 5 production-ready vertical packs
- ✅ Complete cleaning vertical (lead → invoice)
- ✅ Provider Portal fully functional
- ✅ Test data for all verticals
- ✅ Integration testing complete

### Code Quality
- ✅ Comprehensive error handling
- ✅ Proper validation (Zod)
- ✅ Audit logging
- ✅ Security best practices
- ✅ Performance optimized

### Documentation
- ✅ All features documented
- ✅ API documentation complete
- ✅ Deployment guide
- ✅ Troubleshooting guide
- ✅ Test credentials documented

---

## 🎯 Execution Strategy

### Daily Workflow
1. Start with Phase N
2. Implement all tasks in phase
3. Run verification steps
4. Commit with descriptive message
5. Push to trigger CI/CD
6. Verify Vercel deployment
7. Move to Phase N+1

### Commit Strategy
- Atomic commits per feature
- Descriptive commit messages
- Reference phase number
- Push frequently

### Testing Strategy
- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Manual testing on Vercel deployments

---

## 📁 Documentation to Create

1. ✅ `docs/TEST_CREDENTIALS.md` - Test user credentials
2. ✅ `docs/CLEANING_VERTICAL_USER_GUIDE.md` - How to use cleaning features
3. ✅ `docs/PROVIDER_PORTAL_USER_GUIDE.md` - How to use provider features
4. ✅ `docs/DEPLOYMENT_GUIDE.md` - How to deploy
5. ✅ `docs/TROUBLESHOOTING_GUIDE.md` - Common issues and solutions
6. ✅ `docs/API_DOCUMENTATION.md` - Complete API reference

---

**Status**: ✅ Plan Complete | ⏳ Ready to Execute Phase 0
**Estimated Total Time**: 80-120 hours
**Estimated Calendar Time**: 2-3 weeks (full-time)

---

**Next Step**: Begin Phase 0 - Foundation & Cleanup

