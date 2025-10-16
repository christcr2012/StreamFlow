import { test, expect } from '../fixtures/auth';
import { JobsPage } from '../page-objects/JobsPage';
import { DashboardPage } from '../page-objects/DashboardPage';

/**
 * E2E Tests for Tenant App Jobs Management
 * 
 * Tests:
 * - View jobs list
 * - Create new job
 * - View job details
 * - Navigate from dashboard
 */

test.describe('Tenant App - Jobs Management', () => {
  test('should display jobs list', async ({ authenticatedPage }) => {
    const jobsPage = new JobsPage(authenticatedPage);

    await jobsPage.goto();

    // Verify page loaded
    await expect(jobsPage.jobsTable).toBeVisible();
    await expect(jobsPage.newJobButton).toBeVisible();
  });

  test('should create a new job', async ({ authenticatedPage }) => {
    const jobsPage = new JobsPage(authenticatedPage);

    await jobsPage.goto();

    const initialCount = await jobsPage.getJobCount();

    // Create new job
    const testJob = {
      customerId: '1', // Assuming customer with ID 1 exists
      serviceType: 'maintenance',
      scheduledDate: '2025-12-01',
      notes: 'Test job created by E2E test',
    };

    await jobsPage.createJob(testJob);

    // Verify job was created
    const newCount = await jobsPage.getJobCount();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should navigate from dashboard to jobs', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    const jobsPage = new JobsPage(authenticatedPage);

    await dashboardPage.goto();
    await dashboardPage.navigateToJobs();

    // Verify on jobs page
    await expect(jobsPage.jobsTable).toBeVisible();
  });

  test('should display job form when clicking new job', async ({ authenticatedPage }) => {
    const jobsPage = new JobsPage(authenticatedPage);

    await jobsPage.goto();
    await jobsPage.clickNewJob();

    // Verify form is visible
    await expect(jobsPage.customerSelect).toBeVisible();
    await expect(jobsPage.serviceTypeSelect).toBeVisible();
    await expect(jobsPage.scheduledDateInput).toBeVisible();
  });
});

