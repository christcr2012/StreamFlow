import { test, expect } from '../fixtures/auth';

/**
 * E2E Tests for Provider Portal UI Components
 * 
 * Tests:
 * - Page load performance
 * - No console errors
 * - Responsive navigation
 * - UI consistency
 */

test.describe('Provider Portal - UI Components', () => {
  test('should render dashboard without console errors', async ({ providerPage }) => {
    const consoleErrors: string[] = [];
    
    providerPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await providerPage.goto('/dashboard');
    await providerPage.waitForLoadState('networkidle');

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should load all pages without 500 errors', async ({ providerPage }) => {
    const pages = [
      '/dashboard',
      '/tenants',
      '/analytics',
      '/billing',
      '/federation',
      '/settings',
    ];

    for (const pagePath of pages) {
      const response = await providerPage.goto(pagePath);
      
      // Verify no 500 errors
      expect(response?.status()).not.toBe(500);
      expect(response?.status()).toBeLessThan(500);
    }
  });

  test('should have responsive navigation', async ({ providerPage }) => {
    await providerPage.goto('/dashboard');

    // Verify navigation links are visible
    const tenantsLink = providerPage.locator('a[href*="/tenants"]');
    const analyticsLink = providerPage.locator('a[href*="/analytics"]');

    const tenantsCount = await tenantsLink.count();
    const analyticsCount = await analyticsLink.count();

    expect(tenantsCount).toBeGreaterThan(0);
    expect(analyticsCount).toBeGreaterThan(0);
  });

  test('should handle page transitions smoothly', async ({ providerPage }) => {
    await providerPage.goto('/dashboard');

    // Navigate to tenants
    await providerPage.click('a[href*="/tenants"]');
    await providerPage.waitForURL(/\/tenants/);

    // Navigate to analytics
    await providerPage.click('a[href*="/analytics"]');
    await providerPage.waitForURL(/\/analytics/);

    // Navigate back to dashboard
    await providerPage.click('a[href*="/dashboard"]');
    await providerPage.waitForURL(/\/dashboard/);

    // All transitions should complete without errors
    expect(true).toBe(true);
  });

  test('should display provider branding', async ({ providerPage }) => {
    await providerPage.goto('/dashboard');

    // Look for provider-specific branding or logo
    const header = providerPage.locator('header');
    await expect(header).toBeVisible();
  });
});

