import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Wallet page (tenant-app)
 */
export class WalletPage {
  readonly page: Page;
  readonly balanceDisplay: Locator;
  readonly addFundsButton: Locator;
  readonly transactionHistory: Locator;
  readonly paymentRequiredBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.balanceDisplay = page.locator('[data-testid="wallet-balance"]');
    this.addFundsButton = page.locator('button:has-text("Add Funds")');
    this.transactionHistory = page.locator('[data-testid="transaction-history"]');
    this.paymentRequiredBanner = page.locator('[data-testid="payment-required-banner"]');
  }

  async goto() {
    await this.page.goto('/wallet');
  }

  async getBalance(): Promise<string> {
    return await this.balanceDisplay.textContent() || '';
  }

  async clickAddFunds() {
    await this.addFundsButton.click();
  }

  async getTransactionCount(): Promise<number> {
    const rows = await this.transactionHistory.locator('tr').count();
    return rows;
  }

  async isPaymentRequiredBannerVisible(): Promise<boolean> {
    return await this.paymentRequiredBanner.isVisible();
  }
}

