# Build and Deploy Guide

This repo uses a monorepo with Next.js apps (provider-portal, tenant-app) and dual Prisma clients.
This guide explains how builds, Prisma generation, and migrations work locally, in CI, and on Vercel—so any coding agent can follow the contract.

## TL;DR contracts

- Local build (dev machine):
  - Do not run migrations during `npm run build`.
  - Prisma generate must run for both schemas before building apps.
  - DATABASE_URL may be missing at build time; code must not parse it during build.

- Vercel build:
  - `vercel.json` runs the root `vercel-build` script.
  - `vercel-build` optionally runs migrations if and only if RUN_DB_MIGRATIONS=true and both DATABASE_URL and DIRECT_DATABASE_URL are present.
  - Always runs Prisma generate for tenant and provider clients before Turbo build.

- CI:
  - CI workflows generate both Prisma clients explicitly.
  - Migrations may run in CI or externally, not implicitly via app builds.

## Prisma clients

We maintain two Prisma clients:

- Tenant schema: `prisma/schema.prisma` → `@prisma/client-tenant`
- Provider schema: `apps/provider-portal/prisma/schema.prisma` → `@prisma/client-provider`

Generation is wired in:

- Root script: `npm run prisma:generate` (generates tenant + provider clients)
- App builds also invoke generation so apps compile on Vercel and locally.

## Guarded migrations

Script: `scripts/run-migrations-if-configured.js`

- Runs `prisma migrate deploy` for both schemas in order: tenant → provider.
- Only executes when:
  - `RUN_DB_MIGRATIONS=true`, and
  - `DATABASE_URL` and `DIRECT_DATABASE_URL` are set.
- Otherwise, the script logs and exits successfully, avoiding build failures.

Root build pipeline on Vercel:

- `vercel-build` (from `package.json`):
  1. `node scripts/run-migrations-if-configured.js`
  2. `npm run prisma:generate`
  3. `turbo run build`

## Safe env handling at build time

To prevent build-time crashes when `DATABASE_URL` is unset (common in local builds or certain Vercel phases):

- `apps/provider-portal/src/lib/prisma.ts` defers URL parsing unless `DATABASE_URL` is present. It conditionally sets `datasources.db.url` only when available, allowing Prisma to read env at runtime.
- This avoids `new URL("")` errors during Next.js compilation.
- **Server components that fetch data at build-time:** All async page components wrap Prisma calls in try/catch to return empty data when DATABASE_URL is missing. See `BUILD_TIME_DATA_FETCH_GUARDS.md` for implementation details.

## Where to change things

- Add or adjust migration behavior: `scripts/run-migrations-if-configured.js`
- Prisma client creation (provider): `apps/provider-portal/src/lib/prisma.ts`
- Prisma client creation (tenant): `apps/tenant-app/src/lib/prisma.ts`
- Root build wiring: `package.json` → `vercel-build` scripts
- Vercel entry: `vercel.json` → `buildCommand: "npm run vercel-build"`

## Typical flows

- Local developer:
  - `npm run dev` for dev servers.
  - `npm run build` to ensure compile.
  - `npm run prisma:migrate:tenant` / `npm run prisma:migrate:provider` to evolve schemas.

- CI:
  - Generate clients and run typecheck/lint/tests.
  - Optional: run migrations in a migration job against preview DBs.

- Vercel:
  - Uses `vercel-build`. If you need migrations to run during Vercel deploy, set `RUN_DB_MIGRATIONS=true` and provide `DATABASE_URL` + `DIRECT_DATABASE_URL` in project env vars.

## Notes for future agents

- Do not insert unconditional migration steps into app `build` scripts—this breaks local builds and PR previews.
- When touching Prisma URL logic, keep the "don’t parse empty URLs during build" constraint in mind.
- If adding more apps/schemas, mirror the pattern: generation in `prisma:generate`, guarded `migrate deploy` in the script, and avoid env-dependent logic in import-time code.
