# Cortiware E2E Tests (Playwright)

Comprehensive end-to-end tests for both Tenant App and Provider Portal using Playwright.

## 📋 Overview

This test suite provides full E2E coverage for:
- **Tenant App**: Authentication, Leads, Jobs, Wallet, UI Components
- **Provider Portal**: Authentication, Tenant Monitoring, Analytics, Federation, UI Components

## 🚀 Quick Start

### Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Set up test environment**:
   ```bash
   cp .env.test.example .env.test
   # Edit .env.test with your test credentials
   ```

4. **Start development servers** (in separate terminals):
   ```bash
   # Terminal 1: Tenant App
   cd apps/tenant-app && npm run dev

   # Terminal 2: Provider Portal
   cd apps/provider-portal && npm run dev
   ```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e:playwright

# Run only tenant-app tests
npm run test:e2e:tenant

# Run only provider-portal tests
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

## 📁 Test Structure

```
tests/e2e-playwright/
├── fixtures/
│   └── auth.ts                    # Authentication fixtures
├── page-objects/
│   ├── LoginPage.ts               # Login page object
│   ├── DashboardPage.ts           # Dashboard page object
│   ├── LeadsPage.ts               # Leads page object
│   ├── JobsPage.ts                # Jobs page object
│   ├── WalletPage.ts              # Wallet page object
│   ├── ProviderDashboardPage.ts   # Provider dashboard page object
│   └── TenantsPage.ts             # Tenants page object
├── tenant-app/
│   ├── 01-authentication.spec.ts  # Auth flow tests
│   ├── 02-leads-management.spec.ts # Leads CRUD tests
│   ├── 03-jobs-management.spec.ts  # Jobs CRUD tests
│   ├── 04-wallet.spec.ts          # Wallet & billing tests
│   └── 05-ui-components.spec.ts   # UI component tests
└── provider-portal/
    ├── 01-authentication.spec.ts  # Provider auth tests
    ├── 02-tenant-monitoring.spec.ts # Tenant monitoring tests
    ├── 03-analytics.spec.ts       # Analytics tests
    ├── 04-federation.spec.ts      # Federation tests
    └── 05-ui-components.spec.ts   # UI component tests
```

## 🧪 Test Coverage

### Tenant App Tests (5 suites, ~25 tests)

#### 1. Authentication (`01-authentication.spec.ts`)
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Logout
- ✅ Session persistence
- ✅ Protected route redirect

#### 2. Leads Management (`02-leads-management.spec.ts`)
- ✅ Display leads list
- ✅ Create new lead
- ✅ Search leads
- ✅ View lead details
- ✅ Navigate from dashboard

#### 3. Jobs Management (`03-jobs-management.spec.ts`)
- ✅ Display jobs list
- ✅ Create new job
- ✅ View job details
- ✅ Navigate from dashboard

#### 4. Wallet & Billing (`04-wallet.spec.ts`)
- ✅ Display wallet page
- ✅ Display balance
- ✅ Display transaction history
- ✅ Add funds button
- ✅ Payment required banner (conditional)

#### 5. UI Components (`05-ui-components.spec.ts`)
- ✅ No console errors
- ✅ No 500 errors on any page
- ✅ Responsive navigation
- ✅ User menu display
- ✅ Smooth page transitions

### Provider Portal Tests (5 suites, ~20 tests)

#### 1. Authentication (`01-authentication.spec.ts`)
- ✅ Login with valid provider credentials
- ✅ Login with invalid credentials
- ✅ Logout
- ✅ Session persistence
- ✅ Protected route redirect

#### 2. Tenant Monitoring (`02-tenant-monitoring.spec.ts`)
- ✅ Display tenants list
- ✅ Show tenant count
- ✅ Search tenants
- ✅ Navigate from dashboard
- ✅ View tenant details

#### 3. Analytics & Observability (`03-analytics.spec.ts`)
- ✅ Display analytics page
- ✅ Load without errors
- ✅ Display usage metrics

#### 4. Federation Management (`04-federation.spec.ts`)
- ✅ Display federation page
- ✅ Load without errors
- ✅ Display federation configuration

#### 5. UI Components (`05-ui-components.spec.ts`)
- ✅ No console errors
- ✅ No 500 errors on any page
- ✅ Responsive navigation
- ✅ Smooth page transitions
- ✅ Provider branding

## 🎯 Test Patterns

### Page Object Pattern

All tests use the Page Object pattern for maintainability:

```typescript
import { LoginPage } from '../page-objects/LoginPage';

test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAndWait('user@test.com', 'password');
});
```

### Authentication Fixtures

Tests requiring authentication use fixtures:

```typescript
import { test, expect } from '../fixtures/auth';

test('should access protected page', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto('/protected-route');
});
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

- **Browsers**: Chromium, Firefox, Mobile Safari
- **Retries**: 2 retries in CI, 0 locally
- **Parallel**: Full parallelization
- **Reporters**: HTML, List, JSON
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

### Environment Variables

Set in `.env.test`:

- `TEST_OWNER_EMAIL` - Tenant owner email
- `TEST_OWNER_PASSWORD` - Tenant owner password
- `TEST_MANAGER_EMAIL` - Tenant manager email
- `TEST_MANAGER_PASSWORD` - Tenant manager password
- `TEST_TECH_EMAIL` - Tenant technician email
- `TEST_TECH_PASSWORD` - Tenant technician password
- `TEST_PROVIDER_EMAIL` - Provider email
- `TEST_PROVIDER_PASSWORD` - Provider password
- `TENANT_APP_URL` - Tenant app URL (default: http://localhost:3000)
- `PROVIDER_PORTAL_URL` - Provider portal URL (default: http://localhost:3001)

## 📊 CI/CD Integration

### GitHub Actions

E2E tests run automatically on:
- Pull requests
- Pushes to main
- Nightly schedule

See `.github/workflows/e2e-playwright.yml` for configuration.

### Running in CI

```bash
# Set environment variables
export TENANT_APP_URL=https://tenant-app-staging.vercel.app
export PROVIDER_PORTAL_URL=https://provider-portal-staging.vercel.app

# Run tests
npm run test:e2e:playwright
```

## 🐛 Debugging

### Debug Mode

```bash
# Run with Playwright Inspector
npm run test:e2e:playwright:debug
```

### UI Mode

```bash
# Interactive test runner
npm run test:e2e:playwright:ui
```

### Headed Mode

```bash
# See browser while tests run
npm run test:e2e:playwright:headed
```

### View Test Report

```bash
# Open HTML report
npm run test:e2e:playwright:report
```

## 📝 Writing New Tests

### 1. Create Test File

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

### 2. Create Page Object (if needed)

```typescript
// tests/e2e-playwright/page-objects/NewFeaturePage.ts
import { Page, Locator } from '@playwright/test';

export class NewFeaturePage {
  readonly page: Page;
  readonly someButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someButton = page.locator('button[data-testid="some-button"]');
  }

  async goto() {
    await this.page.goto('/new-feature');
  }

  async clickButton() {
    await this.someButton.click();
  }
}
```

## 🎯 Best Practices

1. **Use Page Objects**: Encapsulate page logic in page objects
2. **Use Fixtures**: Leverage authentication fixtures for authenticated tests
3. **Use Data Attributes**: Prefer `data-testid` selectors over text/CSS
4. **Wait for Navigation**: Always wait for URL changes after navigation
5. **Check Console Errors**: Monitor console for errors in critical flows
6. **Test Isolation**: Each test should be independent
7. **Descriptive Names**: Use clear, descriptive test names
8. **Assertions**: Use meaningful assertions with good error messages

## 📈 Performance

- **Parallel Execution**: Tests run in parallel for speed
- **Browser Reuse**: Browsers are reused across tests
- **Smart Waiting**: Playwright auto-waits for elements
- **Fast Selectors**: Use efficient selectors (data-testid, role)

## 🔒 Security

- **No Hardcoded Credentials**: Use environment variables
- **Test Isolation**: Tests don't share state
- **Clean Up**: Tests clean up after themselves
- **Separate Test DB**: Use separate database for tests

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

## 🆘 Troubleshooting

### Tests Failing Locally

1. Ensure dev servers are running
2. Check `.env.test` configuration
3. Verify test user accounts exist
4. Clear browser cache: `npx playwright clean`

### Tests Passing Locally but Failing in CI

1. Check environment variables in CI
2. Verify deployment URLs are accessible
3. Check for timing issues (add waits if needed)
4. Review CI logs and screenshots

### Slow Tests

1. Run specific test file instead of all tests
2. Use `test.only()` to run single test
3. Check for unnecessary waits
4. Optimize selectors

## 📞 Support

For issues or questions:
1. Check this README
2. Review Playwright documentation
3. Check test logs and screenshots
4. Ask in team chat

