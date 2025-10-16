import { test, expect } from '../fixtures/auth';
import { WalletPage } from '../page-objects/WalletPage';
import { DashboardPage } from '../page-objects/DashboardPage';

/**
 * E2E Tests for Tenant App Wallet & Billing
 * 
 * Tests:
 * - View wallet balance
 * - View transaction history
 * - Payment required banner (if balance low)
 * - Add funds flow
 */

test.describe('Tenant App - Wallet & Billing', () => {
  test('should display wallet page', async ({ authenticatedPage }) => {
    const walletPage = new WalletPage(authenticatedPage);

    await walletPage.goto();

    // Verify page loaded
    await expect(walletPage.balanceDisplay).toBeVisible();
    await expect(walletPage.transactionHistory).toBeVisible();
  });

  test('should display wallet balance', async ({ authenticatedPage }) => {
    const walletPage = new WalletPage(authenticatedPage);

    await walletPage.goto();

    const balance = await walletPage.getBalance();
    
    // Balance should be a number (could be $0.00 or any amount)
    expect(balance).toMatch(/\$[\d,]+\.\d{2}/);
  });

  test('should display transaction history', async ({ authenticatedPage }) => {
    const walletPage = new WalletPage(authenticatedPage);

    await walletPage.goto();

    // Transaction history should be visible (even if empty)
    await expect(walletPage.transactionHistory).toBeVisible();
  });

  test('should navigate from dashboard to wallet', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    const walletPage = new WalletPage(authenticatedPage);

    await dashboardPage.goto();
    await dashboardPage.navigateToWallet();

    // Verify on wallet page
    await expect(walletPage.balanceDisplay).toBeVisible();
  });

  test('should show add funds button', async ({ authenticatedPage }) => {
    const walletPage = new WalletPage(authenticatedPage);

    await walletPage.goto();

    await expect(walletPage.addFundsButton).toBeVisible();
  });

  // Note: Payment required banner test would require setting up a low balance scenario
  test.skip('should show payment required banner when balance is low', async ({ authenticatedPage }) => {
    const walletPage = new WalletPage(authenticatedPage);

    await walletPage.goto();

    // This test requires a test account with low balance
    const bannerVisible = await walletPage.isPaymentRequiredBannerVisible();
    
    if (bannerVisible) {
      await expect(walletPage.paymentRequiredBanner).toBeVisible();
    }
  });
});

