import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects/DashboardPage';

/**
 * E2E Tests for Tenant App Authentication Flow
 * 
 * Tests:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Logout
 * - Session persistence
 */

test.describe('Tenant App - Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.loginAndWait(
      process.env.TEST_OWNER_EMAIL || 'owner@test.com',
      process.env.TEST_OWNER_PASSWORD || 'password123'
    );

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/(app|dashboard)/);
    
    // Verify user is logged in
    await expect(dashboardPage.header).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@test.com', 'wrongpassword');

    // Wait for error message
    await expect(loginPage.errorMessage).toBeVisible();
    
    // Verify still on login page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.loginAndWait(
      process.env.TEST_OWNER_EMAIL || 'owner@test.com',
      process.env.TEST_OWNER_PASSWORD || 'password123'
    );

    // Verify logged in
    await expect(dashboardPage.header).toBeVisible();

    // Logout
    await loginPage.signOut();

    // Verify redirected to login page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should persist session across page refreshes', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login
    await loginPage.goto();
    await loginPage.loginAndWait(
      process.env.TEST_OWNER_EMAIL || 'owner@test.com',
      process.env.TEST_OWNER_PASSWORD || 'password123'
    );

    // Refresh page
    await page.reload();

    // Verify still logged in
    await expect(dashboardPage.header).toBeVisible();
    await expect(page).toHaveURL(/\/(app|dashboard)/);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/app/(tenant)/leads');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

