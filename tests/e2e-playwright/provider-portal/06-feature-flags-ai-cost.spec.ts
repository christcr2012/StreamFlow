import { test, expect } from '../fixtures/auth';

/**
 * Provider Portal - Feature Flags: AI Cost
 * Validates that the AI Cost nav and page are gated by the 'ai-cost' flag.
 */

test.describe('Provider Portal - Feature Flag: ai-cost', () => {
  test('nav and page respect ai-cost flag', async ({ providerPage }) => {
    // Ensure flag is on
    const setOn = await providerPage.request.patch('/api/feature-flags', {
      data: { flags: { 'ai-cost': true } },
    });
    expect(setOn.ok()).toBeTruthy();

    // Navigate to provider area
    await providerPage.goto('/provider');
    await providerPage.waitForLoadState('networkidle');

    // When enabled, nav link should exist and page should be accessible
    const aiCostNavEnabled = await providerPage.locator('a[href="/provider/ai/cost"]').count();
    expect(aiCostNavEnabled).toBeGreaterThan(0);

    const resEnabled = await providerPage.goto('/provider/ai/cost');
    expect(resEnabled && resEnabled.status()).toBeLessThan(500);
    await expect(providerPage.locator('h1:text("AI Cost Management")')).toBeVisible();

    // Turn flag off
    const setOff = await providerPage.request.patch('/api/feature-flags', {
      data: { flags: { 'ai-cost': false } },
    });
    expect(setOff.ok()).toBeTruthy();

    // Reload provider area and verify nav link is gone
    await providerPage.goto('/provider');
    await providerPage.waitForLoadState('networkidle');
    const aiCostNavDisabled = await providerPage.locator('a[href="/provider/ai/cost"]').count();
    expect(aiCostNavDisabled).toBe(0);

    // Visiting page should either 404 or show disabled notice
    const resDisabled = await providerPage.goto('/provider/ai/cost');
    expect(resDisabled?.status()).toBeLessThan(500); // 404 acceptable
    const disabledNotice = providerPage.locator('text=disabled');
    await expect(disabledNotice.or(providerPage.locator('text=Feature disabled'))).toBeVisible();

    // Restore flag to on for other tests
    const restore = await providerPage.request.patch('/api/feature-flags', {
      data: { flags: { 'ai-cost': true } },
    });
    expect(restore.ok()).toBeTruthy();
  });
});
