# Cortiware AI Agent Instructions

## Project Overview

Cortiware is an AI-powered multi-tenant service business platform built as a Turborepo monorepo. It features **four completely separate applications** (tenant-app, provider-portal, and 2 marketing sites), each with isolated authentication, databases, and navigation systems.

**Critical Architecture Rule**: Provider, Developer, Accountant, and Client (tenant) systems are **COMPLETELY SEPARATE**. Never mix authentication cookies, database schemas, or UI components between these systems.

## Monorepo Structure

```
apps/
├── tenant-app/          # Client SaaS (port 3000) - Prisma schema at root
├── provider-portal/     # Provider admin (port 3001) - Separate Prisma schema
├── marketing-cortiware/ # Marketing site (port 3002)
└── marketing-robinson/  # Marketing site (port 3003)
packages/
├── auth-service/        # Shared auth utilities (re-exported by apps)
├── db/                  # Shared DB utilities (tenant schema)
├── verticals/           # Industry-specific packs (18 verticals)
├── themes/              # CSS custom properties theme system
├── kv/                  # Redis/Vercel KV wrapper
├── wallet/              # Settlement & billing
└── ui-components/       # Shared React components
```

## Dual-Database Architecture

**Two Prisma schemas, two databases**:

1. **Tenant schema**: `prisma/schema.prisma` → `@prisma/client-tenant` (95 models)
2. **Provider schema**: `apps/provider-portal/prisma/schema.prisma` → `@prisma/client-provider`

**Generate both clients**: `npm run prisma:generate` (runs both schemas sequentially)

## Authentication Systems (4 Separate Systems)

| System        | Cookie                              | Storage                 | Routes            | Layout Component        |
| ------------- | ----------------------------------- | ----------------------- | ----------------- | ----------------------- |
| Client Tenant | `mv_user`                           | PostgreSQL `User` table | `/(app)/*`        | `AppShellClient`        |
| Provider      | `provider-session` or `ws_provider` | Environment variables   | `/(provider)/*`   | `ProviderShellClient`   |
| Developer     | `developer-session`                 | Environment variables   | `/(developer)/*`  | `DeveloperShellClient`  |
| Accountant    | `accountant-session`                | Environment variables   | `/(accountant)/*` | `AccountantShellClient` |

**Never use `useMe()` or RBAC in provider/developer/accountant pages** - these are client-only constructs.

## API Route Patterns

### Tenant API Routes

```typescript
// apps/tenant-app/src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma"; // Uses @prisma/client-tenant
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const createSchema = z.object({
  /* ... */
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    const record = await prisma.resource.create({
      data: { ...validated, orgId: auth.orgId },
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    return createSafeErrorResponse(error, "POST /api/resource");
  }
}
```

### Provider API Routes

```typescript
// apps/provider-portal/src/app/api/provider/[resource]/route.ts
import { getProviderSession } from "@cortiware/auth-service";

export async function GET(req: NextRequest) {
  const session = getProviderSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Provider has cross-tenant access, NO orgId scoping
}
```

## Build-Time Data Fetch Guards

**Required for all async server components** that fetch data. Allows local builds without DATABASE_URL.

```typescript
export default async function SomePage() {
  let data: DataType = emptyDefaults;

  try {
    data = await fetchFromPrisma();
  } catch (error) {
    console.log('PageName: Database not available during build, using empty data');
  }

  return <ClientComponent initialData={data} />;
}
```

See `BUILD_TIME_DATA_FETCH_GUARDS.md` for complete rationale.

## Critical Conventions

### Package Manager

- **Use `npm` (not pnpm)** for all commands
- Scripts: `npm run dev`, `npm run build`, `npm run test`

### Turborepo Commands

```powershell
npm run dev              # All apps in parallel
npm run build            # Build all apps
npm run typecheck        # TypeScript check across monorepo
npm run lint             # Lint all apps
npm run prisma:generate  # Generate both Prisma clients
npm run test:e2e:playwright  # Run Playwright E2E tests
```

### Placeholder Policy

- **Format**: `PLACEHOLDER_block_[service]` for actionable items
- **Gate**: CI fails if actionable placeholders remain in `/apps` or `/packages` (docs are exempt)
- **Check**: `npm run ci:placeholders`

### Error Handling

- **Always use** `createSafeErrorResponse(error, context)` in API routes (never expose raw errors)
- **Zod validation**: Use `z.ZodError` checks for 400 responses

### File Naming (Next.js 15 App Router)

- API routes: `route.ts`
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Client components: Mark with `'use client'` directive

## Testing Patterns

### Playwright E2E

```typescript
// tests/e2e-playwright/tenant-app/feature.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should perform action", async ({ page }) => {
    await page.goto("/feature");
    await expect(page.locator("h1")).toContainText("Expected");
  });
});
```

Run: `npm run test:e2e:playwright` or `npm run test:e2e:tenant`

## Vertical-Specific Features

18 supported verticals in `@cortiware/verticals`:

- **Waste**: Rolloff, Port-a-John
- **Home Services**: Cleaning, HVAC, Plumbing, Electrical, Painting, Pest Control
- **Outdoor**: Landscaping, Pressure Washing, Snow Removal, Fencing
- **Specialty**: Roofing, Concrete Lifting, Appliance Rental, Auto Detail

**Usage**: `import { estimate } from '@cortiware/verticals'; const result = estimate('cleaning', inputs);`

## Theme System

**Always import `globals.css` in root layout**, never import `theme.css` directly:

```typescript
// app/layout.tsx
import "@cortiware/themes/globals.css";
```

Themes use CSS custom properties: `var(--background)`, `var(--primary)`, `var(--foreground)`, etc.

## Deployment (Vercel)

Each app is a separate Vercel project:

1. **tenant-app** → Uses root `prisma/schema.prisma`
2. **provider-portal** → Uses `apps/provider-portal/prisma/schema.prisma`
3. Both use `npm run vercel-build` (root script)
4. Migrations run automatically if `DATABASE_URL` is present (see `scripts/run-migrations-if-configured.js`)

## Environment Variables

Critical vars (see `turbo.json` globalEnv):

- `DATABASE_URL` - Tenant database (Neon pooled)
- `PROVIDER_DATABASE_URL` - Provider database
- `AUTH_TICKET_HMAC_SECRET` - Nonce store HMAC
- `TENANT_COOKIE_SECRET` - Session encryption
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `KV_*` or `VERCEL_KV_*` - Redis for nonce store

## Phase-Based Development Workflow

**This project uses an automated Phase 0-3 workflow**. See `docs/PHASE_AUTOMATION_WORKFLOW.md` for complete guide.

### Quick Workflow Overview

```powershell
# 1. Check current placeholder status
npm run ci:placeholders

# 2. Review priorities
cat PHASE_2_STUB_AUDIT.md

# 3. Implement a vertical slice (API + Frontend + Tests)
# 4. Verify quality gates
npm run typecheck && npm run lint && npm run test

# 5. Push and let CI validate
git push
```

### Common Workflows

#### Adding a New API Endpoint

1. Create `apps/tenant-app/src/app/api/[resource]/route.ts`
2. Add Zod schema for input validation
3. Use `getAuthContext()` for auth
4. Scope to `auth.orgId`
5. Add `createSafeErrorResponse` for errors
6. Add E2E test in `tests/e2e-playwright/tenant-app/`

#### Adding a New Prisma Model

1. Edit `prisma/schema.prisma` (or provider schema)
2. Run `npx prisma migrate dev --name describe_change`
3. Run `npm run prisma:generate`
4. Verify with `npm run build`

#### Implementing a Stub API (Phase 2)

1. Check `PHASE_2_STUB_AUDIT.md` for migration tasks
2. Replace placeholder logic with real Prisma queries
3. Add input validation (Zod)
4. Remove any "Phase 1 stub" comments
5. Add tests
6. Verify: `npm run ci:placeholders` (count should decrease)

## Migration From Pages Router

This project uses **Next.js 15 App Router exclusively**. Legacy patterns:

- ❌ `getServerSideProps` → ✅ Async server components
- ❌ `pages/api/` → ✅ `app/api/*/route.ts`
- ❌ `AppShell` (old) → ✅ Route group layouts `(app)/layout.tsx`

## Key References

- **Phase Workflow**: `docs/PHASE_AUTOMATION_WORKFLOW.md` - **READ THIS FIRST** for development workflow
- **Architecture**: `ARCHITECTURE_SEPARATION.md`, `COPILOT_OPERATING_PROCEDURE.md`
- **Build Guards**: `BUILD_TIME_DATA_FETCH_GUARDS.md`
- **Stub Audit**: `PHASE_2_STUB_AUDIT.md` - Current implementation priorities
- **Schema Audit**: `PRISMA_SCHEMA_AUDIT.md`
- **Deployment**: `README_DEPLOYMENT.md`
- **Agent Handoff**: `AGENT_HANDOFF_PROMPT.md` - For session continuation

## Known Issues & Patterns

1. **Prisma client imports**: `apps/tenant-app` uses `@prisma/client-tenant`, provider-portal uses default client
2. **Auth re-exports**: `apps/tenant-app/src/lib/auth-context.ts` re-exports from `@cortiware/auth-service` for backward compatibility
3. **Build logs**: Prisma errors during local build are cosmetic if guards are in place - build succeeds with empty data
4. **Federation**: Provider can make M2M calls to tenant APIs using HMAC-signed requests (see `providerFederationVerify.ts`)

---

**When in doubt**: Check existing patterns in `apps/tenant-app/src/app/api/v2/leads/route.ts` (canonical example) or read `COPILOT_OPERATING_PROCEDURE.md`.
