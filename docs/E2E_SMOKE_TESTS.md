# E2E Smoke Tests - Cortiware

## Overview

This document defines the minimal end-to-end smoke tests for verifying critical user flows in Cortiware applications.

## Test Environment

- **Framework**: Manual testing (Playwright/Cypress for automation in future)
- **Scope**: Critical paths only (not comprehensive)
- **Frequency**: After each deployment
- **Duration Target**: < 10 minutes total

## Tenant App Smoke Tests

### 1. Authentication Flow
**Priority**: Critical
**Duration**: 2 minutes

**Steps**:
1. Navigate to `/auth/signin`
2. Enter valid credentials (owner user)
3. Click "Sign In"
4. Verify redirect to dashboard
5. Verify user name appears in header
6. Click "Sign Out"
7. Verify redirect to signin page

**Pass Criteria**:
- ✅ Successful login with valid credentials
- ✅ Dashboard loads without errors
- ✅ User context persists across page navigation
- ✅ Logout clears session

### 2. Leads Management
**Priority**: High
**Duration**: 2 minutes

**Steps**:
1. Sign in as owner
2. Navigate to `/app/(tenant)/leads`
3. Verify leads list loads
4. Click "New Lead" button
5. Fill in lead form (company, contact, email)
6. Submit form
7. Verify new lead appears in list
8. Click on lead to view details
9. Verify lead details page loads

**Pass Criteria**:
- ✅ Leads list displays without errors
- ✅ New lead creation succeeds
- ✅ Lead details page loads correctly
- ✅ No console errors

### 3. Jobs Management
**Priority**: High
**Duration**: 2 minutes

**Steps**:
1. Sign in as owner
2. Navigate to `/app/(tenant)/jobs`
3. Verify jobs list loads
4. Click "New Job" button
5. Fill in job form (customer, service type, date)
6. Submit form
7. Verify new job appears in list
8. Click on job to view details
9. Verify job details page loads

**Pass Criteria**:
- ✅ Jobs list displays without errors
- ✅ New job creation succeeds
- ✅ Job details page loads correctly
- ✅ No console errors

### 4. Wallet & Billing
**Priority**: High
**Duration**: 1 minute

**Steps**:
1. Sign in as owner
2. Navigate to `/wallet`
3. Verify wallet balance displays
4. Verify transaction history loads
5. Check for any 402 banners (if balance is low)

**Pass Criteria**:
- ✅ Wallet page loads without errors
- ✅ Balance displays correctly
- ✅ Transaction history shows recent activity
- ✅ PaymentRequiredBanner appears if balance < $10

### 5. Settings & Theme
**Priority**: Medium
**Duration**: 1 minute

**Steps**:
1. Sign in as owner
2. Navigate to `/settings/theme`
3. Change primary color
4. Click "Save"
5. Verify theme updates immediately
6. Refresh page
7. Verify theme persists

**Pass Criteria**:
- ✅ Theme settings page loads
- ✅ Color picker works
- ✅ Theme updates apply immediately
- ✅ Theme persists after refresh

## Provider Portal Smoke Tests

### 6. Provider Authentication
**Priority**: Critical
**Duration**: 1 minute

**Steps**:
1. Navigate to provider portal
2. Sign in with provider credentials
3. Verify redirect to provider dashboard
4. Verify provider name in header
5. Sign out

**Pass Criteria**:
- ✅ Provider login succeeds
- ✅ Dashboard loads without errors
- ✅ Logout works correctly

### 7. Tenant Monitoring
**Priority**: High
**Duration**: 1 minute

**Steps**:
1. Sign in as provider
2. Navigate to tenants list
3. Verify tenant list loads
4. Click on a tenant
5. Verify tenant details page loads
6. Check usage metrics display

**Pass Criteria**:
- ✅ Tenant list displays
- ✅ Tenant details load correctly
- ✅ Usage metrics show data
- ✅ No console errors

## UI Components Smoke Tests

### 8. PaymentRequiredBanner (402)
**Priority**: High
**Duration**: 1 minute

**Steps**:
1. Sign in with account that has low balance
2. Attempt action that requires payment (e.g., route optimization)
3. Verify PaymentRequiredBanner appears
4. Verify invoice amount displays correctly
5. Click "Add Funds"
6. Verify redirect to wallet page
7. Go back and click "Dismiss"
8. Verify banner disappears

**Pass Criteria**:
- ✅ Banner appears on 402 response
- ✅ Invoice amount is correct
- ✅ "Add Funds" redirects to wallet
- ✅ "Dismiss" hides banner

### 9. RateLimitBanner (429)
**Priority**: Medium
**Duration**: 1 minute

**Steps**:
1. Make rapid API requests to trigger rate limit
2. Verify RateLimitBanner appears
3. Verify countdown timer displays
4. Wait 5 seconds
5. Verify countdown decrements
6. Click "Dismiss"
7. Verify banner disappears

**Pass Criteria**:
- ✅ Banner appears on 429 response
- ✅ Countdown timer works
- ✅ Timer decrements every second
- ✅ "Dismiss" hides banner

### 10. FeatureToggle
**Priority**: Low
**Duration**: 1 minute

**Steps**:
1. Sign in as owner
2. Navigate to dashboard
3. Verify beta features are hidden (if flags disabled)
4. Enable feature flag via API/config
5. Refresh page
6. Verify beta features appear
7. Disable feature flag
8. Refresh page
9. Verify beta features disappear

**Pass Criteria**:
- ✅ Features hidden when flag disabled
- ✅ Features appear when flag enabled
- ✅ Toggle works without errors

## Performance Smoke Tests

### 11. Page Load Performance
**Priority**: Medium
**Duration**: 1 minute

**Steps**:
1. Open browser DevTools (Network tab)
2. Navigate to dashboard
3. Measure Time to Interactive (TTI)
4. Navigate to leads page
5. Measure TTI
6. Navigate to jobs page
7. Measure TTI

**Pass Criteria**:
- ✅ Dashboard TTI < 2 seconds
- ✅ Leads page TTI < 2 seconds
- ✅ Jobs page TTI < 2 seconds
- ✅ No blocking resources > 1 second

### 12. API Response Times
**Priority**: Medium
**Duration**: 1 minute

**Steps**:
1. Open browser DevTools (Network tab)
2. Navigate to leads page
3. Measure `/api/leads` response time
4. Navigate to jobs page
5. Measure `/api/jobs` response time
6. Navigate to wallet page
7. Measure `/api/wallet/balance` response time

**Pass Criteria**:
- ✅ All API responses < 500ms
- ✅ No 500 errors
- ✅ No timeout errors

## Regression Smoke Tests

### 13. Route Count Verification
**Priority**: Critical
**Duration**: 30 seconds

**Steps**:
1. Run `npm run count-routes`
2. Verify route count ≤ 36

**Pass Criteria**:
- ✅ Route count does not exceed 36

### 14. Build Verification
**Priority**: Critical
**Duration**: 30 seconds

**Steps**:
1. Check Vercel deployment status
2. Verify both apps deployed successfully
3. Check build logs for errors

**Pass Criteria**:
- ✅ tenant-app build succeeds
- ✅ provider-portal build succeeds
- ✅ No build errors or warnings

### 15. Migration Safety
**Priority**: Critical
**Duration**: 30 seconds

**Steps**:
1. Run `npx tsx scripts/ci/verify_migrations.ts`
2. Verify no destructive migrations detected

**Pass Criteria**:
- ✅ No DROP TABLE detected
- ✅ No DROP COLUMN detected
- ✅ All migrations have override markers if needed

## Smoke Test Execution

### Pre-Deployment Checklist
- [ ] All unit tests passing (85/85)
- [ ] TypeScript typecheck passes
- [ ] ESLint passes
- [ ] Build succeeds locally (Vercel only)
- [ ] Route count ≤ 36
- [ ] Migration safety check passes

### Post-Deployment Checklist
- [ ] Vercel deployments successful
- [ ] GitHub Actions CI/CD green
- [ ] Authentication flow works (Test 1)
- [ ] Leads management works (Test 2)
- [ ] Jobs management works (Test 3)
- [ ] Wallet displays correctly (Test 4)
- [ ] Provider portal accessible (Test 6)
- [ ] No console errors on any page
- [ ] Performance metrics acceptable (Tests 11-12)

## Automated Smoke Test Script

```bash
#!/bin/bash
# scripts/smoke-test.sh

echo "🧪 Running Cortiware Smoke Tests..."

# 1. Unit tests
echo "1️⃣ Running unit tests..."
npm run test:unit || exit 1

# 2. TypeScript check
echo "2️⃣ Running typecheck..."
npm run typecheck || exit 1

# 3. Lint check
echo "3️⃣ Running lint..."
npm run lint || exit 1

# 4. Route count check
echo "4️⃣ Checking route count..."
npm run count-routes || exit 1

# 5. Migration safety check
echo "5️⃣ Checking migration safety..."
npx tsx scripts/ci/verify_migrations.ts || exit 1

echo "✅ All smoke tests passed!"
```

## Failure Response

### If Smoke Test Fails

1. **Stop deployment** - Do not proceed to production
2. **Identify root cause** - Check logs, error messages
3. **Fix issue** - Apply hotfix or rollback
4. **Re-run smoke tests** - Verify fix works
5. **Document incident** - Add to runbook

### Common Failures

| Failure | Likely Cause | Fix |
|---------|-------------|-----|
| Auth flow broken | Session/cookie issue | Check auth middleware |
| 500 errors | Database connection | Check DATABASE_URL |
| Build fails | TypeScript errors | Run typecheck locally |
| Route count exceeded | New routes added | Remove routes or increase cap |
| Migration fails | Destructive migration | Add override marker |

## Monitoring

### Post-Deployment Monitoring (First 24 Hours)

- [ ] Check error rates in logs
- [ ] Monitor API response times
- [ ] Watch for 402/429 responses
- [ ] Verify no user-reported issues
- [ ] Check Vercel analytics

## Next Steps

1. ✅ Define smoke test checklist (M5 Phase 1)
2. ⏳ Implement automated smoke tests (M5 Phase 2)
3. ⏳ Add smoke tests to CI/CD pipeline (M5 Phase 3)
4. ⏳ Create smoke test dashboard (M5 Phase 4)

