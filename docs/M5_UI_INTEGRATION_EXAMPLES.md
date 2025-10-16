# M5 - UI Polish & Feature Toggles Integration Examples

## Overview

This document provides concrete examples of integrating the UI components from `@cortiware/ui-components` into tenant-app and provider-portal pages.

## Components Available

1. **PaymentRequiredBanner** - HTTP 402 payment required state
2. **RateLimitBanner** - HTTP 429 rate limit exceeded state
3. **FeatureToggle** - Feature flag conditional rendering

## Integration Pattern

### 1. PaymentRequiredBanner Integration

**Use Case**: Display when API returns 402 (insufficient wallet balance)

**Example: Tenant App - Routing Optimization Page**

```tsx
// apps/tenant-app/src/app/(tenant)/routing/optimize/page.tsx
'use client';

import { useState } from 'react';
import { PaymentRequiredBanner } from '@cortiware/ui-components';

export default function RoutingOptimizePage() {
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);

  async function handleOptimize() {
    const res = await fetch('/api/routing/optimize', {
      method: 'POST',
      body: JSON.stringify({ /* route data */ }),
    });

    if (res.status === 402) {
      const data = await res.json();
      setInvoice(data.invoice);
      setPaymentRequired(true);
      return;
    }

    // Handle success...
  }

  return (
    <div>
      <h1>Route Optimization</h1>
      
      {paymentRequired && (
        <PaymentRequiredBanner
          invoice={invoice}
          onPayNow={() => window.location.href = '/wallet'}
          onDismiss={() => setPaymentRequired(false)}
        />
      )}

      <button onClick={handleOptimize}>Optimize Routes</button>
    </div>
  );
}
```

### 2. RateLimitBanner Integration

**Use Case**: Display when API returns 429 (rate limit exceeded)

**Example: Tenant App - Leads Page**

```tsx
// apps/tenant-app/src/app/(tenant)/leads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { RateLimitBanner } from '@cortiware/ui-components';

export default function LeadsPage() {
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [leads, setLeads] = useState([]);

  async function fetchLeads() {
    const res = await fetch('/api/leads');

    if (res.status === 429) {
      const retryHeader = res.headers.get('Retry-After');
      setRetryAfter(parseInt(retryHeader || '60'));
      setRateLimited(true);
      return;
    }

    const data = await res.json();
    setLeads(data);
    setRateLimited(false);
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  if (rateLimited) {
    return (
      <RateLimitBanner
        retryAfter={retryAfter}
        onRetry={fetchLeads}
        onDismiss={() => setRateLimited(false)}
      />
    );
  }

  return (
    <div>
      <h1>Leads</h1>
      {/* Leads list... */}
    </div>
  );
}
```

### 3. FeatureToggle Integration

**Use Case**: Conditionally show experimental features

**Example: Tenant App - Dashboard with Beta Features**

```tsx
// apps/tenant-app/src/app/(tenant)/dashboard/page.tsx
'use client';

import { FeatureToggle, setFeatureFlag } from '@cortiware/ui-components';
import { useEffect } from 'react';

export default function DashboardPage() {
  useEffect(() => {
    // Load feature flags from config/database
    async function loadFlags() {
      const res = await fetch('/api/feature-flags');
      const flags = await res.json();
      
      Object.entries(flags).forEach(([key, enabled]) => {
        setFeatureFlag(key, enabled as boolean);
      });
    }
    
    loadFlags();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Standard dashboard */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Revenue" value="$12,345" />
        <MetricCard title="Jobs" value="42" />
        <MetricCard title="Customers" value="18" />
      </div>

      {/* Beta: New analytics dashboard */}
      <FeatureToggle feature="new-analytics-dashboard">
        <div className="mt-8">
          <h2>Advanced Analytics (Beta)</h2>
          <NewAnalyticsDashboard />
        </div>
      </FeatureToggle>

      {/* Beta: AI-powered insights */}
      <FeatureToggle feature="ai-insights">
        <div className="mt-8">
          <h2>AI Insights (Beta)</h2>
          <AIInsightsPanel />
        </div>
      </FeatureToggle>
    </div>
  );
}
```

## E2E Smoke Test Checklist

### Manual Testing Checklist

#### PaymentRequiredBanner Tests
- [ ] **Test 1**: Trigger 402 response (empty wallet)
  - Navigate to routing optimization page
  - Attempt to optimize routes with insufficient balance
  - Verify PaymentRequiredBanner appears with correct amount
  - Click "Add Funds" → verify redirect to /wallet
  - Click "Dismiss" → verify banner disappears

- [ ] **Test 2**: Verify invoice details display
  - Trigger 402 with memo field
  - Verify memo text appears in banner
  - Verify amount is formatted correctly ($XX.XX)

#### RateLimitBanner Tests
- [ ] **Test 3**: Trigger 429 response (rate limit)
  - Make rapid API requests to trigger rate limit
  - Verify RateLimitBanner appears
  - Verify countdown timer displays and decrements
  - Wait for countdown to reach 0 → verify banner auto-dismisses

- [ ] **Test 4**: Retry functionality
  - Trigger 429 response
  - Click "Retry" button before countdown expires
  - Verify request is retried
  - Verify banner behavior (stays if still rate limited, dismisses if successful)

#### FeatureToggle Tests
- [ ] **Test 5**: Feature flag enable/disable
  - Set feature flag to true via API
  - Verify feature content appears
  - Set feature flag to false via API
  - Verify feature content disappears

- [ ] **Test 6**: Fallback rendering
  - Use FeatureToggle with fallback prop
  - Disable feature flag
  - Verify fallback content renders

### Automated E2E Tests (Playwright/Cypress)

```typescript
// tests/e2e/ui-components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('UI Components Integration', () => {
  test('PaymentRequiredBanner appears on 402 response', async ({ page }) => {
    await page.goto('/routing/optimize');
    
    // Mock 402 response
    await page.route('/api/routing/optimize', route => {
      route.fulfill({
        status: 402,
        body: JSON.stringify({
          invoice: { amount_cents: 3500, memo: 'Route optimization fee' }
        })
      });
    });

    await page.click('button:has-text("Optimize Routes")');
    
    // Verify banner appears
    await expect(page.locator('[data-testid="payment-required-banner"]')).toBeVisible();
    await expect(page.locator('text=$35.00')).toBeVisible();
    await expect(page.locator('text=Route optimization fee')).toBeVisible();
  });

  test('RateLimitBanner countdown works', async ({ page }) => {
    await page.goto('/leads');
    
    // Mock 429 response
    await page.route('/api/leads', route => {
      route.fulfill({
        status: 429,
        headers: { 'Retry-After': '10' }
      });
    });

    await page.reload();
    
    // Verify banner appears with countdown
    await expect(page.locator('[data-testid="rate-limit-banner"]')).toBeVisible();
    await expect(page.locator('text=10 seconds')).toBeVisible();
    
    // Wait 2 seconds and verify countdown decreased
    await page.waitForTimeout(2000);
    await expect(page.locator('text=8 seconds')).toBeVisible();
  });

  test('FeatureToggle shows/hides content', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mock feature flags API
    await page.route('/api/feature-flags', route => {
      route.fulfill({
        body: JSON.stringify({
          'new-analytics-dashboard': true,
          'ai-insights': false
        })
      });
    });

    await page.reload();
    
    // Verify enabled feature shows
    await expect(page.locator('text=Advanced Analytics (Beta)')).toBeVisible();
    
    // Verify disabled feature hidden
    await expect(page.locator('text=AI Insights (Beta)')).not.toBeVisible();
  });
});
```

## Implementation Priority

### High Priority (Immediate)
1. **Wallet/Billing Pages** - PaymentRequiredBanner for 402 states
2. **API-Heavy Pages** - RateLimitBanner for 429 states (leads, dashboard, analytics)

### Medium Priority (Next Sprint)
3. **Experimental Features** - FeatureToggle for beta features
4. **Admin Pages** - Feature toggles for provider-only features

### Low Priority (Future)
5. **All API Routes** - Consistent 402/429 handling across all endpoints

## Configuration

### Feature Flags Storage

**Option 1: In-Memory (Current)**
```typescript
import { setFeatureFlag } from '@cortiware/ui-components';

// Set flags on app initialization
setFeatureFlag('new-dashboard', true);
setFeatureFlag('beta-features', false);
```

**Option 2: Database (Recommended for Production)**
```typescript
// Create feature_flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

// Load flags from database
async function loadFeatureFlags() {
  const flags = await prisma.featureFlag.findMany();
  flags.forEach(flag => {
    setFeatureFlag(flag.key, flag.enabled);
  });
}
```

## Best Practices

1. **Always handle 402/429 responses** - Don't let users see generic error messages
2. **Provide clear CTAs** - "Add Funds", "Retry", "Upgrade" buttons should be obvious
3. **Use feature toggles for gradual rollouts** - Enable features for subset of users first
4. **Test edge cases** - Dismissed banners, expired timers, concurrent requests
5. **Monitor feature flag usage** - Track which features are enabled/disabled in production

## Next Steps

1. ✅ Components created and tested (M5 Phase 1)
2. ⏳ Integrate into tenant-app pages (M5 Phase 2)
3. ⏳ Integrate into provider-portal pages (M5 Phase 3)
4. ⏳ Add automated e2e tests (M5 Phase 4)
5. ⏳ Document feature flag management (M5 Phase 5)

