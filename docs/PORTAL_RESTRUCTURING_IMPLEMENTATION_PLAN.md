# Portal Restructuring Implementation Plan

**Date:** 2025-10-16  
**Based On:** PORTAL_RESTRUCTURING_AUDIT_2025-10-16.md  
**Approach:** Option C - Hybrid Model with `/admin/*`, `/analyst/*`, `/developer/*`

---

## 🎯 IMPLEMENTATION PHASES

### PHASE 1: CRITICAL SECURITY FIXES (2 hours)

**Goal:** Fix immediate permission gaps and security issues

#### 1.1 Update Middleware - Comprehensive Write-Operation Blocking

**File:** `apps/provider-portal/src/middleware.ts`

**Changes:**
```typescript
// Add comprehensive write-operation blocking for ALL provider routes
if (pathname.startsWith('/provider')) {
  const session = getProviderSession(request);
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Block ALL write operations for provider_analyst
  if (session.role === 'provider_analyst' && isWriteOperation(request)) {
    return NextResponse.json(
      { error: 'Forbidden: Read-only access' },
      { status: 403 }
    );
  }
  
  // Admin-only routes (block analyst from accessing pages)
  const adminOnlyRoutes = [
    '/provider/federation',
    '/provider/monetization',
    '/provider/branding',
    '/provider/provisioning',
    '/provider/settings',
    '/provider/security',
    '/provider/rbac',
    '/provider/leads',
    '/provider/action-center',
    '/provider/addons',
    '/provider/ai',
    '/provider/sam-gov',
  ];
  
  if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
    if (session.role !== 'provider_admin') {
      return NextResponse.redirect(new URL('/provider/analytics', request.url));
    }
  }
}
```

#### 1.2 Audit API Routes

**Files to Check:**
- `apps/provider-portal/src/app/api/provider/**/*.ts`
- `apps/provider-portal/src/app/api/analytics/**/*.ts`
- `apps/provider-portal/src/app/api/audit/**/*.ts`
- `apps/provider-portal/src/app/api/billing/**/*.ts`
- `apps/provider-portal/src/app/api/incidents/**/*.ts`

**Required Changes:**
- Ensure ALL API routes use `withProviderAuth()` wrapper
- Add role checks for write operations
- Block provider_analyst from POST/PUT/PATCH/DELETE on all routes

#### 1.3 Test Security Fixes

**Test Cases:**
1. provider_analyst cannot POST to any `/api/provider/*` endpoint
2. provider_analyst cannot access admin-only pages
3. provider_analyst can access analytics/audit/billing pages (read-only)
4. provider_admin can access everything

---

### PHASE 2: NAVIGATION & LOGIN FLOW (2 hours)

**Goal:** Create role-specific navigation and proper login redirects

#### 2.1 Create AdminNav Component

**File:** `apps/provider-portal/src/components/AdminNav.tsx`

**Features:**
- Full navigation for provider_admin
- Links to all admin features
- Write-action buttons visible
- Quick actions menu

#### 2.2 Create AnalystNav Component

**File:** `apps/provider-portal/src/components/AnalystNav.tsx`

**Features:**
- Read-only navigation for provider_analyst
- Links to analytics, audit, billing reports
- Export buttons visible
- No write-action buttons

#### 2.3 Create DeveloperNav Component

**File:** `apps/provider-portal/src/components/DeveloperNav.tsx`

**Features:**
- Developer-focused navigation
- Links to API explorer, webhooks, keys, usage
- Developer tools menu

#### 2.4 Update AppNav to Use Role-Specific Navigation

**File:** `apps/provider-portal/src/components/AppNav.tsx`

**Changes:**
```typescript
import { AdminNav } from './AdminNav';
import { AnalystNav } from './AnalystNav';
import { DeveloperNav } from './DeveloperNav';
import { useProviderSession } from '@/lib/hooks/useProviderSession';

export default function AppNav() {
  const { session } = useProviderSession();
  
  if (!session) return null;
  
  if (session.role === 'provider_admin') {
    return <AdminNav />;
  } else if (session.role === 'provider_analyst') {
    return <AnalystNav />;
  } else if (session.role === 'developer') {
    return <DeveloperNav />;
  }
  
  return null;
}
```

#### 2.5 Update Login Flow

**File:** `apps/provider-portal/src/app/api/auth/login/route.ts`

**Changes:**
```typescript
// After successful authentication
if (role === 'provider_admin') {
  return NextResponse.redirect(new URL('/provider/dashboard', request.url));
} else if (role === 'provider_analyst') {
  return NextResponse.redirect(new URL('/provider/analytics', request.url));
} else if (role === 'developer') {
  return NextResponse.redirect(new URL('/developer/dashboard', request.url));
}
```

---

### PHASE 3: CREATE /ADMIN/* ROUTES (4 hours)

**Goal:** Migrate `/provider/*` to `/admin/*` with proper naming

#### 3.1 Create Admin Route Group

**Directory:** `apps/provider-portal/src/app/(admin)/admin/`

**Structure:**
```
(admin)/
├── layout.tsx           # Admin layout with AdminNav
└── admin/
    ├── dashboard/
    ├── federation/
    ├── monetization/
    ├── billing/
    ├── branding/
    ├── provisioning/
    ├── settings/
    ├── security/
    ├── rbac/
    ├── leads/
    ├── action-center/
    ├── addons/
    ├── ai/
    └── sam-gov/
```

#### 3.2 Copy Components from /provider/*

**Strategy:**
- Copy existing page components from `/provider/*`
- Update imports and paths
- Keep functionality identical
- Add admin-specific features if needed

#### 3.3 Add Redirects from /provider/* to /admin/*

**File:** `apps/provider-portal/src/middleware.ts`

**Changes:**
```typescript
// Redirect /provider/* to /admin/* for provider_admin
if (pathname.startsWith('/provider') && session.role === 'provider_admin') {
  const newPath = pathname.replace('/provider', '/admin');
  return NextResponse.redirect(new URL(newPath, request.url));
}
```

---

### PHASE 4: BUILD /ANALYST/* PORTAL (6 hours)

**Goal:** Create read-only analyst portal with analytics and reporting features

#### 4.1 Create Analyst Route Group

**Directory:** `apps/provider-portal/src/app/(analyst)/analyst/`

**Structure:**
```
(analyst)/
├── layout.tsx           # Analyst layout with AnalystNav
└── analyst/
    ├── dashboard/       # Analytics overview
    ├── analytics/       # Usage, revenue, tenant metrics
    ├── audit/           # Audit logs + export
    ├── incidents/       # Incident monitoring
    ├── billing/         # Billing reports
    ├── clients/         # Client analytics
    ├── subscriptions/   # Subscription analytics
    ├── usage/           # Usage analytics
    ├── metrics/         # System metrics
    ├── tenant-health/   # Tenant health
    ├── revenue/         # Revenue intelligence
    ├── compliance/      # Compliance status
    └── observability/   # Observability dashboards
```

#### 4.2 Create Analyst Dashboard

**File:** `apps/provider-portal/src/app/(analyst)/analyst/dashboard/page.tsx`

**Features:**
- Key metrics cards (MRR, active tenants, API usage)
- Revenue trend charts
- Tenant activity heatmap
- Recent audit events
- Active incidents summary
- Export all data button

#### 4.3 Create Analytics Pages

**Files:**
- `analyst/analytics/usage/page.tsx` - API usage, feature adoption
- `analyst/analytics/revenue/page.tsx` - MRR, ARR, churn
- `analyst/analytics/tenants/page.tsx` - Health scores, retention

**Features:**
- Read-only charts and tables
- Date range filters
- Export to CSV/JSON
- No write controls

#### 4.4 Create Audit Log Viewer

**File:** `analyst/audit/page.tsx`

**Features:**
- Searchable audit log table
- Filters: user, action, entity, date range
- Compliance framework status
- Export audit data (CSV, JSON)
- No configuration controls

#### 4.5 Create Billing Reports

**File:** `analyst/billing/page.tsx`

**Features:**
- Revenue reports by period
- Subscription analytics
- Invoice tracking
- Payment success rates
- Export capabilities
- No payment configuration

#### 4.6 Create API Endpoints

**Directory:** `apps/provider-portal/src/app/api/analyst/`

**Endpoints:**
- `GET /api/analyst/metrics` - Dashboard metrics
- `GET /api/analyst/analytics/usage` - Usage analytics
- `GET /api/analyst/analytics/revenue` - Revenue analytics
- `GET /api/analyst/analytics/tenants` - Tenant analytics
- `GET /api/analyst/audit/logs` - Audit logs with filters
- `GET /api/analyst/audit/export` - Export audit data
- `GET /api/analyst/incidents` - Incidents list
- `GET /api/analyst/billing/reports` - Billing reports

**All endpoints:**
- Use `withProviderAuth()` with analyst permission
- Read-only (GET only)
- Support export formats

---

### PHASE 5: ENHANCE /DEVELOPER/* PORTAL (8 hours)

**Goal:** Complete developer portal with API tools, monitoring, and AI assistant

#### 5.1 Enhance Existing Developer Routes

**Files to Update:**
- `developer/dashboard/page.tsx` - Add metrics, quick links
- `developer/api-explorer/page.tsx` - Interactive API docs
- `developer/webhooks/page.tsx` - Full CRUD for webhooks
- `developer/keys/page.tsx` - Full CRUD for API keys
- `developer/usage/page.tsx` - Comprehensive usage dashboards

#### 5.2 Create Monitoring Dashboard

**File:** `developer/monitoring/page.tsx`

**Features:**
- Infrastructure metrics (CPU, memory, disk, network)
- Service health and uptime
- Database performance
- API endpoint latency
- Error rates and alerts

#### 5.3 Create AI Developer Assistant

**File:** `developer/ai-assistant/page.tsx`

**Features:**
- Interactive chat interface
- Code snippet generation
- API integration help
- Debugging assistance
- Webhook handler generation

#### 5.4 Create Developer Documentation

**File:** `developer/docs/page.tsx`

**Features:**
- Integration guides
- API reference
- Code examples
- Best practices
- Troubleshooting

#### 5.5 Create Developer API Endpoints

**Directory:** `apps/provider-portal/src/app/api/developer/`

**Endpoints:**
- `GET /api/developer/api-explorer/endpoints` - List endpoints
- `POST /api/developer/api-explorer/test` - Test API call
- `GET /api/developer/webhooks` - List webhooks
- `POST /api/developer/webhooks` - Create webhook
- `PATCH /api/developer/webhooks/:id` - Update webhook
- `DELETE /api/developer/webhooks/:id` - Delete webhook
- `GET /api/developer/keys` - List API keys
- `POST /api/developer/keys` - Create API key
- `DELETE /api/developer/keys/:id` - Delete API key
- `GET /api/developer/usage/metrics` - Usage metrics
- `GET /api/developer/monitoring/infrastructure` - Infrastructure metrics
- `POST /api/developer/ai-assistant/chat` - AI chat
- `POST /api/developer/ai-assistant/generate` - Code generation

---

## 📊 PROGRESS TRACKING

### Phase 1: Critical Security Fixes
- [ ] Update middleware with comprehensive write-operation blocking
- [ ] Audit all API routes for proper role checks
- [ ] Test security fixes with all three roles

### Phase 2: Navigation & Login Flow
- [ ] Create AdminNav component
- [ ] Create AnalystNav component
- [ ] Create DeveloperNav component
- [ ] Update AppNav to use role-specific navigation
- [ ] Update login flow with role-based redirects

### Phase 3: Create /admin/* Routes
- [ ] Create admin route group structure
- [ ] Copy components from /provider/*
- [ ] Add redirects from /provider/* to /admin/*
- [ ] Test all admin routes

### Phase 4: Build /analyst/* Portal
- [ ] Create analyst route group structure
- [ ] Create analyst dashboard
- [ ] Create analytics pages
- [ ] Create audit log viewer
- [ ] Create billing reports
- [ ] Create API endpoints
- [ ] Test all analyst routes

### Phase 5: Enhance /developer/* Portal
- [ ] Enhance existing developer routes
- [ ] Create monitoring dashboard
- [ ] Create AI developer assistant
- [ ] Create developer documentation
- [ ] Create developer API endpoints
- [ ] Test all developer routes

---

## ✅ SUCCESS CRITERIA

- [ ] All three portals have distinct URL namespaces
- [ ] Middleware enforces role-based access for all routes
- [ ] Login redirects to correct portal based on role
- [ ] Navigation shows only authorized links for each role
- [ ] Write operations blocked for provider_analyst across all routes
- [ ] Developer portal has full API tools and monitoring
- [ ] AI assistant integrated in developer portal
- [ ] Zero permission leaks or unauthorized access
- [ ] TypeScript checks passing (0 errors)
- [ ] All builds successful on Vercel
- [ ] Comprehensive documentation complete

---

**Estimated Total Time:** 22 hours  
**Priority:** Start with Phase 1 (Critical Security Fixes)  
**Approach:** Incremental, production-grade implementation

