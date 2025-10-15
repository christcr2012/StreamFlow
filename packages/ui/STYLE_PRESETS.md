# UI Component Style Presets

## Overview

The `@cortiware/ui` package supports multiple visual style presets to provide flexibility across different applications while maintaining a single shared component library.

## Available Style Presets

### 1. **Premium** (Default)
Glass morphism design with futuristic aesthetics.

**Characteristics:**
- Backdrop blur effects
- Gradient backgrounds
- Glow shadows
- CSS variable-based theming
- Smooth transitions and animations

**Best For:**
- Provider portal (administrative interface)
- Premium SaaS applications
- Modern, cutting-edge UX

**Example:**
```typescript
import { Button, Card, Input } from '@cortiware/ui';

<Button variant="primary" stylePreset="premium">
  Save Changes
</Button>

<Card stylePreset="premium" variant="glass">
  <h2>Dashboard</h2>
</Card>

<Input 
  stylePreset="premium"
  label="Email"
  placeholder="Enter your email"
/>
```

### 2. **Business**
Clean, corporate design with flat colors and sharp edges.

**Characteristics:**
- Flat colors (no gradients)
- Sharp corners
- Subtle shadows
- Traditional corporate aesthetics
- High contrast for accessibility

**Best For:**
- Tenant-facing applications
- Conservative business environments
- Enterprise software
- Accessibility-focused applications

**Example:**
```typescript
import { Button, Card, Input } from '@cortiware/ui';

<Button variant="primary" stylePreset="business">
  Save Changes
</Button>

<Card stylePreset="business" variant="default">
  <h2>Dashboard</h2>
</Card>

<Input 
  stylePreset="business"
  label="Email"
  placeholder="Enter your email"
/>
```

## Component Support

| Component | Premium | Business |
|-----------|---------|----------|
| Button    | ✅      | ✅       |
| Card      | ✅      | ✅       |
| Input     | ✅      | ✅       |
| Modal     | ✅      | 🔄 Planned |
| Skeleton  | ✅      | 🔄 Planned |
| EmptyState| ✅      | 🔄 Planned |

## Usage Guidelines

### Default Behavior
If no `stylePreset` is specified, components default to **"premium"**:

```typescript
// These are equivalent:
<Button variant="primary" />
<Button variant="primary" stylePreset="premium" />
```

### App-Wide Configuration
To use a consistent style across an entire app, create a wrapper component:

```typescript
// components/ui/AppButton.tsx
import { Button as BaseButton, ButtonProps } from '@cortiware/ui';

export function Button(props: ButtonProps) {
  return <BaseButton {...props} stylePreset="business" />;
}
```

Then import from your wrapper instead of `@cortiware/ui`:
```typescript
import { Button } from '@/components/ui/AppButton';

<Button variant="primary">Click Me</Button> // Uses business style
```

### Mixed Styles
You can mix styles within the same app for different contexts:

```typescript
// Admin section: Premium style
<Button stylePreset="premium" variant="gradient">
  Advanced Settings
</Button>

// User section: Business style
<Button stylePreset="business" variant="primary">
  Submit Form
</Button>
```

## Visual Comparison

### Button Variants

**Premium Style:**
- `solid`: Gradient from primary to secondary with glow shadow
- `outline`: Border with accent color, hover background
- `ghost`: Text only with hover background
- `gradient`: Full gradient with intense glow
- `danger`: Red gradient with glow

**Business Style:**
- `solid`: Flat primary color, brightness on hover
- `outline`: Border that fills on hover
- `ghost`: Text only with subtle hover
- `gradient`: Same as solid (no gradient)
- `danger`: Flat red, darker on hover

### Card Variants

**Premium Style:**
- `default`: Surface color with border
- `glass`: Glass morphism with backdrop blur
- `elevated`: Surface with shadow
- `glow`: Glass with glow shadow

**Business Style:**
- `default`: White with subtle shadow
- `glass`: White with medium shadow
- `elevated`: White with large shadow
- `glow`: White with large shadow and darker border

### Input Styles

**Premium Style:**
- Larger padding (py-3)
- Rounded-lg corners
- Border-2 thickness
- CSS variable colors
- Glow effects on focus

**Business Style:**
- Standard padding (py-2)
- Rounded-md corners
- Border-1 thickness
- Fixed colors (blue focus ring)
- No glow effects

## Adding New Style Presets

To add a new style preset (e.g., "minimal"):

### 1. Update Type Definitions

```typescript
// packages/ui/src/Button.tsx
export interface ButtonProps {
  stylePreset?: 'premium' | 'business' | 'minimal';
  // ... other props
}
```

### 2. Add Variant Classes

```typescript
export function Button({ stylePreset = 'premium', ...props }: ButtonProps) {
  const premiumVariants = { /* ... */ };
  const businessVariants = { /* ... */ };
  const minimalVariants = {
    solid: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-900 text-gray-900 hover:bg-gray-100',
    // ... other variants
  };
  
  const variantClasses = 
    stylePreset === 'business' ? businessVariants :
    stylePreset === 'minimal' ? minimalVariants :
    premiumVariants;
  
  // ... rest of component
}
```

### 3. Update Documentation

Add the new preset to this file with:
- Description and characteristics
- Best use cases
- Code examples
- Visual comparison

### 4. Test Across Apps

Ensure the new preset works in both:
- Provider portal (`apps/provider-portal`)
- Tenant app (`apps/tenant-app`)

## Theme Integration

Style presets work seamlessly with the theme customization system:

```typescript
// Theme settings control colors
const themeSettings = {
  variant: 'premium-dark',
  primaryColor: '#00ff88',
  accentColor: '#3aa8ff',
};

// Style preset controls visual design
<Button 
  stylePreset="premium"  // Uses gradients, glow effects
  variant="primary"      // Uses themeSettings.primaryColor
>
  Click Me
</Button>
```

**Key Difference:**
- **Theme Settings**: Control COLORS (primary, accent, etc.)
- **Style Presets**: Control DESIGN (gradients, shadows, borders, etc.)

## Best Practices

1. **Consistency**: Use the same preset throughout an app for visual consistency
2. **Context-Appropriate**: Choose premium for modern apps, business for corporate
3. **Accessibility**: Business style has higher contrast for better accessibility
4. **Performance**: Both presets are equally performant (CSS-only)
5. **Theming**: Combine with theme settings for full customization

## Migration Guide

### From Local Components to Shared Components

If migrating from app-specific components:

```typescript
// Before (local component)
import { Button } from '@/components/ui/button';
<Button variant="primary">Click</Button>

// After (shared component with business style)
import { Button } from '@cortiware/ui';
<Button variant="primary" stylePreset="business">Click</Button>
```

The shared component accepts the same props, so no code changes needed beyond adding `stylePreset`.

## Future Enhancements

Planned additions:
- [ ] Minimal style preset (ultra-clean, borderless)
- [ ] Dark mode variants for each preset
- [ ] Animation intensity controls
- [ ] Accessibility mode (high contrast, reduced motion)
- [ ] Custom preset builder API

## Support

For questions or issues with style presets:
1. Check this documentation
2. Review component source code in `packages/ui/src/`
3. Test in Storybook (when available)
4. Contact the design system team

