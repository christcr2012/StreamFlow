# E2E Testing with Vercel Deployments

**Date**: 2025-10-16  
**Status**: ⚠️ **CONFIGURED - NEEDS TEST DATA**

---

## 📋 Overview

This document describes how to run E2E tests against deployed Vercel environments instead of local development servers.

---

## ⚙️ Configuration

### Files Created

1. **`.env.test`** - Environment configuration for Vercel deployments
2. **`scripts/run-e2e-vercel.ps1`** - PowerShell script to run tests against Vercel
3. **`package.json`** - Added `test:e2e:vercel` script

### Vercel URLs

The tests are configured to run against:
- **Tenant App**: `https://stream-flow-git-main-christcr2012s-projects.vercel.app`
- **Provider Portal**: `https://stream-flow-git-main-christcr2012s-projects.vercel.app`

---

## 🚀 How to Run

### Option 1: Using NPM Script (Recommended)

```bash
npm run test:e2e:vercel
```

This script:
1. Sets environment variables for Vercel URLs
2. Sets CI mode to skip local dev server startup
3. Runs Playwright tests against deployed environments

### Option 2: Manual Configuration

```powershell
# PowerShell
$env:TENANT_APP_URL = "https://stream-flow-git-main-christcr2012s-projects.vercel.app"
$env:PROVIDER_PORTAL_URL = "https://stream-flow-git-main-christcr2012s-projects.vercel.app"
$env:CI = "true"
$env:TEST_OWNER_EMAIL = "owner@test.com"
$env:TEST_OWNER_PASSWORD = "password123"

npm run test:e2e:playwright
```

---

## ⚠️ Current Status

### Tests Are Failing

All 117 tests are currently failing when run against Vercel deployments. This is expected because:

1. **Test Users Don't Exist**: The test credentials (`owner@test.com`, `provider@test.com`, etc.) don't exist in the deployed database
2. **Database State**: The deployed environment may not have the required test data
3. **Authentication**: The deployed apps may have different authentication requirements

---

## 🔧 Next Steps to Make Tests Pass

### 1. Create Test Users in Deployed Database

You need to create test users in your deployed Prisma database:

```sql
-- Tenant App Test Users
INSERT INTO "User" (id, email, password, name, role, tenantId)
VALUES 
  ('test-owner-1', 'owner@test.com', '<hashed-password>', 'Test Owner', 'OWNER', '<tenant-id>'),
  ('test-manager-1', 'manager@test.com', '<hashed-password>', 'Test Manager', 'MANAGER', '<tenant-id>'),
  ('test-tech-1', 'tech@test.com', '<hashed-password>', 'Test Tech', 'TECHNICIAN', '<tenant-id>');

-- Provider Portal Test Users
INSERT INTO "ProviderUser" (id, email, password, name, role)
VALUES 
  ('test-provider-1', 'provider@test.com', '<hashed-password>', 'Test Provider', 'ADMIN');
```

### 2. Seed Test Data

Create a seed script for test data:

```typescript
// scripts/seed-test-data.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test Tenant',
      slug: 'test-tenant',
    },
  });

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.createMany({
    data: [
      {
        email: 'owner@test.com',
        password: hashedPassword,
        name: 'Test Owner',
        role: 'OWNER',
        tenantId: tenant.id,
      },
      // ... more users
    ],
  });
}

main();
```

### 3. Alternative: Use Separate Test Environment

Create a dedicated test deployment:

1. Create a new Vercel project for testing
2. Use a separate test database
3. Seed with test data
4. Update `.env.test` with test environment URLs

### 4. Alternative: Mock Authentication

Update tests to use API tokens or session cookies instead of login flows:

```typescript
// tests/e2e-playwright/fixtures/auth.ts
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Set auth cookie directly instead of logging in
    await page.context().addCookies([{
      name: 'session',
      value: process.env.TEST_SESSION_TOKEN,
      domain: new URL(process.env.TENANT_APP_URL).hostname,
      path: '/',
    }]);
    await use(page);
  },
});
```

---

## 📊 Test Execution Results

### Latest Run (2025-10-16)

- **Tests Found**: 117
- **Tests Run**: 117
- **Tests Passed**: 0 ❌
- **Tests Failed**: 117 ❌
- **Reason**: Test users don't exist in deployed database

### Expected Failures

All tests are failing with authentication errors because:
- Login attempts fail (users don't exist)
- Protected routes redirect to login
- No test data exists in the database

---

## 🎯 Recommendations

### For Development

**Use local dev servers** for E2E testing during development:

```bash
# Terminal 1: Start tenant-app
cd apps/tenant-app && npm run dev

# Terminal 2: Start provider-portal
cd apps/provider-portal && npm run dev

# Terminal 3: Run tests
npm run test:e2e:playwright
```

### For CI/CD

**Use GitHub Actions** which will:
1. Deploy to Vercel preview environment
2. Seed test data
3. Run E2E tests
4. Clean up test data

The `.github/workflows/e2e-playwright.yml` workflow is already configured for this.

### For Production Verification

**Create a dedicated test environment**:
1. Separate Vercel project: `cortiware-test`
2. Separate database: `cortiware_test`
3. Persistent test data
4. Run tests on schedule (nightly)

---

## 📝 Configuration Files

### `.env.test`

```env
# Vercel Deployment URLs
TENANT_APP_URL=https://stream-flow-git-main-christcr2012s-projects.vercel.app
PROVIDER_PORTAL_URL=https://stream-flow-git-main-christcr2012s-projects.vercel.app

# Test Credentials
TEST_OWNER_EMAIL=owner@test.com
TEST_OWNER_PASSWORD=password123
TEST_PROVIDER_EMAIL=provider@test.com
TEST_PROVIDER_PASSWORD=password123

# CI Mode
CI=true
```

### `scripts/run-e2e-vercel.ps1`

```powershell
# Set environment variables
$env:TENANT_APP_URL = "https://stream-flow-git-main-christcr2012s-projects.vercel.app"
$env:PROVIDER_PORTAL_URL = "https://stream-flow-git-main-christcr2012s-projects.vercel.app"
$env:CI = "true"

# Run tests
npm run test:e2e:playwright
```

---

## ✅ Summary

- ✅ Vercel deployment configuration complete
- ✅ Test scripts created
- ✅ NPM commands added
- ⏳ **Needs**: Test users and data in deployed database
- ⏳ **Needs**: Seed script for test data
- ⏳ **Needs**: Dedicated test environment (optional)

---

## 🔗 Related Documentation

- **E2E Testing Guide**: `docs/E2E_TESTING_GUIDE.md`
- **E2E Implementation Summary**: `docs/E2E_IMPLEMENTATION_SUMMARY.md`
- **Test Suite README**: `tests/e2e-playwright/README.md`
- **Playwright Config**: `playwright.config.ts`

---

**Next Action**: Create test users in deployed database or set up dedicated test environment.

