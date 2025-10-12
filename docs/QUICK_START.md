# Cortiware Quick Start Guide
**Last Updated:** 2025-10-12  
**Estimated Time:** 30 minutes  
**Prerequisites:** Node.js 22.x, PostgreSQL, Git

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Clone and Install](#clone-and-install)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Local Development](#local-development)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

**Node.js 22.x** (REQUIRED):
```bash
node --version
# Should output: v22.x.x
```

**PostgreSQL** (REQUIRED):
- Version: 14+ recommended
- Connection string format: `postgresql://user:password@host:port/database?schema=public`

**Git** (REQUIRED):
```bash
git --version
# Should output: git version 2.x.x
```

### Optional Software

**Redis** (Optional - for rate limiting and caching):
- Version: 6+ recommended
- Connection string format: `redis://host:port`

**Vercel CLI** (Optional - for deployment testing):
```bash
npm install -g vercel
```

---

## Clone and Install

### 1. Clone Repository

```bash
git clone https://github.com/christcr2012/Cortiware.git
cd Cortiware
```

### 2. Install Dependencies

**From monorepo root:**
```bash
npm install
```

This will:
- Install all dependencies for all apps and packages
- Set up Turborepo workspace
- Install Husky git hooks
- Prepare Prisma clients

**Expected output:**
```
added 1500+ packages in 30s
```

### 3. Verify Installation

```bash
npm run typecheck
```

**Expected output:**
```
✓ All packages typecheck passed
```

---

## Environment Setup

### 1. Create Environment Files

**Root `.env` file** (for tenant-app):
```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**
```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/cortiware?schema=public"

# NextAuth (REQUIRED)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3003"

# Redis (Optional - for rate limiting)
REDIS_URL="redis://localhost:6379"

# Stripe (Optional - for monetization)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SendGrid (Optional - for emails)
SENDGRID_API_KEY="SG...."
```

**Provider Portal `.env` file** (apps/provider-portal/.env):
```bash
# Copy example
cp apps/provider-portal/.env.example apps/provider-portal/.env

# Edit with your values
nano apps/provider-portal/.env
```

**Required variables:**
```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/cortiware_provider?schema=public"

# NextAuth (REQUIRED)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Stripe (Optional)
STRIPE_SECRET_KEY="sk_test_..."
```

### 2. Generate Secrets

**NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Copy the output to your `.env` files.

---

## Database Setup

### 1. Create Databases

**For tenant-app:**
```sql
CREATE DATABASE cortiware;
```

**For provider-portal:**
```sql
CREATE DATABASE cortiware_provider;
```

### 2. Run Migrations

**Tenant-app migrations** (from root):
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

**Provider-portal migrations:**
```bash
cd apps/provider-portal
npx prisma migrate deploy
cd ../..
```

### 3. Generate Prisma Clients

**Generate both clients:**
```bash
# Tenant-app client
npx prisma generate --schema=prisma/schema.prisma

# Provider-portal client
cd apps/provider-portal
npx prisma generate
cd ../..
```

### 4. Seed Database (Optional)

**Seed tenant-app:**
```bash
npm run seed
```

**Seed provider-portal:**
```bash
cd apps/provider-portal
npm run prisma:seed
cd ../..
```

---

## Local Development

### 1. Start All Apps

**From monorepo root:**
```bash
npm run dev
```

This starts all 4 apps in parallel:
- **provider-portal**: http://localhost:3000
- **tenant-app**: http://localhost:3003
- **marketing-cortiware**: http://localhost:3001
- **marketing-robinson**: http://localhost:3002

### 2. Start Individual Apps

**Provider Portal only:**
```bash
cd apps/provider-portal
npm run dev
```

**Tenant App only:**
```bash
cd apps/tenant-app
npm run dev
```

### 3. Development Workflow

**Make changes:**
1. Edit files in `apps/` or `packages/`
2. Hot reload will update automatically
3. Check browser for changes

**Run type checking:**
```bash
npm run typecheck
```

**Run linting:**
```bash
npm run lint
```

**Fix linting issues:**
```bash
cd apps/provider-portal
npm run lint -- --fix
```

---

## Testing

### 1. Run All Tests

**From monorepo root:**
```bash
npm run test
```

**Expected output:**
```
✓ All tests passed (71/71)
```

### 2. Run Unit Tests

```bash
npm run test:unit
```

### 3. Run E2E Tests

```bash
npm run test:e2e
```

### 4. Type Checking

**Check all packages:**
```bash
npm run typecheck
```

**Check specific app:**
```bash
cd apps/provider-portal
npm run typecheck
```

### 5. Linting

**Lint all apps:**
```bash
npm run lint
```

**Lint specific app:**
```bash
cd apps/tenant-app
npm run lint
```

---

## Deployment

### 1. Vercel Deployment (Recommended)

**Automatic deployment:**
- Push to `main` branch
- Vercel auto-deploys all 4 apps
- Check deployment status: https://vercel.com/dashboard

**Manual deployment:**
```bash
vercel deploy
```

### 2. Pre-Deployment Checklist

**Before pushing to main:**
- [ ] All tests passing (`npm run test`)
- [ ] TypeCheck passing (`npm run typecheck`)
- [ ] Lint passing (`npm run lint`)
- [ ] No uncommitted changes (`git status`)
- [ ] Environment variables set in Vercel dashboard
- [ ] DATABASE_URL configured for production

### 3. Verify Deployment

**Check deployment status:**
1. Go to Vercel dashboard
2. Check deployment logs for each app
3. Verify deployment URLs load correctly
4. Check for runtime errors in Vercel function logs

**Deployment URLs:**
- **provider-portal**: https://cortiware-provider-portal-*.vercel.app
- **tenant-app**: https://cortiware-tenant-*.vercel.app
- **marketing-cortiware**: https://cortiware-marketing-cortiware-*.vercel.app
- **marketing-robinson**: https://cortiware-marketing-robinson-*.vercel.app

---

## Common Issues

### Issue 1: "Cannot find module '@prisma/client-tenant'"

**Cause:** Prisma Client not generated.

**Solution:**
```bash
npx prisma generate --schema=prisma/schema.prisma
```

### Issue 2: "Cannot find module '@prisma/client-provider'"

**Cause:** Provider Portal Prisma Client not generated.

**Solution:**
```bash
cd apps/provider-portal
npx prisma generate
cd ../..
```

### Issue 3: "DATABASE_URL environment variable not found"

**Cause:** `.env` file missing or DATABASE_URL not set.

**Solution:**
1. Create `.env` file in root directory
2. Add `DATABASE_URL="postgresql://..."`
3. Restart dev server

### Issue 4: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
cd apps/provider-portal
npm run dev -- -p 3005
```

### Issue 5: TypeScript Errors After npm install

**Cause:** Build-time type packages in wrong location.

**Solution:**
See [VERCEL_BUILD_GUIDE.md](VERCEL_BUILD_GUIDE.md) for build-time dependency policy.

### Issue 6: Husky Git Hooks Failing

**Error:**
```
husky - pre-commit hook failed
```

**Solution:**
```bash
# Fix linting issues
npm run lint -- --fix

# Or skip hooks (not recommended)
git commit --no-verify
```

---

## Next Steps

### Learn More

- **Architecture**: Read [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)
- **Build System**: Read [AI_AGENT_REFERENCE.md](AI_AGENT_REFERENCE.md)
- **Deployment**: Read [VERCEL_BUILD_GUIDE.md](VERCEL_BUILD_GUIDE.md)
- **API Documentation**: See [api/README.md](api/README.md)

### Explore Features

**Provider Portal** (http://localhost:3000):
- Federation management
- Monetization (plans, prices, coupons)
- Developer portal (API keys, webhooks)
- Observability dashboards

**Tenant App** (http://localhost:3003):
- CRM (Leads, Opportunities, Organizations)
- Dashboard
- User management

### Get Help

- **Documentation Index**: [INDEX.md](INDEX.md)
- **Common Issues**: See [Common Issues](#common-issues) above
- **Troubleshooting**: See [VERCEL_BUILD_GUIDE.md](VERCEL_BUILD_GUIDE.md#troubleshooting-common-issues)

---

**END OF QUICK START GUIDE**

You're now ready to develop on Cortiware! 🚀

