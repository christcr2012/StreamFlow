import { test, expect } from '../fixtures/auth';
import { ProviderDashboardPage } from '../page-objects/ProviderDashboardPage';

/**
 * E2E Tests for Provider Portal Federation Management
 * 
 * Tests:
 * - View federation settings
 * - Manage federation configuration
 * - API key management
 */

test.describe('Provider Portal - Federation Management', () => {
  test('should display federation page', async ({ providerPage }) => {
    const dashboardPage = new ProviderDashboardPage(providerPage);

    await dashboardPage.goto();
    await dashboardPage.navigateToFederation();

    // Verify on federation page
    await expect(providerPage).toHaveURL(/\/federation/);
  });

  test('should load federation page without errors', async ({ providerPage }) => {
    const consoleErrors: string[] = [];
    
    providerPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await providerPage.goto('/federation');
    await providerPage.waitForLoadState('networkidle');

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should display federation configuration', async ({ providerPage }) => {
    await providerPage.goto('/federation');

    // Look for federation-related content
    const federationContent = providerPage.locator('text=/Federation|API|Tenant|Provider/');

    const count = await federationContent.count();
    expect(count).toBeGreaterThan(0);
  });
});

