# Phase 1 Patterns — Canonical API Templates (Provider + Tenant)

This document captures copy-pasteable, code-accurate patterns from the existing codebase to standardize all Phase 1 scaffolds.

Important guardrails

- Do not mix systems: Provider/Developer/Accountant vs Tenant are completely separate (auth, cookies, DB, UI).
- Prisma clients: tenant-app uses @prisma/client-tenant via `@/lib/prisma`; provider-portal uses its own schema/client.
- Error handling: Tenant routes must use `createSafeErrorResponse`; Provider routes use `createSuccessResponse` and friends or `jsonOk/jsonError` primitives.
- Mutations on provider routes must require `Idempotency-Key`.
- Rate limits: Use presets via `withRateLimit('api' | 'auth' | 'analytics')` as needed.
- File placement: Next.js 15 App Router. API routes live under `app/api/.../route.ts`. Child params use `[id]` folders.

---

## Provider API routes

Key imports

- `compose`, `withProviderAuth`, `withAuditLog`, `withIdempotencyRequired`, `withRateLimit` from `@/lib/api/middleware`
- Response utils: `createSuccessResponse`, `createErrorResponse`, `createValidationError`, `createNotFoundError`, `handleAsyncRoute`, `parseRequestBody`, `validateRequiredFields` from `@/lib/utils/api-response.utils`
- Optionally `jsonOk/jsonError` from `@/lib/api/response` for low-level responses

Wrapper order

- Use `compose(withProviderAuth(), optional wrappers..., withAuditLog())(handler)`.
- `compose` applies right-to-left; listing `withAuditLog()` last means it runs first, matching current scaffolds.

GET template

```ts
import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withRateLimit,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  createErrorResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

const getHandler = handleAsyncRoute(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : 50;
  // PLACEHOLDER_block_phase2: Query provider DB/service
  return createSuccessResponse({
    items: [],
    meta: { cursor, limit, total: 0 },
  });
}, "Failed to fetch resource");

export const GET = compose(
  withProviderAuth(),
  withRateLimit("api"),
  withAuditLog(),
)(getHandler);
```

POST template (idempotent)

```ts
import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withIdempotencyRequired,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  createValidationError,
  handleAsyncRoute,
  parseRequestBody,
  validateRequiredFields,
} from "@/lib/utils/api-response.utils";

const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Replace with Zod validation
  validateRequiredFields(body, ["name"]);
  // PLACEHOLDER_block_phase2: Insert create logic
  return createSuccessResponse({ id: "PLACEHOLDER_id" }, "Created", 201);
}, "Failed to create");

export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(postHandler);
```

PUT/PATCH/DELETE templates

```ts
import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withIdempotencyRequired,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  createNotFoundError,
  handleAsyncRoute,
  parseRequestBody,
} from "@/lib/utils/api-response.utils";

const putHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Update logic
  return createSuccessResponse({ updated: true });
}, "Failed to update");

const deleteHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Delete logic; return 404 via createNotFoundError() when applicable
  return createSuccessResponse({ deleted: true });
}, "Failed to delete");

export const PUT = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(putHandler);
export const PATCH = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(putHandler);
export const DELETE = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(deleteHandler);
```

Special cases

- Analytics/high-volume: add `withRateLimit('analytics')`.
- Auth endpoints: use `withRateLimit('auth')`.
- Machine-to-provider calls: use `withHmacAuth()` when verifying HMAC signatures.

---

## Tenant API routes

Key imports

- `NextRequest`, `NextResponse` from `next/server`
- `z` from `zod`
- `prisma` from `@/lib/prisma` (this is `@prisma/client-tenant` under the hood)
- `getAuthContext` from `@/lib/auth-context`
- `createSafeErrorResponse` from `@/lib/error-handler`

General rules

- Always gate by `auth.isAuthenticated` and `auth.orgId`.
- Scope Prisma queries by `orgId` directly or via relations.
- Validate inputs with Zod and return 400 on `ZodError`.
- Never leak raw errors; use `createSafeErrorResponse(error, context)`.

GET list template

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const listSchema = z.object({
  q: z.string().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = listSchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { q, cursor, limit } = parsed.data;
    const where: any = {
      /* org scoping via relation or direct orgId */
    };

    // PLACEHOLDER_block_phase2: Add query filters from q

    const rows = await prisma.someModel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: (limit ?? 50) + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true /* ...fields */ },
    });

    const hasMore = rows.length > (limit ?? 50);
    const items = hasMore ? rows.slice(0, -1) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      ok: true,
      items,
      nextCursor,
      hasMore,
      total: items.length,
    });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/resource");
  }
}
```

POST create template

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const createSchema = z.object({
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // PLACEHOLDER_block_phase2: Additional business rules

    const record = await prisma.someModel.create({
      data: { ...parsed.data, orgId: auth.orgId },
      select: { id: true /* ... */ },
    });

    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return createSafeErrorResponse(error, "POST /api/resource");
  }
}
```

[id] detail templates (GET/PATCH/DELETE)

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const updateSchema = z
  .object({
    /* fields */
  })
  .partial();

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const row = await prisma.someModel.findFirst({
      where: { id: params.id, orgId: auth.orgId },
      select: { id: true /* ... */ },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, record: row });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/resource/[id]");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const exists = await prisma.someModel.findFirst({
      where: { id: params.id, orgId: auth.orgId },
      select: { id: true },
    });
    if (!exists)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.someModel.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true },
    });
    return NextResponse.json({ ok: true, record: updated });
  } catch (error) {
    return createSafeErrorResponse(error, "PATCH /api/resource/[id]");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exists = await prisma.someModel.findFirst({
      where: { id: params.id, orgId: auth.orgId },
      select: { id: true },
    });
    if (!exists)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.someModel.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    return createSafeErrorResponse(error, "DELETE /api/resource/[id]");
  }
}
```

---

## Rate limiting and idempotency quick reference

- Use `withRateLimit('api')` for general provider APIs; `withRateLimit('analytics')` for high-volume endpoints; `withRateLimit('auth')` for login/OIDC.
- Require `Idempotency-Key` header for all provider POST/PUT/PATCH/DELETE via `withIdempotencyRequired()`.

## Federation/HMAC

- For machine-to-provider requests, protect routes with `withHmacAuth()`; verify signatures using shared HMAC secret. See `@/lib/hmac/with-hmac-auth`.

## Build-time data fetch guards (server components)

- Not for API routes, but required for async server components that fetch data. Wrap Prisma calls in try/catch and return empty defaults if DB is unavailable during build.

```ts
export default async function SomePage() {
  let data: DataType = emptyDefaults;
  try { data = await fetchFromPrisma(); }
  catch { console.log('PageName: Database not available during build, using empty data'); }
  return <ClientComponent initialData={data} />;
}
```

## File naming and placement

- API route: `apps/<app>/src/app/api/<segments>/route.ts`
- Detail route: `apps/<app>/src/app/api/<segments>/[id]/route.ts`
- Client components: include `'use client'` directive at top.

## Quality gates checklist for scaffolds

- No actionable placeholders in `/apps` or `/packages` (use `PLACEHOLDER_block_phase2` for deferred logic).
- Typecheck and lint should pass after adding scaffolds.
- Provider mutating routes composed with `withIdempotencyRequired()`.
- Tenant routes use `createSafeErrorResponse` and scope queries by `orgId`.
