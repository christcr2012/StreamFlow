# Portal Restructuring Audit & Plan

**Date:** 2025-10-16  
**Goal:** Properly structure the three-persona model (Provider Admin, Provider Analyst, Developer)  
**Current State:** Incomplete role-based access control, unclear route ownership

---

## 🔍 CURRENT STATE ANALYSIS

### Existing Route Structure

**Provider Routes (`/provider/*`):**
```
/provider/dashboard          # Mixed: Admin + Analyst
/provider/analytics          # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/audit              # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/billing            # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/incidents          # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/federation         # ADMIN ONLY (write operations)
/provider/monetization       # ADMIN ONLY (write operations)
/provider/branding           # ADMIN ONLY (write operations)
/provider/provisioning       # ADMIN ONLY (write operations)
/provider/settings           # ADMIN ONLY (write operations)
/provider/security           # ADMIN ONLY (write operations)
/provider/rbac               # ADMIN ONLY (write operations)
/provider/leads              # ADMIN ONLY (write operations)
/provider/clients            # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/subscriptions      # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/invoices           # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/usage              # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/metrics            # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/tenant-health      # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/revenue-intelligence # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/compliance         # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/observability      # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/api-usage          # Mixed: Admin + Analyst (READ-ONLY for analyst)
/provider/action-center      # ADMIN ONLY
/provider/addons             # ADMIN ONLY
/provider/ai                 # ADMIN ONLY
/provider/dev-aids           # ADMIN ONLY
/provider/sam-gov            # ADMIN ONLY
```

**Developer Routes (`/developer/*`):**
```
/developer/dashboard         # EXISTS (basic)
/developer/api-explorer      # EXISTS (basic)
/developer/keys              # EXISTS (basic)
/developer/usage             # EXISTS (basic)
/developer/webhooks          # EXISTS (basic)
```

### Current Middleware Protection

**Strengths:**
- ✅ Authentication required for all `/provider/*` routes
- ✅ Write operations blocked for non-admin on `/provider/federation`, `/provider/monetization`, `/provider/billing`
- ✅ API routes have basic auth checks

**Weaknesses:**
- ❌ Most `/provider/*` routes allow provider_analyst to access pages with write controls visible
- ❌ No comprehensive write-operation blocking across all admin-only routes
- ❌ Navigation shows all links regardless of role
- ❌ Login doesn't redirect based on role
- ❌ No clear separation between admin-only and analyst-accessible features
- ❌ Developer routes exist but are minimal

### Current Navigation

**AppNav.tsx Issues:**
- Uses tenant-app navigation logic (OWNER, PROVIDER, STAFF roles)
- Not designed for provider-portal personas
- Shows same links to all users
- No role-based filtering

---

## 🎯 RECOMMENDED APPROACH: **OPTION C - HYBRID MODEL**

After analyzing the codebase, I recommend a **hybrid approach** that combines the best of both options:

### Route Structure

```
/admin/*              # Provider Admin Portal (rename from /provider/*)
├── /dashboard        # Admin overview with write capabilities
├── /federation       # Federation management (WRITE)
├── /monetization     # Pricing, plans, coupons (WRITE)
├── /billing          # Billing configuration (WRITE)
├── /branding         # Branding settings (WRITE)
├── /provisioning     # Tenant provisioning (WRITE)
├── /settings         # Provider settings (WRITE)
├── /security         # Security configuration (WRITE)
├── /rbac             # Role management (WRITE)
├── /leads            # Lead management (WRITE)
├── /action-center    # Admin actions (WRITE)
├── /addons           # Addon management (WRITE)
├── /ai               # AI configuration (WRITE)
└── /sam-gov          # SAM.gov integration (WRITE)

/analyst/*            # Provider Analyst Portal (NEW)
├── /dashboard        # Analytics overview (READ-ONLY)
├── /analytics        # Usage, revenue, tenant metrics (READ-ONLY)
├── /audit            # Audit logs and compliance (READ-ONLY + EXPORT)
├── /incidents        # Incident monitoring (READ-ONLY)
├── /billing          # Billing reports (READ-ONLY)
├── /clients          # Client analytics (READ-ONLY)
├── /subscriptions    # Subscription analytics (READ-ONLY)
├── /usage            # Usage analytics (READ-ONLY)
├── /metrics          # System metrics (READ-ONLY)
├── /tenant-health    # Tenant health scores (READ-ONLY)
├── /revenue          # Revenue intelligence (READ-ONLY)
├── /compliance       # Compliance status (READ-ONLY)
└── /observability    # Observability dashboards (READ-ONLY)

/developer/*          # Developer Portal (ENHANCE EXISTING)
├── /dashboard        # Developer overview
├── /api-explorer     # Interactive API docs
├── /webhooks         # Webhook management
├── /keys             # API key management
├── /usage            # API usage dashboards
├── /monitoring       # IT system monitoring (NEW)
├── /ai-assistant     # AI Developer Assistant (NEW)
└── /docs             # Developer documentation (NEW)
```

### Why Option C (Hybrid)?

**Advantages:**
1. **Clear Separation:** Each persona has their own portal with distinct URL namespace
2. **No Ambiguity:** `/admin/*` clearly indicates admin-only features
3. **Analyst Independence:** Analyst portal is self-contained with read-only versions of shared features
4. **Developer Focus:** Developer portal remains separate and focused on API/infrastructure tools
5. **Migration Path:** Can gradually migrate from `/provider/*` to `/admin/*` with redirects
6. **Permission Clarity:** URL structure matches permission model exactly

**Migration Strategy:**
1. Create `/admin/*` routes (copy from `/provider/*`)
2. Create `/analyst/*` routes (new, read-only versions)
3. Add redirects from `/provider/*` to `/admin/*`
4. Update all internal links
5. Eventually deprecate `/provider/*` routes

---

## 📋 DETAILED ROUTE MAPPING

### Admin-Only Routes (Provider Admin)

**Configuration & Management:**
- `/admin/federation` - Federation keys, OIDC, provider integrations
- `/admin/monetization` - Plans, prices, coupons, overrides
- `/admin/billing` - Billing configuration, payment methods
- `/admin/branding` - Logo, colors, custom domains
- `/admin/provisioning` - Tenant provisioning, onboarding
- `/admin/settings` - Provider settings, API keys, webhooks
- `/admin/security` - MFA, secrets rotation, IP whitelist
- `/admin/rbac` - Role management, permissions
- `/admin/leads` - Lead management, scoring, assignment
- `/admin/action-center` - Quick actions, bulk operations
- `/admin/addons` - Addon management
- `/admin/ai` - AI configuration, cost tracking
- `/admin/sam-gov` - SAM.gov integration settings

### Analyst-Accessible Routes (Provider Analyst - READ-ONLY)

**Analytics & Reporting:**
- `/analyst/dashboard` - Key metrics, trends, alerts
- `/analyst/analytics` - Usage, revenue, tenant analytics
- `/analyst/audit` - Audit logs, compliance tracking (+ EXPORT)
- `/analyst/incidents` - Incident monitoring, SLA tracking
- `/analyst/billing` - Billing reports, revenue summaries
- `/analyst/clients` - Client analytics, health scores
- `/analyst/subscriptions` - Subscription analytics, churn
- `/analyst/usage` - Usage analytics, API calls
- `/analyst/metrics` - System metrics, performance
- `/analyst/tenant-health` - Tenant health dashboards
- `/analyst/revenue` - Revenue intelligence, forecasting
- `/analyst/compliance` - Compliance status, frameworks
- `/analyst/observability` - Observability dashboards

### Developer Routes (Developer)

**API & Infrastructure Tools:**
- `/developer/dashboard` - Developer overview, quick links
- `/developer/api-explorer` - Interactive API documentation
- `/developer/webhooks` - Webhook endpoint management
- `/developer/keys` - API key creation, rotation
- `/developer/usage` - API usage metrics, quotas
- `/developer/monitoring` - Infrastructure monitoring (NEW)
- `/developer/ai-assistant` - AI-powered dev assistant (NEW)
- `/developer/docs` - Developer guides, examples (NEW)

---

## 🔒 PERMISSION ENFORCEMENT STRATEGY

### Middleware Updates

**1. Route-Level Protection:**
```typescript
// /admin/* - Require provider_admin role
if (pathname.startsWith('/admin')) {
  if (session.role !== 'provider_admin') {
    return NextResponse.redirect(new URL('/analyst/dashboard', request.url));
  }
}

// /analyst/* - Allow provider_admin and provider_analyst
if (pathname.startsWith('/analyst')) {
  if (session.role !== 'provider_admin' && session.role !== 'provider_analyst') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Block ALL write operations for analyst
  if (session.role === 'provider_analyst' && isWriteOperation(request)) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 });
  }
}

// /developer/* - Require developer role
if (pathname.startsWith('/developer')) {
  if (!getDeveloperSession(request)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

**2. API Route Protection:**
```typescript
// /api/admin/* - Admin only
// /api/analyst/* - Admin + Analyst (read-only)
// /api/developer/* - Developer only
```

### Login Flow Updates

```typescript
// After successful authentication
if (role === 'provider_admin') {
  redirect('/admin/dashboard');
} else if (role === 'provider_analyst') {
  redirect('/analyst/dashboard');
} else if (role === 'developer') {
  redirect('/developer/dashboard');
}
```

---

## 🎨 NAVIGATION COMPONENTS

### Create Role-Specific Navigation

**1. AdminNav.tsx** - Full navigation for provider_admin
**2. AnalystNav.tsx** - Read-only navigation for provider_analyst
**3. DeveloperNav.tsx** - Developer-focused navigation

**4. Update AppNav.tsx:**
```typescript
export default function AppNav() {
  const { session } = useProviderSession();
  
  if (session?.role === 'provider_admin') {
    return <AdminNav />;
  } else if (session?.role === 'provider_analyst') {
    return <AnalystNav />;
  } else if (session?.role === 'developer') {
    return <DeveloperNav />;
  }
  
  return null;
}
```

---

## 📊 SHARED VS. DUPLICATE FEATURES

### Shared Features (Same Component, Different Permissions)

**Analytics Dashboards:**
- Admin sees: Full analytics + write controls (export, configure)
- Analyst sees: Same analytics + export only (no configuration)
- **Implementation:** Same component, conditionally render controls based on role

**Audit Logs:**
- Admin sees: Full audit logs + retention configuration
- Analyst sees: Same audit logs + export only
- **Implementation:** Same component, hide configuration UI for analyst

**Billing Reports:**
- Admin sees: Billing reports + payment configuration
- Analyst sees: Same reports + export only
- **Implementation:** Same component, hide payment controls for analyst

### Duplicate Features (Separate Components)

**Dashboard:**
- Admin dashboard: Action-oriented, write controls, quick actions
- Analyst dashboard: Metrics-focused, read-only, export-focused
- **Implementation:** Separate components optimized for each role

**Incidents:**
- Admin: Create, update, resolve incidents
- Analyst: View incidents, export data
- **Implementation:** Separate components (admin has forms, analyst has tables)

---

## ✅ SUCCESS CRITERIA

- [ ] All three portals have distinct URL namespaces
- [ ] Middleware enforces role-based access for all routes
- [ ] Login redirects to correct portal based on role
- [ ] Navigation shows only authorized links for each role
- [ ] Write operations blocked for provider_analyst across all routes
- [ ] Developer portal is completely separate from provider portals
- [ ] No permission leaks or unauthorized access
- [ ] Clear documentation of route ownership
- [ ] Migration path from `/provider/*` to `/admin/*` defined

---

**Recommendation:** Proceed with **Option C (Hybrid Model)**
**Next Steps:** See PORTAL_RESTRUCTURING_IMPLEMENTATION_PLAN.md

---

## 🚨 CRITICAL FINDINGS

### Permission Gaps Identified

1. **No Write-Operation Blocking on Most Routes:**
   - Routes like `/provider/leads`, `/provider/clients`, `/provider/action-center` have NO middleware protection
   - provider_analyst can currently access these pages and see write controls
   - **Risk:** High - Analyst could potentially perform write operations

2. **Navigation Shows All Links:**
   - AppNav.tsx uses tenant-app logic, not provider-portal personas
   - All users see all navigation links regardless of role
   - **Risk:** Medium - Confusing UX, users see links they can't access

3. **No Role-Based Login Redirects:**
   - All users redirect to same location after login
   - No automatic routing to appropriate portal
   - **Risk:** Low - UX issue, not security issue

4. **API Routes Partially Protected:**
   - `/api/federation` and `/api/monetization` have write-operation checks
   - Other API routes under `/api/provider` may lack role checks
   - **Risk:** High - Potential unauthorized API access

5. **Developer Portal Incomplete:**
   - Basic routes exist but minimal functionality
   - No AI assistant integration
   - No infrastructure monitoring
   - **Risk:** Low - Feature gap, not security issue

### Immediate Actions Required

**Before Building New Portals:**
1. ✅ Audit complete - documented in this file
2. ⏳ Update middleware to block ALL write operations for provider_analyst
3. ⏳ Create role-specific navigation components
4. ⏳ Update login flow with role-based redirects
5. ⏳ Audit ALL API routes for proper role checks
6. ⏳ Create `/admin/*` routes (migrate from `/provider/*`)
7. ⏳ Build `/analyst/*` portal with read-only features
8. ⏳ Enhance `/developer/*` portal with new features

**Priority Order:**
1. **CRITICAL:** Fix middleware to block write operations (security)
2. **HIGH:** Create role-specific navigation (UX + security)
3. **HIGH:** Update login redirects (UX)
4. **MEDIUM:** Audit and fix API routes (security)
5. **MEDIUM:** Create `/admin/*` routes (migration)
6. **MEDIUM:** Build `/analyst/*` portal (feature)
7. **LOW:** Enhance `/developer/*` portal (feature)

