# @cortiware/ui-components

Shared UI components for Cortiware applications.

## Overview

This package provides reusable React components used across Cortiware apps:
- **FeatureToggle**: Conditional rendering based on feature flags
- **PaymentRequiredBanner**: HTTP 402 payment required banner
- **RateLimitBanner**: HTTP 429 rate limit exceeded banner

## Installation

This is an internal package in the Cortiware monorepo. It's automatically available to all apps via workspace dependencies.

```json
{
  "dependencies": {
    "@cortiware/ui-components": "file:../../packages/ui-components"
  }
}
```

## Components

### FeatureToggle

Conditionally render components based on feature flags.

#### Props

```typescript
interface FeatureToggleProps {
  feature: string;           // Feature flag name
  children: React.ReactNode; // Content to render if feature is enabled
  fallback?: React.ReactNode; // Optional fallback if feature is disabled
}
```

#### Usage

```typescript
import { FeatureToggle } from '@cortiware/ui-components';

export function MyComponent() {
  return (
    <FeatureToggle 
      feature="new-dashboard" 
      fallback={<OldDashboard />}
    >
      <NewDashboard />
    </FeatureToggle>
  );
}
```

#### Examples

**Basic usage:**
```typescript
<FeatureToggle feature="beta-feature">
  <BetaFeatureComponent />
</FeatureToggle>
```

**With fallback:**
```typescript
<FeatureToggle 
  feature="new-ui" 
  fallback={<div>Feature not available</div>}
>
  <NewUIComponent />
</FeatureToggle>
```

**Nested toggles:**
```typescript
<FeatureToggle feature="parent-feature">
  <FeatureToggle feature="child-feature">
    <ChildComponent />
  </FeatureToggle>
</FeatureToggle>
```

---

### PaymentRequiredBanner

Display a banner when payment is required (HTTP 402).

#### Props

```typescript
interface PaymentRequiredBannerProps {
  message?: string;          // Custom message (optional)
  onUpgrade?: () => void;    // Callback when upgrade button clicked
  onDismiss?: () => void;    // Callback when banner dismissed
  dismissible?: boolean;     // Whether banner can be dismissed (default: true)
  className?: string;        // Additional CSS classes
}
```

#### Usage

```typescript
import { PaymentRequiredBanner } from '@cortiware/ui-components';

export function MyComponent() {
  const handleUpgrade = () => {
    router.push('/billing/upgrade');
  };
  
  return (
    <PaymentRequiredBanner 
      message="Upgrade to access this feature"
      onUpgrade={handleUpgrade}
    />
  );
}
```

#### Examples

**Basic usage:**
```typescript
<PaymentRequiredBanner />
```

**Custom message:**
```typescript
<PaymentRequiredBanner 
  message="Your trial has ended. Upgrade to continue using this feature."
/>
```

**With callbacks:**
```typescript
<PaymentRequiredBanner 
  onUpgrade={() => router.push('/billing')}
  onDismiss={() => setShowBanner(false)}
/>
```

**Non-dismissible:**
```typescript
<PaymentRequiredBanner 
  dismissible={false}
  message="Payment required to continue"
/>
```

---

### RateLimitBanner

Display a banner when rate limit is exceeded (HTTP 429).

#### Props

```typescript
interface RateLimitBannerProps {
  message?: string;          // Custom message (optional)
  retryAfter?: number;       // Seconds until retry allowed
  onRetry?: () => void;      // Callback when retry button clicked
  onDismiss?: () => void;    // Callback when banner dismissed
  dismissible?: boolean;     // Whether banner can be dismissed (default: true)
  className?: string;        // Additional CSS classes
}
```

#### Usage

```typescript
import { RateLimitBanner } from '@cortiware/ui-components';

export function MyComponent() {
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(60);
  
  const handleRetry = () => {
    // Retry the request
    fetchData();
  };
  
  if (rateLimited) {
    return (
      <RateLimitBanner 
        retryAfter={retryAfter}
        onRetry={handleRetry}
        onDismiss={() => setRateLimited(false)}
      />
    );
  }
  
  return <div>Content</div>;
}
```

#### Examples

**Basic usage:**
```typescript
<RateLimitBanner />
```

**With retry timer:**
```typescript
<RateLimitBanner 
  retryAfter={120}
  message="Too many requests. Please wait before trying again."
/>
```

**With callbacks:**
```typescript
<RateLimitBanner 
  onRetry={() => refetch()}
  onDismiss={() => setShowBanner(false)}
/>
```

**Non-dismissible with countdown:**
```typescript
<RateLimitBanner 
  dismissible={false}
  retryAfter={60}
  message="Rate limit exceeded. Retry in:"
/>
```

## Styling

All components use CSS variables from `@cortiware/themes` for consistent styling.

### Custom Styling

```typescript
// Add custom classes
<PaymentRequiredBanner 
  className="my-custom-banner"
/>

// Or use inline styles
<RateLimitBanner 
  style={{ marginTop: '20px' }}
/>
```

### Theme Variables Used

```css
--background
--foreground
--primary
--primary-foreground
--destructive
--destructive-foreground
--border
--radius
```

## Best Practices

1. **Use FeatureToggle** for gradual feature rollouts
2. **Handle payment required** gracefully with PaymentRequiredBanner
3. **Respect rate limits** and show clear messaging with RateLimitBanner
4. **Provide callbacks** for user actions (upgrade, retry, dismiss)
5. **Use consistent messaging** across your app
6. **Test edge cases** (dismissed banners, expired timers, etc.)

## Common Patterns

### Feature Flag Management

```typescript
// Feature flag context
const FeatureFlagContext = createContext({});

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({
    'new-dashboard': true,
    'beta-feature': false,
  });
  
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// Use in components
<FeatureToggle feature="new-dashboard">
  <NewDashboard />
</FeatureToggle>
```

### API Error Handling

```typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    
    if (response.status === 402) {
      setShowPaymentBanner(true);
      return;
    }
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      setRetryAfter(retryAfter);
      setShowRateLimitBanner(true);
      return;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
```

### Conditional Rendering

```typescript
export function Dashboard() {
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [showRateLimitBanner, setShowRateLimitBanner] = useState(false);
  
  if (showPaymentBanner) {
    return <PaymentRequiredBanner onUpgrade={() => router.push('/billing')} />;
  }
  
  if (showRateLimitBanner) {
    return <RateLimitBanner onRetry={() => fetchData()} />;
  }
  
  return (
    <FeatureToggle feature="new-dashboard" fallback={<OldDashboard />}>
      <NewDashboard />
    </FeatureToggle>
  );
}
```

## TypeScript Support

All components are fully typed with TypeScript.

```typescript
import type { 
  FeatureToggleProps, 
  PaymentRequiredBannerProps, 
  RateLimitBannerProps 
} from '@cortiware/ui-components';
```

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentRequiredBanner } from '@cortiware/ui-components';

test('calls onUpgrade when upgrade button clicked', () => {
  const handleUpgrade = jest.fn();
  
  render(<PaymentRequiredBanner onUpgrade={handleUpgrade} />);
  
  const upgradeButton = screen.getByText('Upgrade');
  fireEvent.click(upgradeButton);
  
  expect(handleUpgrade).toHaveBeenCalled();
});
```

## Related Packages

- `@cortiware/themes`: Shared themes and CSS
- `@cortiware/auth-service`: Authentication utilities

## Documentation

- [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md): Code style guide
- [THEME_GUIDE.md](../../docs/THEME_GUIDE.md): Theme customization

## License

MIT

