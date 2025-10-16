import { test, expect } from '../fixtures/auth';
import { LeadsPage } from '../page-objects/LeadsPage';
import { DashboardPage } from '../page-objects/DashboardPage';

/**
 * E2E Tests for Tenant App Leads Management
 * 
 * Tests:
 * - View leads list
 * - Create new lead
 * - Search leads
 * - View lead details
 */

test.describe('Tenant App - Leads Management', () => {
  test('should display leads list', async ({ authenticatedPage }) => {
    const leadsPage = new LeadsPage(authenticatedPage);

    await leadsPage.goto();

    // Verify page loaded
    await expect(leadsPage.leadsTable).toBeVisible();
    await expect(leadsPage.newLeadButton).toBeVisible();
  });

  test('should create a new lead', async ({ authenticatedPage }) => {
    const leadsPage = new LeadsPage(authenticatedPage);

    await leadsPage.goto();

    const initialCount = await leadsPage.getLeadCount();

    // Create new lead
    const testLead = {
      companyName: `Test Company ${Date.now()}`,
      contactName: 'John Doe',
      email: `test${Date.now()}@example.com`,
      phone: '555-1234',
    };

    await leadsPage.createLead(testLead);

    // Verify lead was created
    const newCount = await leadsPage.getLeadCount();
    expect(newCount).toBeGreaterThan(initialCount);

    // Verify lead appears in list
    await expect(authenticatedPage.locator(`text=${testLead.companyName}`)).toBeVisible();
  });

  test('should search leads', async ({ authenticatedPage }) => {
    const leadsPage = new LeadsPage(authenticatedPage);

    await leadsPage.goto();

    // Create a lead to search for
    const testLead = {
      companyName: `Searchable Company ${Date.now()}`,
      contactName: 'Jane Smith',
      email: `search${Date.now()}@example.com`,
    };

    await leadsPage.createLead(testLead);

    // Search for the lead
    await leadsPage.searchLeads(testLead.companyName);

    // Verify search results
    await expect(authenticatedPage.locator(`text=${testLead.companyName}`)).toBeVisible();
  });

  test('should navigate to lead details', async ({ authenticatedPage }) => {
    const leadsPage = new LeadsPage(authenticatedPage);

    await leadsPage.goto();

    // Create a lead
    const testLead = {
      companyName: `Detail Test Company ${Date.now()}`,
      contactName: 'Bob Johnson',
      email: `detail${Date.now()}@example.com`,
    };

    await leadsPage.createLead(testLead);

    // Click on the lead
    await leadsPage.clickLeadByName(testLead.companyName);

    // Verify navigated to details page
    await expect(authenticatedPage).toHaveURL(/\/leads\/[a-zA-Z0-9-]+/);
    await expect(authenticatedPage.locator(`text=${testLead.companyName}`)).toBeVisible();
  });

  test('should navigate from dashboard to leads', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    const leadsPage = new LeadsPage(authenticatedPage);

    await dashboardPage.goto();
    await dashboardPage.navigateToLeads();

    // Verify on leads page
    await expect(leadsPage.leadsTable).toBeVisible();
  });
});

