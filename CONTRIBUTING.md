# Contributing to Cortiware

Thank you for contributing to Cortiware! This guide will help you understand our development workflow, coding standards, and best practices.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Build-Time Data Fetching](#build-time-data-fetching)
- [Placeholder Policy](#placeholder-policy)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.17+ or v20+ (latest LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **PostgreSQL**: Access to Neon Postgres or local PostgreSQL instance
- **Vercel KV**: (Optional) For Redis-based features; falls back to in-memory

### Initial Setup

```powershell
# Clone the repository
git clone https://github.com/your-org/cortiware.git
cd cortiware

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma clients
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed

# Start development servers
npm run dev
```

## 🔄 Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **feature/**: New features (`feature/add-notifications`)
- **fix/**: Bug fixes (`fix/auth-redirect-loop`)
- **docs/**: Documentation updates (`docs/update-api-reference`)
- **refactor/**: Code refactoring (`refactor/extract-auth-service`)

### Daily Development

```powershell
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes...

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm run test

# Check placeholder gate
npm run ci:placeholders

# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## 📝 Coding Standards

### TypeScript

- **Strict mode enabled**: All code must pass `npm run typecheck`
- **Explicit types**: Avoid `any`; use proper type annotations
- **Type imports**: Use `import type { ... }` for type-only imports
- **Consistent naming**:
  - `PascalCase` for types, interfaces, components
  - `camelCase` for functions, variables
  - `SCREAMING_SNAKE_CASE` for constants

### React Server Components

- **Default to Server Components**: Use `"use client"` only when needed
- **Async Server Components**: Allowed in Next.js 15
- **Client boundaries**: Keep `"use client"` boundaries as low as possible

### File Organization

```
app/
├── (route-group)/          # Route groups with shared layouts
├── api/                    # API routes
│   └── endpoint/
│       └── route.ts        # GET, POST, etc. exports
├── components/             # Shared components
└── page.tsx                # Page components

lib/
├── services/               # Business logic
├── utils/                  # Pure utility functions
└── types/                  # Shared TypeScript types
```

### Import Order

```typescript
// 1. External dependencies
import { ReactNode } from "react";
import { PrismaClient } from "@prisma/client-tenant";

// 2. Internal packages
import { getRedis } from "@cortiware/kv";
import { Button } from "@cortiware/ui";

// 3. Local imports (aliased)
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/lib/types";

// 4. Relative imports
import { MyComponent } from "./MyComponent";
```

## 🔐 Build-Time Data Fetching

### The Problem

Local builds lack `DATABASE_URL`, causing Prisma to fail during Static Site Generation (SSG). Vercel builds have env vars from project settings.

### The Solution: Build-Time Guards

Always wrap async server components that fetch data:

```typescript
import { prisma } from '@cortiware/db';
import { ClientComponent } from './ClientComponent';

export default async function MyPage() {
  // Initialize with empty defaults
  let data: MyDataType[] = [];

  try {
    // Attempt data fetch
    data = await prisma.myTable.findMany();
  } catch (error) {
    // Graceful fallback for build-time
    console.log('MyPage: Database not available during build, using empty data');
  }

  return <ClientComponent initialData={data} />;
}
```

### Guard Pattern Checklist

✅ **Do:**

- Initialize with typed empty defaults
- Use try/catch around all Prisma calls
- Log descriptive messages (not errors)
- Return components with empty data

❌ **Don't:**

- Throw errors on missing data
- Use console.error (creates noise)
- Skip type annotations on defaults
- Access env vars without guards

**See**: [BUILD_TIME_DATA_FETCH_GUARDS.md](BUILD_TIME_DATA_FETCH_GUARDS.md) for comprehensive guide.

## 📌 Placeholder Policy

### Placeholder Format

Use this format for unimplemented features blocked by external services:

```typescript
// ✅ Good: Blocked by external service
// PLACEHOLDER_block_[service] Description of what's needed

// Example:
// PLACEHOLDER_block_twilio SMS verification needs Twilio API credentials

// ❌ Bad: Actionable placeholders (should be implemented)
// TODO: Add error handling
// FIXME: This doesn't work
```

### Placeholder Gate

All commits must pass the placeholder gate:

```powershell
npm run ci:placeholders
```

- **Target**: 0 actionable placeholders
- **Allowed**: Placeholders blocked by `[service]`, `[external]`, `[production]`
- **CI/CD**: Automated checks on every push

### When to Use Placeholders

✅ **Use placeholders for:**

- Features requiring external services (Twilio, SendGrid, Stripe)
- Production-only infrastructure (monitoring, logging services)
- Third-party integrations pending client setup

❌ **Don't use placeholders for:**

- Missing error handling (implement it)
- Incomplete business logic (finish it)
- Missing tests (write them)
- Type errors (fix them)

## 🧪 Testing Requirements

### Type Checking (Required)

All code must pass type checking:

```powershell
npm run typecheck
```

### Linting (Required)

All code must pass linting:

```powershell
npm run lint

# Auto-fix when possible
npm run lint:fix
```

### Unit Tests (Recommended)

Add tests for:

- Business logic in `lib/services/`
- Utility functions in `lib/utils/`
- Complex components with logic

```powershell
npm run test
```

### E2E Tests (For Critical Flows)

Playwright tests for:

- Authentication flows
- Critical user journeys
- Federation endpoints
- Payment processing

```powershell
npm run test:e2e
```

## 📝 Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring (no behavior change)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, tooling, dependencies
- `style`: Code style changes (formatting, whitespace)
- `ci`: CI/CD configuration changes

### Examples

```
feat(auth): add TOTP 2FA support

Implement time-based one-time password authentication:
- Generate QR codes for authenticator apps
- Verify 6-digit codes with 30-second window
- Store TOTP secrets encrypted in database
- Add backup recovery codes

Closes #123
```

```
fix(provider): resolve build-time data fetch errors

Add try/catch guards to server components that fetch data
at build time. Local builds now succeed without DATABASE_URL.

See BUILD_TIME_DATA_FETCH_GUARDS.md for implementation pattern.
```

```
docs: update API reference with pagination examples

Add examples showing cursor-based pagination for:
- Leads endpoint
- Organizations endpoint
- Opportunities endpoint
```

## 🔀 Pull Request Process

### Before Creating PR

1. **Type check**: `npm run typecheck`
2. **Lint**: `npm run lint`
3. **Test**: `npm run test`
4. **Placeholder gate**: `npm run ci:placeholders`
5. **Build**: `npm run build` (for affected apps)

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Tests added/updated
- [ ] Placeholder gate passes (0 actionable)
- [ ] Documentation updated (if needed)
- [ ] Build-time guards added (if async server components)
- [ ] Commit messages follow conventions

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe testing performed

## Screenshots (if UI changes)

Before/After screenshots

## Checklist

- [ ] Type checking passes
- [ ] Linting passes
- [ ] Tests pass
- [ ] Placeholder gate passes
- [ ] Documentation updated
- [ ] Build-time guards added (if applicable)
```

### Review Process

1. **Automated checks**: CI/CD runs type checking, linting, tests, placeholder gate
2. **Code review**: At least one approval required
3. **Merge**: Squash and merge preferred for clean history

## 🐛 Debugging

### Common Issues

#### TypeScript Errors

```powershell
# Check all errors
npm run typecheck

# Fix in specific package
npm run typecheck --workspace=tenant-app
```

#### Prisma Errors

```powershell
# Regenerate clients
npm run db:generate

# Reset database (dev only!)
npm run db:push --force-reset

# Check migration status
npx prisma migrate status
```

#### Build Failures

```powershell
# Clean build artifacts
rm -rf .next
rm -rf .turbo

# Rebuild
npm run build
```

#### Environment Variables

```powershell
# Verify env vars are loaded
npm run dev

# Check specific app
npm run dev --workspace=tenant-app
```

## 📚 Additional Resources

- **[Architecture Documentation](docs/ARCH_MONOREPO.md)**: Monorepo structure
- **[API Reference](docs/API_REFERENCE.md)**: Complete API documentation
- **[Build & Deploy Guide](docs/BUILD_AND_DEPLOY_GUIDE.md)**: Deployment instructions
- **[AI Agent Reference](docs/AI_AGENT_REFERENCE.md)**: Context for AI agents

## 🤝 Getting Help

- **Documentation**: Check [docs/](docs/) first
- **Issues**: Search existing issues or create new one
- **AI Agents**: See [docs/AI_AGENT_REFERENCE.md](docs/AI_AGENT_REFERENCE.md) for system context

---

**Thank you for contributing to Cortiware!** 🎉
