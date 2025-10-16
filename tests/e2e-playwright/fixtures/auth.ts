import { test as base, Page } from '@playwright/test';

/**
 * Authentication fixtures for E2E tests
 * Provides authenticated contexts for different user roles
 */

export type AuthFixtures = {
  authenticatedPage: Page;
  ownerPage: Page;
  managerPage: Page;
  technicianPage: Page;
  providerPage: Page;
};

/**
 * Login helper function
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(app|dashboard)/);
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Generic authenticated page (owner by default)
  authenticatedPage: async ({ page }, use) => {
    await login(
      page,
      process.env.TEST_OWNER_EMAIL || 'owner@test.com',
      process.env.TEST_OWNER_PASSWORD || 'password123'
    );
    await use(page);
  },

  // Owner role page
  ownerPage: async ({ page }, use) => {
    await login(
      page,
      process.env.TEST_OWNER_EMAIL || 'owner@test.com',
      process.env.TEST_OWNER_PASSWORD || 'password123'
    );
    await use(page);
  },

  // Manager role page
  managerPage: async ({ page }, use) => {
    await login(
      page,
      process.env.TEST_MANAGER_EMAIL || 'manager@test.com',
      process.env.TEST_MANAGER_PASSWORD || 'password123'
    );
    await use(page);
  },

  // Technician role page
  technicianPage: async ({ page }, use) => {
    await login(
      page,
      process.env.TEST_TECH_EMAIL || 'tech@test.com',
      process.env.TEST_TECH_PASSWORD || 'password123'
    );
    await use(page);
  },

  // Provider portal authenticated page
  providerPage: async ({ page }, use) => {
    await login(
      page,
      process.env.TEST_PROVIDER_EMAIL || 'provider@test.com',
      process.env.TEST_PROVIDER_PASSWORD || 'password123'
    );
    await use(page);
  },
});

export { expect } from '@playwright/test';

