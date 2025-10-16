# E2E Testing Guide - Cortiware

## 📋 Overview

This guide covers the comprehensive end-to-end testing strategy for Cortiware, including both automated Playwright tests and manual smoke tests.

## 🎯 Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Playwright)
      /____\     - Full user flows
     /      \    - Critical paths
    /________\   - UI integration
   /          \  
  /____________\ Unit Tests
                 - Business logic
                 - API endpoints
                 - Components
```

### Coverage Goals

- **Unit Tests**: 85+ tests (✅ Complete)
- **E2E Tests**: 45+ tests (✅ Complete)
  - Tenant App: 25 tests
  - Provider Portal: 20 tests
- **Manual Smoke Tests**: 15 critical flows

## 🤖 Automated E2E Tests (Playwright)

### Test Suites

#### Tenant App (5 suites, 25 tests)

1. **Authentication** (5 tests)
   - Login with valid/invalid credentials
   - Logout
   - Session persistence
   - Protected route redirect

2. **Leads Management** (5 tests)
   - Display leads list
   - Create new lead
   - Search leads
   - View lead details
   - Navigate from dashboard

3. **Jobs Management** (4 tests)
   - Display jobs list
   - Create new job
   - View job details
   - Navigate from dashboard

4. **Wallet & Billing** (6 tests)
   - Display wallet page
   - Display balance
   - Display transaction history
   - Add funds button
   - Payment required banner

5. **UI Components** (5 tests)
   - No console errors
   - No 500 errors
   - Responsive navigation
   - User menu display
   - Smooth page transitions

#### Provider Portal (5 suites, 20 tests)

1. **Authentication** (5 tests)
   - Login with valid/invalid credentials
   - Logout
   - Session persistence
   - Protected route redirect

2. **Tenant Monitoring** (5 tests)
   - Display tenants list
   - Show tenant count
   - Search tenants
   - Navigate from dashboard
   - View tenant details

3. **Analytics & Observability** (3 tests)
   - Display analytics page
   - Load without errors
   - Display usage metrics

4. **Federation Management** (3 tests)
   - Display federation page
   - Load without errors
   - Display federation configuration

5. **UI Components** (4 tests)
   - No console errors
   - No 500 errors
   - Responsive navigation
   - Smooth page transitions

### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e:playwright

# Run tenant-app tests only
npm run test:e2e:tenant

# Run provider-portal tests only
npm run test:e2e:provider

# Run with UI mode (interactive)
npm run test:e2e:playwright:ui

# Run in headed mode (see browser)
npm run test:e2e:playwright:headed

# Debug tests
npm run test:e2e:playwright:debug

# View test report
npm run test:e2e:playwright:report
```

### Test Configuration

**Environment Variables** (`.env.test`):
```bash
# Tenant App Test Users
TEST_OWNER_EMAIL=owner@test.com
TEST_OWNER_PASSWORD=password123
TEST_MANAGER_EMAIL=manager@test.com
TEST_MANAGER_PASSWORD=password123
TEST_TECH_EMAIL=tech@test.com
TEST_TECH_PASSWORD=password123

# Provider Portal Test Users
TEST_PROVIDER_EMAIL=provider@test.com
TEST_PROVIDER_PASSWORD=password123

# Application URLs
TENANT_APP_URL=http://localhost:3000
PROVIDER_PORTAL_URL=http://localhost:3001
```

### CI/CD Integration

E2E tests run automatically on:
- ✅ Pull requests
- ✅ Pushes to main
- ✅ Nightly schedule (2 AM UTC)
- ✅ Manual workflow dispatch

**GitHub Actions Workflow**: `.github/workflows/e2e-playwright.yml`

## 🧪 Manual Smoke Tests

See `docs/E2E_SMOKE_TESTS.md` for the complete manual smoke test checklist.

### Critical Flows (15 tests)

1. **Authentication Flow** (2 min)
2. **Leads Management** (2 min)
3. **Jobs Management** (2 min)
4. **Wallet & Billing** (1 min)
5. **Settings & Theme** (1 min)
6. **Provider Authentication** (1 min)
7. **Tenant Monitoring** (1 min)
8. **PaymentRequiredBanner** (1 min)
9. **RateLimitBanner** (1 min)
10. **FeatureToggle** (1 min)
11. **Page Load Performance** (1 min)
12. **API Response Times** (1 min)
13. **Route Count Verification** (30 sec)
14. **Build Verification** (30 sec)
15. **Migration Safety** (30 sec)

**Total Duration**: < 10 minutes

## 📊 Test Execution Matrix

### Local Development

| Test Type | Command | Duration | When to Run |
|-----------|---------|----------|-------------|
| Unit Tests | `npm run test:unit` | ~10s | Before commit |
| E2E (Playwright) | `npm run test:e2e:playwright` | ~2-3 min | Before PR |
| Manual Smoke | Follow checklist | ~10 min | Before deploy |

### CI/CD Pipeline

| Stage | Tests | Duration | Trigger |
|-------|-------|----------|---------|
| Pre-merge | Unit + TypeCheck + Lint | ~30s | Every PR |
| Post-merge | Unit + E2E (Playwright) | ~3-4 min | Push to main |
| Nightly | All tests + Smoke | ~15 min | 2 AM UTC |
| Pre-deploy | All tests + Manual Smoke | ~20 min | Before production |

## 🎯 Test Coverage by Feature

### Tenant App

| Feature | Unit Tests | E2E Tests | Manual Smoke |
|---------|-----------|-----------|--------------|
| Authentication | ✅ 3 tests | ✅ 5 tests | ✅ 1 flow |
| Leads | ✅ 5 tests | ✅ 5 tests | ✅ 1 flow |
| Jobs | ✅ 4 tests | ✅ 4 tests | ✅ 1 flow |
| Customers | ✅ 3 tests | ⏳ Planned | ⏳ Planned |
| Invoices | ✅ 4 tests | ⏳ Planned | ⏳ Planned |
| Wallet | ✅ 5 tests | ✅ 6 tests | ✅ 1 flow |
| Settings | ✅ 2 tests | ⏳ Planned | ✅ 1 flow |
| UI Components | ✅ 4 tests | ✅ 5 tests | ✅ 3 flows |

### Provider Portal

| Feature | Unit Tests | E2E Tests | Manual Smoke |
|---------|-----------|-----------|--------------|
| Authentication | ✅ 3 tests | ✅ 5 tests | ✅ 1 flow |
| Tenant Monitoring | ✅ 4 tests | ✅ 5 tests | ✅ 1 flow |
| Analytics | ✅ 3 tests | ✅ 3 tests | ⏳ Planned |
| Federation | ✅ 8 tests | ✅ 3 tests | ⏳ Planned |
| Billing | ✅ 3 tests | ⏳ Planned | ⏳ Planned |
| Settings | ✅ 2 tests | ⏳ Planned | ⏳ Planned |
| UI Components | ✅ 2 tests | ✅ 4 tests | ⏳ Planned |

## 🐛 Debugging Failed Tests

### Playwright Tests

1. **View test report**:
   ```bash
   npm run test:e2e:playwright:report
   ```

2. **Run in debug mode**:
   ```bash
   npm run test:e2e:playwright:debug
   ```

3. **Run in UI mode**:
   ```bash
   npm run test:e2e:playwright:ui
   ```

4. **Check screenshots** (in `test-results/` directory)

5. **Check videos** (in `test-results/` directory)

6. **Check traces** (in `test-results/` directory)

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Tests timeout | Dev server not running | Start dev servers |
| Auth fails | Wrong credentials | Check `.env.test` |
| Element not found | Selector changed | Update page object |
| Flaky tests | Race condition | Add explicit waits |
| 500 errors | API issue | Check server logs |

## 📈 Performance Benchmarks

### Test Execution Times

| Test Suite | Tests | Duration | Target |
|------------|-------|----------|--------|
| Unit Tests | 85 | ~10s | < 15s |
| E2E Tenant App | 25 | ~1.5 min | < 2 min |
| E2E Provider Portal | 20 | ~1 min | < 1.5 min |
| **Total Automated** | **130** | **~3 min** | **< 5 min** |

### Page Load Performance

| Page | Target | Current |
|------|--------|---------|
| Dashboard | < 2s | ✅ ~1.2s |
| Leads | < 2s | ✅ ~1.5s |
| Jobs | < 2s | ✅ ~1.4s |
| Wallet | < 2s | ✅ ~1.1s |

## 🔒 Security Testing

### Automated Security Checks

- ✅ Authentication flow validation
- ✅ Protected route access control
- ✅ Session persistence
- ✅ Logout functionality
- ✅ CSRF protection (via Next.js)
- ✅ XSS prevention (via React)

### Manual Security Checks

- ⏳ SQL injection testing
- ⏳ API rate limiting
- ⏳ Role-based access control
- ⏳ Data encryption
- ⏳ Secure headers

## 📝 Writing New Tests

### 1. Identify Test Type

- **Unit Test**: Business logic, utilities, API endpoints
- **E2E Test**: User flows, UI integration, critical paths
- **Manual Smoke**: Quick verification, visual checks

### 2. Create Test File

```typescript
// tests/e2e-playwright/tenant-app/06-new-feature.spec.ts
import { test, expect } from '../fixtures/auth';
import { NewFeaturePage } from '../page-objects/NewFeaturePage';

test.describe('Tenant App - New Feature', () => {
  test('should do something', async ({ authenticatedPage }) => {
    const page = new NewFeaturePage(authenticatedPage);
    await page.goto();
    // ... test logic
  });
});
```

### 3. Create Page Object (if needed)

```typescript
// tests/e2e-playwright/page-objects/NewFeaturePage.ts
import { Page, Locator } from '@playwright/test';

export class NewFeaturePage {
  readonly page: Page;
  readonly someButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someButton = page.locator('[data-testid="some-button"]');
  }

  async goto() {
    await this.page.goto('/new-feature');
  }
}
```

## 🎯 Best Practices

### Test Design

1. ✅ **Test user flows, not implementation**
2. ✅ **Use Page Object pattern**
3. ✅ **Use authentication fixtures**
4. ✅ **Prefer data-testid selectors**
5. ✅ **Wait for navigation explicitly**
6. ✅ **Check for console errors**
7. ✅ **Test isolation (no shared state)**
8. ✅ **Descriptive test names**

### Performance

1. ✅ **Run tests in parallel**
2. ✅ **Reuse browser contexts**
3. ✅ **Use efficient selectors**
4. ✅ **Minimize waits**
5. ✅ **Cache dependencies**

### Maintenance

1. ✅ **Keep page objects up to date**
2. ✅ **Review flaky tests**
3. ✅ **Update test data regularly**
4. ✅ **Document test scenarios**
5. ✅ **Monitor test execution times**

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [E2E Smoke Tests Checklist](./E2E_SMOKE_TESTS.md)
- [Playwright Test README](../tests/e2e-playwright/README.md)
- [CI/CD Workflow](./.github/workflows/e2e-playwright.yml)

## 🆘 Support

For issues or questions:
1. Check this guide
2. Review Playwright documentation
3. Check test logs and screenshots
4. Ask in team chat

