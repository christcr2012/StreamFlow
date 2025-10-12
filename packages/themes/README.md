# @cortiware/themes

Shared themes and CSS utilities for Cortiware applications.

## Overview

This package provides:
- Global CSS styles and themes
- Theme registry for Next.js App Router
- Theme utilities and helpers
- Consistent styling across all apps

## Installation

This is an internal package in the Cortiware monorepo. It's automatically available to all apps via workspace dependencies.

```json
{
  "dependencies": {
    "@cortiware/themes": "file:../../packages/themes"
  }
}
```

## CSS Import Hierarchy

**CRITICAL**: Always import `globals.css` in your root layout, NEVER import `theme.css` directly.

### ✅ CORRECT

```typescript
// app/layout.tsx
import '@cortiware/themes/globals.css';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### ❌ WRONG

```typescript
// DON'T DO THIS
import '@cortiware/themes/theme.css';
```

## API Reference

### Theme Registry

```typescript
import { ThemeRegistry } from '@cortiware/themes';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
```

### Theme Utilities

```typescript
import { 
  getTheme, 
  setTheme, 
  toggleTheme, 
  getAvailableThemes 
} from '@cortiware/themes';

// Get current theme
const currentTheme = getTheme();

// Set theme
setTheme('dark');

// Toggle between light and dark
toggleTheme();

// Get all available themes
const themes = getAvailableThemes();
```

## Usage Examples

### Basic Setup (Next.js App Router)

```typescript
// app/layout.tsx
import '@cortiware/themes/globals.css';
import { ThemeRegistry } from '@cortiware/themes';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
```

### Theme Switcher Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getTheme, setTheme } from '@cortiware/themes';

export function ThemeSwitcher() {
  const [theme, setThemeState] = useState('light');
  
  useEffect(() => {
    setThemeState(getTheme());
  }, []);
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setThemeState(newTheme);
  };
  
  return (
    <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

### Using Theme Variables

```css
/* Your component CSS */
.my-component {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.my-button {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.my-card {
  background-color: var(--card);
  border: 1px solid var(--card-border);
}
```

### Tailwind Integration

```typescript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
      },
    },
  },
};
```

## Available CSS Variables

### Colors

```css
--background: Background color
--foreground: Text color
--primary: Primary brand color
--primary-foreground: Text on primary color
--secondary: Secondary brand color
--secondary-foreground: Text on secondary color
--accent: Accent color
--accent-foreground: Text on accent color
--muted: Muted color
--muted-foreground: Text on muted color
--destructive: Destructive/error color
--destructive-foreground: Text on destructive color
```

### UI Elements

```css
--card: Card background
--card-foreground: Card text
--card-border: Card border
--popover: Popover background
--popover-foreground: Popover text
--border: Default border color
--input: Input background
--ring: Focus ring color
```

### Spacing

```css
--radius: Border radius
--spacing-xs: Extra small spacing
--spacing-sm: Small spacing
--spacing-md: Medium spacing
--spacing-lg: Large spacing
--spacing-xl: Extra large spacing
```

## Theme Structure

### Light Theme

```css
:root {
  --background: #ffffff;
  --foreground: #000000;
  --primary: #0070f3;
  --primary-foreground: #ffffff;
  /* ... */
}
```

### Dark Theme

```css
[data-theme="dark"] {
  --background: #000000;
  --foreground: #ffffff;
  --primary: #0070f3;
  --primary-foreground: #ffffff;
  /* ... */
}
```

## Best Practices

1. **Always import globals.css** in root layout
2. **Use CSS variables** instead of hardcoded colors
3. **Use ThemeRegistry** for Next.js App Router apps
4. **Test both light and dark themes** during development
5. **Use semantic color names** (primary, secondary, etc.) instead of specific colors
6. **Respect system preferences** when using "system" theme

## Common Patterns

### Conditional Styling Based on Theme

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getTheme } from '@cortiware/themes';

export function ThemedComponent() {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    setTheme(getTheme());
  }, []);
  
  return (
    <div className={theme === 'dark' ? 'dark-specific-class' : 'light-specific-class'}>
      Content
    </div>
  );
}
```

### Custom Theme Colors

```css
/* Add custom colors to your app's CSS */
:root {
  --custom-brand: #ff6b6b;
  --custom-success: #51cf66;
  --custom-warning: #ffd43b;
  --custom-error: #ff6b6b;
}

[data-theme="dark"] {
  --custom-brand: #ff8787;
  --custom-success: #69db7c;
  --custom-warning: #ffe066;
  --custom-error: #ff8787;
}
```

## Troubleshooting

### Styles Not Applying

**Issue**: Styles not applying after importing themes.

**Solution**: Ensure you're importing `globals.css` in your root layout:
```typescript
import '@cortiware/themes/globals.css';
```

### Theme Not Persisting

**Issue**: Theme resets on page reload.

**Solution**: Implement theme persistence using localStorage:
```typescript
const theme = localStorage.getItem('theme') || 'light';
setTheme(theme);
```

### CSS Variables Not Working

**Issue**: CSS variables showing as undefined.

**Solution**: Ensure ThemeRegistry is wrapping your app:
```typescript
<ThemeRegistry>{children}</ThemeRegistry>
```

## Related Packages

- `@cortiware/ui-components`: UI components that use these themes
- `@cortiware/config`: Tailwind configuration

## Documentation

- [AI_AGENT_REFERENCE.md](../../docs/AI_AGENT_REFERENCE.md): CSS import hierarchy rules
- [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md): Code style guide
- [THEME_GUIDE.md](../../docs/THEME_GUIDE.md): Theme customization guide

## License

MIT

