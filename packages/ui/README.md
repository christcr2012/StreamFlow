# @cortiware/ui

Shared UI components library for Cortiware applications.

## Overview

This package provides reusable React components that can be used across all Cortiware apps. It serves as a foundation for:
- Common UI primitives (Button, Input, Card, etc.)
- shadcn/ui component re-exports
- Custom Cortiware-specific components
- Consistent design system implementation

**Current Status**: Placeholder package with basic Button component. Will be populated with shadcn/ui components and custom components as needed.

## Installation

This is an internal package in the Cortiware monorepo.

```json
{
  "dependencies": {
    "@cortiware/ui": "file:../../packages/ui"
  }
}
```

## Available Components

### Button

Basic button component (placeholder).

```typescript
import { Button } from '@cortiware/ui';

export default function MyComponent() {
  return (
    <Button onClick={() => console.log('clicked')}>
      Click Me
    </Button>
  );
}
```

## Planned Components

This package will be expanded to include:

### Primitives
- Button (variants: primary, secondary, outline, ghost, link)
- Input (text, email, password, number, etc.)
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Label
- Badge
- Avatar

### Layout
- Card
- Container
- Grid
- Stack
- Divider
- Separator

### Feedback
- Alert
- Toast
- Dialog
- Modal
- Popover
- Tooltip
- Progress
- Spinner
- Skeleton

### Navigation
- Tabs
- Breadcrumb
- Pagination
- Menu
- Dropdown

### Data Display
- Table
- List
- Accordion
- Collapse

### Forms
- Form
- FormField
- FormLabel
- FormError
- FormDescription

## Usage Patterns

### Basic Component Usage

```typescript
import { Button, Card, Input } from '@cortiware/ui';

export default function LoginForm() {
  return (
    <Card>
      <h2>Login</h2>
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Button type="submit">Sign In</Button>
    </Card>
  );
}
```

### With Tailwind CSS

Components are designed to work with Tailwind CSS:

```typescript
import { Button } from '@cortiware/ui';

export default function MyComponent() {
  return (
    <div className="flex gap-4">
      <Button className="bg-blue-500 hover:bg-blue-600">
        Primary
      </Button>
      <Button className="bg-gray-500 hover:bg-gray-600">
        Secondary
      </Button>
    </div>
  );
}
```

### Composition

```typescript
import { Card, Button } from '@cortiware/ui';

export default function ProductCard({ product }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold">{product.name}</h3>
      <p className="text-gray-600">{product.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-xl font-bold">${product.price}</span>
        <Button>Add to Cart</Button>
      </div>
    </Card>
  );
}
```

## Development

### Adding New Components

1. Create component file in `packages/ui/`
2. Export from `index.tsx`
3. Add TypeScript types
4. Document usage

Example:

```typescript
// packages/ui/Card.tsx
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ 
  variant = 'default', 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  const baseStyles = 'rounded-lg';
  const variantStyles = {
    default: 'bg-white shadow',
    outlined: 'border border-gray-200',
    elevated: 'bg-white shadow-lg',
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
```

```typescript
// packages/ui/index.tsx
export * from './Button';
export * from './Card';
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@cortiware/ui';

test('renders button with text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  
  screen.getByText('Click Me').click();
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Integration with shadcn/ui

This package can re-export shadcn/ui components for consistency:

```typescript
// packages/ui/index.tsx
export { Button } from './components/ui/button';
export { Input } from './components/ui/input';
export { Card } from './components/ui/card';
// ... more shadcn/ui components
```

Apps can then import from `@cortiware/ui` instead of local component directories.

## Design System Integration

Components should reference design tokens from `@cortiware/themes`:

```typescript
// packages/ui/Button.tsx
export function Button({ variant = 'primary', ...props }: ButtonProps) {
  const variantStyles = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
    secondary: 'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-dark)]',
    outline: 'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
  };

  return (
    <button 
      className={`px-4 py-2 rounded ${variantStyles[variant]}`}
      {...props}
    />
  );
}
```

## Best Practices

1. **Keep components simple** - Single responsibility principle
2. **Use TypeScript** - Provide proper type definitions
3. **Support className prop** - Allow Tailwind overrides
4. **Use CSS variables** - Reference design tokens from `@cortiware/themes`
5. **Document props** - Add JSDoc comments for IntelliSense
6. **Test components** - Write unit tests for behavior
7. **Follow accessibility** - Use semantic HTML and ARIA attributes

## Accessibility

All components should follow accessibility best practices:

```typescript
export function Button({ 
  children, 
  disabled, 
  'aria-label': ariaLabel,
  ...props 
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

## TypeScript Support

All components include full TypeScript definitions:

```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
```

## Related Packages

- `@cortiware/themes`: Shared CSS themes and design tokens
- `@cortiware/ui-components`: Feature-specific UI components (FeatureToggle, PaymentRequiredBanner, etc.)
- `@cortiware/config`: Shared Tailwind and TypeScript configuration

## Future Enhancements

- [ ] Add shadcn/ui components
- [ ] Create Storybook documentation
- [ ] Add visual regression tests
- [ ] Create component variants system
- [ ] Add dark mode support
- [ ] Create animation utilities
- [ ] Add form validation helpers

## Documentation

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): System architecture

## License

MIT

