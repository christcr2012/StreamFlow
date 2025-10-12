# @cortiware/config

Shared configuration files for Tailwind CSS and TypeScript across the Cortiware monorepo.

## Overview

This package provides centralized configuration presets that can be extended by apps and packages:
- **Tailwind CSS**: Base Tailwind configuration with design tokens
- **TypeScript**: Base TypeScript compiler options

Benefits:
- Consistent configuration across all apps
- Single source of truth for design tokens
- Easy updates to all apps simultaneously
- Reduced configuration duplication

## Installation

This is an internal package in the Cortiware monorepo.

```json
{
  "devDependencies": {
    "@cortiware/config": "file:../../packages/config"
  }
}
```

## Tailwind CSS Configuration

### Usage in Apps

```javascript
// apps/my-app/tailwind.config.js
const baseConfig = require('@cortiware/config/tailwind');

module.exports = {
  ...baseConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui-components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // App-specific overrides
      colors: {
        brand: '#0070f3',
      },
    },
  },
  plugins: [
    ...baseConfig.plugins,
    // App-specific plugins
    require('daisyui'),
  ],
};
```

### Base Configuration

The base Tailwind config provides:
- Design token placeholders (to be extended)
- Empty content array (apps must specify their own)
- No plugins by default (apps add as needed)

```javascript
// packages/config/tailwind.config.js
module.exports = {
  content: [],
  theme: {
    extend: {
      // Design tokens extracted from theme.css
      // Apps can import this preset and override as needed
    },
  },
  plugins: [],
};
```

### Extending with Design Tokens

Apps can extend the base config with design tokens from `@cortiware/themes`:

```javascript
const baseConfig = require('@cortiware/config/tailwind');

module.exports = {
  ...baseConfig,
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

## TypeScript Configuration

### Usage in Apps

```json
{
  "extends": "@cortiware/config/typescript",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Base Configuration

The base TypeScript config (`tsconfig.base.json`) provides:
- Strict type checking
- Modern JavaScript features
- React JSX support
- Module resolution settings

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  }
}
```

### Extending for Packages

```json
{
  "extends": "@cortiware/config/typescript",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Package Exports

The package exports configurations via named paths:

```json
{
  "exports": {
    "./tailwind": "./tailwind.config.js",
    "./typescript": "./tsconfig.base.json"
  }
}
```

### Import Examples

```javascript
// Tailwind config
const baseConfig = require('@cortiware/config/tailwind');

// TypeScript config (in tsconfig.json)
{
  "extends": "@cortiware/config/typescript"
}
```

## Best Practices

### Tailwind CSS

1. **Always specify content paths** - The base config has an empty content array
2. **Extend, don't replace** - Use spread operator to preserve base config
3. **Add app-specific plugins** - Base config has no plugins
4. **Use CSS variables** - Reference design tokens from `@cortiware/themes`
5. **Include shared packages** - Add `../../packages/ui/**/*.{js,ts,jsx,tsx}` to content

### TypeScript

1. **Extend the base** - Don't copy/paste the entire config
2. **Set baseUrl and paths** - For app-specific module resolution
3. **Include type definitions** - Add `next-env.d.ts` for Next.js apps
4. **Exclude build outputs** - Add `dist`, `.next`, `out` to exclude

## Common Patterns

### Next.js App Configuration

```javascript
// tailwind.config.js
const baseConfig = require('@cortiware/config/tailwind');

module.exports = {
  ...baseConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      ...baseConfig.theme.extend,
    },
  },
  plugins: [require('daisyui')],
};
```

```json
// tsconfig.json
{
  "extends": "@cortiware/config/typescript",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Package Configuration

```json
// tsconfig.json
{
  "extends": "@cortiware/config/typescript",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Updating Shared Configuration

To update configuration for all apps:

1. Edit `packages/config/tailwind.config.js` or `tsconfig.base.json`
2. Changes automatically apply to all apps that extend the base config
3. Apps can still override specific settings as needed

Example: Adding a new design token

```javascript
// packages/config/tailwind.config.js
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... more shades
        },
      },
    },
  },
  plugins: [],
};
```

All apps extending this config will now have access to `brand-50`, `brand-100`, etc.

## Related Packages

- `@cortiware/themes`: Shared CSS themes and design tokens
- `@cortiware/ui`: Shared UI components
- `@cortiware/ui-components`: Feature-specific UI components

## Documentation

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): System architecture

## License

MIT

