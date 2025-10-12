# Vercel Build Configuration Guide
**Last Updated:** 2025-10-12  
**Status:** ✅ Current  
**Applies To:** All Next.js apps in Cortiware monorepo

---

## Table of Contents
1. [Critical Build-Time Dependency Policy](#critical-build-time-dependency-policy)
2. [Dual Prisma Schema Handling](#dual-prisma-schema-handling)
3. [Environment Variables](#environment-variables)
4. [Build Scripts Configuration](#build-scripts-configuration)
5. [Troubleshooting Common Issues](#troubleshooting-common-issues)
6. [Vercel Configuration Files](#vercel-configuration-files)

---

## Critical Build-Time Dependency Policy

### ⚠️ CRITICAL RULE: Type Packages MUST Be in `dependencies`

**ALL `@types/*` packages that are imported in source code MUST be in `dependencies`, not `devDependencies`.**

#### Why This Matters

Vercel production builds:
- ✅ Install `dependencies`
- ❌ Do NOT install `devDependencies`
- ✅ Run TypeScript compilation during build
- ❌ Fail if type declarations are missing

#### Common Mistakes

**❌ WRONG** (causes build failure):
```json
{
  "dependencies": {
    "qrcode": "^1.5.4",
    "pdfkit": "^0.17.2"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5",
    "@types/pdfkit": "^0.17.3"
  }
}
```

**✅ CORRECT** (builds successfully):
```json
{
  "dependencies": {
    "qrcode": "^1.5.4",
    "pdfkit": "^0.17.2",
    "@types/qrcode": "^1.5.5",
    "@types/pdfkit": "^0.17.3"
  }
}
```

#### Build-Time Dependencies Checklist

**MUST be in `dependencies`:**
- ✅ All `@types/*` packages imported in source code
- ✅ `autoprefixer` (PostCSS plugin used during build)
- ✅ `postcss` (CSS processing during build)
- ✅ `tailwindcss` (CSS framework compiled during build)
- ✅ `@prisma/client` (generated during build)
- ✅ `prisma` (CLI used in build script)

**Can be in `devDependencies`:**
- ✅ `typescript` (Vercel provides its own)
- ✅ `eslint` (only used for linting, not building)
- ✅ `@types/node` (Node.js types, provided by Vercel)
- ✅ `@types/react` (React types, provided by Vercel)

#### Historical Fixes

**Issue 1: Missing @types/qrcode** (Commit 7b89218af6)
- **Error**: `Type error: Could not find a declaration file for module 'qrcode'`
- **Fix**: Moved `@types/qrcode` from `devDependencies` → `dependencies`

**Issue 2: Missing @types/pdfkit** (Commit e8db8cb6db)
- **Error**: `Type error: Could not find a declaration file for module 'pdfkit'`
- **Fix**: Moved `@types/pdfkit` from `devDependencies` → `dependencies`

---

## Dual Prisma Schema Handling

### Architecture Overview

The Cortiware monorepo uses **TWO separate Prisma schemas**:

1. **Root Schema** (`prisma/schema.prisma`)
   - **Used by**: `tenant-app`
   - **Client**: `@prisma/client-tenant`
   - **Purpose**: Tenant-facing data (CRM, users, organizations)
   - **Generator**:
     ```prisma
     generator client {
       provider = "prisma-client-js"
       output   = "../node_modules/@prisma/client-tenant"
     }
     ```

2. **Provider Portal Schema** (`apps/provider-portal/prisma/schema.prisma`)
   - **Used by**: `provider-portal`
   - **Client**: `@prisma/client-provider`
   - **Purpose**: Provider-facing data (federation, monetization, developer keys)
   - **Generator**:
     ```prisma
     generator client {
       provider = "prisma-client-js"
       output   = "../../../node_modules/@prisma/client-provider"
     }
     ```

### Build Script Configuration

#### tenant-app Build Script

```json
{
  "scripts": {
    "build": "cd ../.. && node node_modules/prisma/build/index.js generate --schema=prisma/schema.prisma && node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma && cd apps/tenant-app && node ../../node_modules/next/dist/bin/next build"
  }
}
```

**Steps:**
1. Navigate to monorepo root (`cd ../..`)
2. Generate Prisma Client from root schema (`prisma generate --schema=prisma/schema.prisma`)
3. Deploy migrations (`prisma migrate deploy --schema=prisma/schema.prisma`)
4. Navigate back to app directory (`cd apps/tenant-app`)
5. Build Next.js app (`next build`)

#### provider-portal Build Script

```json
{
  "scripts": {
    "build": "node ../../node_modules/prisma/build/index.js generate && node ../../node_modules/prisma/build/index.js migrate deploy && node ../../node_modules/next/dist/bin/next build"
  }
}
```

**Steps:**
1. Generate Prisma Client from provider-portal schema (uses local `prisma/schema.prisma`)
2. Deploy migrations (`prisma migrate deploy`)
3. Build Next.js app (`next build`)

### Import Patterns

**In provider-portal:**
```typescript
import { prisma } from '@/lib/prisma';
// Uses @prisma/client-provider
```

**In tenant-app:**
```typescript
import { prisma } from '@/lib/prisma';
// Uses @prisma/client-tenant
```

**Prisma Client Initialization:**

`apps/provider-portal/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client-provider';
export const prisma = new PrismaClient();
```

`apps/tenant-app/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client-tenant';
export const prisma = new PrismaClient();
```

---

## Environment Variables

### Required for All Builds

**DATABASE_URL** (CRITICAL):
- **Purpose**: PostgreSQL connection string
- **Required**: YES - builds will fail without it
- **Availability**: ✅ Available during Vercel builds
- **Format**: `postgresql://user:password@host:port/database?schema=public`
- **Note**: Vercel provides this from project environment variables

### Optional Environment Variables

**Redis/KV (for rate limiting, caching):**
- `REDIS_URL` - Redis connection string
- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV REST API token

**Authentication:**
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - NextAuth.js URL

**External Services:**
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SENDGRID_API_KEY` - SendGrid API key

### Environment Variable Configuration

**In Vercel Dashboard:**
1. Navigate to Project Settings → Environment Variables
2. Add variables for all environments (Production, Preview, Development)
3. Ensure `DATABASE_URL` is set for Production and Preview
4. Redeploy after adding new variables

---

## Build Scripts Configuration

### vercel.json Configuration

**provider-portal** (`apps/provider-portal/vercel.json`):
```json
{
  "buildCommand": "cd ../.. && npm install && cd apps/provider-portal && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm install",
  "ignoreCommand": "npx turbo-ignore provider-portal",
  "crons": [
    {
      "path": "/api/cron/collect-metrics",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**tenant-app** (`apps/tenant-app/vercel.json`):
```json
{
  "buildCommand": "cd ../.. && npm install && cd apps/tenant-app && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm install",
  "ignoreCommand": "npx turbo-ignore tenant-app"
}
```

### Key Configuration Points

1. **buildCommand**: Navigates to monorepo root, installs dependencies, then runs app-specific build
2. **installCommand**: Installs dependencies from monorepo root (Turborepo requirement)
3. **ignoreCommand**: Uses `turbo-ignore` to skip builds when app hasn't changed
4. **outputDirectory**: `.next` (Next.js build output)

---

## Troubleshooting Common Issues

### Issue 1: "Missing script: vercel-build"

**Error:**
```
npm error Missing script: "vercel-build"
```

**Cause:**
`vercel.json` references `npm run vercel-build` but the script doesn't exist in `package.json`.

**Solution:**
Update `vercel.json` to call `npm run build` instead:
```json
{
  "buildCommand": "cd ../.. && npm install && cd apps/provider-portal && npm run build"
}
```

**Reference:** Commit fc00792078

### Issue 2: "Could not find a declaration file for module 'X'"

**Error:**
```
Type error: Could not find a declaration file for module 'qrcode'.
Try 'npm i --save-dev @types/qrcode' if it exists
```

**Cause:**
`@types/X` package is in `devDependencies` but needs to be in `dependencies` for Vercel builds.

**Solution:**
Move the `@types/*` package to `dependencies`:
```bash
# In package.json, move from devDependencies to dependencies
```

**Reference:** Commits 7b89218af6, e8db8cb6db

### Issue 3: Prisma Client Not Generated

**Error:**
```
Error: Cannot find module '@prisma/client-provider'
```

**Cause:**
Prisma Client not generated during build, or wrong schema used.

**Solution:**
Ensure build script includes `prisma generate`:
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Issue 4: DATABASE_URL Not Available

**Error:**
```
Error: Environment variable not found: DATABASE_URL
```

**Cause:**
`DATABASE_URL` not set in Vercel environment variables.

**Solution:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `DATABASE_URL` with PostgreSQL connection string
3. Set for Production and Preview environments
4. Redeploy

### Issue 5: Monorepo Dependencies Not Found

**Error:**
```
Error: Cannot find module '@cortiware/themes'
```

**Cause:**
Vercel not installing monorepo dependencies correctly.

**Solution:**
Ensure `vercel.json` has correct `installCommand`:
```json
{
  "installCommand": "cd ../.. && npm install"
}
```

This installs dependencies from monorepo root, making all packages available.

---

## Vercel Configuration Files

### Required Files

1. **`vercel.json`** (in each app directory)
   - Build configuration
   - Install command
   - Ignore command
   - Cron jobs (if applicable)

2. **`package.json`** (in each app directory)
   - Build script with Prisma steps
   - Dependencies (including build-time deps)
   - Dev dependencies (linting, testing only)

3. **`.vercelignore`** (optional)
   - Files to exclude from deployment
   - Similar to `.gitignore`

### Vercel Project Settings

**Framework Preset:** Next.js  
**Build Command:** Uses `buildCommand` from `vercel.json`  
**Output Directory:** `.next`  
**Install Command:** Uses `installCommand` from `vercel.json`  
**Root Directory:** App directory (e.g., `apps/provider-portal`)

---

## Additional Resources

- **AI Agent Reference**: `docs/AI_AGENT_REFERENCE.md` - Build system rules and common mistakes
- **Architecture Overview**: `docs/ARCHITECTURE_OVERVIEW.md` - System architecture and data layer
- **Documentation Audit**: `docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md` - Current system state

---

## Quick Reference Checklist

**Before Pushing to Vercel:**
- [ ] All `@types/*` packages in `dependencies` (not `devDependencies`)
- [ ] Build script includes `prisma generate` and `prisma migrate deploy`
- [ ] `vercel.json` has correct `buildCommand` and `installCommand`
- [ ] `DATABASE_URL` set in Vercel environment variables
- [ ] TypeCheck passes locally (`npm run typecheck`)
- [ ] Lint passes locally (`npm run lint`)
- [ ] No uncommitted changes

**After Vercel Deployment:**
- [ ] Check deployment status in Vercel dashboard
- [ ] Review build logs for errors or warnings
- [ ] Verify deployment URL loads correctly
- [ ] Check Vercel function logs for runtime errors
- [ ] Confirm Prisma migrations ran successfully

---

**END OF VERCEL BUILD GUIDE**

