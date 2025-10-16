# Cortiware Credentials & Configuration Setup Guide

**Last Updated:** January 13, 2025
**Version:** 1.0.0

This comprehensive guide documents all third-party services, API keys, tokens, and configuration required to set up and deploy the Cortiware monorepo (Tenant App + Provider Portal).

---

## 📋 Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Required Services & Accounts](#required-services--accounts)
3. [Environment Variables Reference](#environment-variables-reference)
4. [Step-by-Step Setup Instructions](#step-by-step-setup-instructions)
5. [Current Configuration Status](#current-configuration-status)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start Checklist

### Development Environment
- [ ] Node.js 22.x installed
- [ ] npm 10.8.2+ installed
- [ ] PostgreSQL database created (Neon or local)
- [ ] `.env.local` files created for both apps
- [ ] Database migrations applied
- [ ] Seed data loaded (optional)

### Production Deployment (Vercel)
- [ ] Vercel account created
- [ ] Vercel CLI installed and authenticated
- [ ] Projects created on Vercel (tenant-app, provider-portal)
- [ ] Database URL configured in Vercel
- [ ] Vercel KV database created and linked
- [ ] Vercel Blob storage created and linked
- [ ] All environment variables configured in Vercel dashboard
- [ ] Custom domains configured (optional)

---

## 🔑 Required Services & Accounts

### 1. **Vercel** (Deployment Platform)

**Purpose:** Hosting, deployment, serverless functions, edge network
**Account URL:** https://vercel.com/signup
**Required Plan:** Hobby (Free) or Pro ($20/month per user)
**Why Needed:** Primary deployment platform for both Tenant App and Provider Portal

**Features Used:**
- Next.js hosting and deployment
- Serverless API routes
- Edge functions
- Automatic HTTPS
- Preview deployments
- Environment variables management
- Build logs and monitoring

**Setup Steps:**
1. Create account at https://vercel.com/signup
2. Install Vercel CLI: `npm install -g vercel`
3. Authenticate: `vercel login`
4. Link projects: `vercel link` (run in each app directory)

**Current Status:** ✅ **CONFIGURED** (Projects deployed and live)

---

### 2. **Neon Database** (PostgreSQL)

**Purpose:** Primary PostgreSQL database for all application data
**Account URL:** https://neon.tech/
**Required Plan:** Free tier (0.5 GB storage) or Pro ($19/month)
**Why Needed:** Stores all tenant data, jobs, customers, invoices, users, etc.

**Features Used:**
- Serverless PostgreSQL
- Automatic scaling
- Branching (for preview deployments)
- Connection pooling
- Point-in-time recovery (Pro plan)

**Setup Steps:**
1. Create account at https://neon.tech/
2. Create a new project
3. Create a database (e.g., `cortiware_production`)
4. Copy the connection string (starts with `postgresql://`)
5. Add to environment variables as `DATABASE_URL`

**Connection String Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Current Status:** ✅ **CONFIGURED** (Database live and connected)

---

### 3. **Vercel KV** (Redis)

**Purpose:** Session storage, nonce tracking, rate limiting, caching
**Account URL:** https://vercel.com/dashboard (integrated with Vercel)
**Required Plan:** Hobby (Free - 256 MB) or Pro ($10/month - 512 MB)
**Why Needed:** Distributed session management, SSO ticket replay protection

**Features Used:**
- Session storage (refresh tokens, user sessions)
- Nonce tracking (SSO ticket replay prevention)
- Rate limiting (auth endpoint protection)
- Distributed caching

**Setup Steps:**
1. Go to Vercel dashboard → Storage → Create Database
2. Select "KV" (Redis)
3. Name it (e.g., `cortiware-kv`)
4. Link to your projects (tenant-app, provider-portal)
5. Vercel automatically adds environment variables:
   - `KV_URL` or `KV_REST_API_URL`
   - `KV_TOKEN` or `KV_REST_API_TOKEN`

**Environment Variables:**
- `KV_URL` or `KV_REST_API_URL` - Connection URL
- `KV_TOKEN` or `KV_REST_API_TOKEN` - Authentication token

**Fallback Behavior:**
If not configured, the app uses an in-memory fallback (NOT suitable for production).

**Current Status:** ⚠️ **NEEDS VERIFICATION** (May be configured on Vercel)

---

### 4. **Vercel Blob** (File Storage)

**Purpose:** Cloud storage for job photos and file uploads
**Account URL:** https://vercel.com/dashboard (integrated with Vercel)
**Required Plan:** Hobby (Free - 1 GB) or Pro ($0.15/GB/month)
**Why Needed:** Job photo uploads, document storage

**Features Used:**
- Image storage and serving
- Automatic CDN distribution
- Unique URL generation
- File deletion

**Setup Steps:**
1. Go to Vercel dashboard → Storage → Create Database
2. Select "Blob"
3. Name it (e.g., `cortiware-blob`)
4. Link to tenant-app project
5. Vercel automatically adds environment variable:
   - `BLOB_READ_WRITE_TOKEN`

**Environment Variables:**
- `BLOB_READ_WRITE_TOKEN` - Read/write access token

**Current Status:** ✅ **CONFIGURED** (Photo upload feature working)

---

### 5. **Email Service** (Resend or SendGrid)

**Purpose:** Transactional emails (invoice notifications, job updates)
**Account URL:** https://resend.com/ or https://sendgrid.com/
**Required Plan:** Resend Free (100 emails/day) or SendGrid Free (100 emails/day)
**Why Needed:** Email notifications for invoices, job status changes

**Features Blocked:**
- ❌ Invoice payment confirmation emails
- ❌ Job status change notifications
- ❌ Customer message notifications

**Setup Steps (Resend - Recommended):**
1. Create account at https://resend.com/
2. Verify your domain or use resend.dev for testing
3. Create API key in dashboard
4. Add to environment variables as `RESEND_API_KEY`

**Setup Steps (SendGrid - Alternative):**
1. Create account at https://sendgrid.com/
2. Verify sender email address
3. Create API key with "Mail Send" permissions
4. Add to environment variables as `SENDGRID_API_KEY`

**Environment Variables:**
- `RESEND_API_KEY` - Resend API key (if using Resend)
- `SENDGRID_API_KEY` - SendGrid API key (if using SendGrid)
- `EMAIL_FROM` - Sender email address (e.g., `noreply@cortiware.com`)

**Current Status:** ❌ **NOT CONFIGURED** (Blocking email notification features)

---

### 6. **Stripe** (Payment Processing) - OPTIONAL

**Purpose:** Payment processing for invoices (future feature)
**Account URL:** https://stripe.com/
**Required Plan:** Free (2.9% + $0.30 per transaction)
**Why Needed:** Online invoice payments, subscription billing

**Features (Future):**
- Credit card payments
- ACH/bank transfers
- Subscription management
- Payment links

**Setup Steps:**
1. Create account at https://stripe.com/
2. Get API keys from dashboard
3. Add to environment variables

**Environment Variables:**
- `STRIPE_SECRET_KEY` - Secret key for server-side
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Publishable key for client-side

**Current Status:** ❌ **NOT CONFIGURED** (Not yet implemented)

---

### 6. Gmail API (Provider Email via OAuth)

Purpose: Allow the Provider Portal to send emails via your Google Workspace mailbox using Gmail OAuth (gmail.send scope only).

Setup Steps:
1) Enable Gmail API in Google Cloud Console
2) Configure OAuth consent (External or Internal for Workspace)
3) Create OAuth Client (Web application)
   - Authorized JavaScript origins: https://provider.yourdomain.com
   - Authorized redirect URIs: https://provider.yourdomain.com/api/provider/email/connect/callback
4) Copy credentials into Vercel → Provider Portal project
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
5) (Optional) Set NEXT_PUBLIC_PROVIDER_URL to your provider hostname
6) Connect in app: Provider Portal → Settings → Email → Connect Gmail

Environment Variables (Provider Portal):
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_PROVIDER_URL=https://provider.yourdomain.com
ENCRYPTION_MASTER_KEY=your-strong-random-secret-32B+
```

Security & Storage:
- Refresh tokens are AES-256-GCM encrypted at rest using ENCRYPTION_MASTER_KEY and stored in Vercel KV.
- Only gmail.send scope is requested (no mailbox read).


## 📝 Environment Variables Reference

### Tenant App (`apps/tenant-app/.env.local`)

```bash
# ============================================================================
# SSO Ticket Secret (MUST match provider-portal)
# ============================================================================
AUTH_TICKET_HMAC_SECRET=your-strong-random-secret-here

# ============================================================================
# Tenant Cookie Secret
# ============================================================================
TENANT_COOKIE_SECRET=your-tenant-cookie-secret

# ============================================================================
# Emergency Access (Provider/Developer)
# ============================================================================
EMERGENCY_LOGIN_ENABLED=true

# Generate with: node scripts/generate-bcrypt-hash.js <password>
PROVIDER_ADMIN_PASSWORD_HASH=$2b$10$ywsP.VuvUKqHuJdHFHl.g.E2WKT1HXsDduq9xr7lUL.7.52WK7P/C
DEVELOPER_ADMIN_PASSWORD_HASH=$2b$10$923jbPJQKdyKQw/NosrNCuLIBiAjGvrgyLog4xFyAAXiRYdiDLlWq

# Optional: Require TOTP for emergency access
# PROVIDER_TOTP_SECRET=KZXW6YTBMFXG6===
# DEVELOPER_TOTP_SECRET=KB2W6YTBMFY62===

# Optional: IP allowlist for emergency access (comma-separated)
# EMERGENCY_IP_ALLOWLIST=1.2.3.4,5.6.7.8

# ============================================================================
# Database (same as provider-portal)
# ============================================================================
DATABASE_URL=postgresql://user:password@host:5432/database

# ============================================================================
# Vercel KV (Redis) - Auto-configured by Vercel
# ============================================================================
KV_URL=https://your-kv-instance.kv.vercel-storage.com
KV_TOKEN=your-kv-token

# ============================================================================
# Vercel Blob (File Storage) - Auto-configured by Vercel
# ============================================================================
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# ============================================================================
# Email Service (Choose ONE)
# ============================================================================
# Option 1: Resend (Recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@cortiware.com

# Option 2: SendGrid (Alternative)
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
# EMAIL_FROM=noreply@cortiware.com

# ============================================================================
# Dev Mode Flags (ONLY for development - set to false in production)
# ============================================================================
DEV_ACCEPT_ANY_TENANT_LOGIN=false
DEV_ACCEPT_ANY_ACCOUNTANT_LOGIN=false
DEV_ACCEPT_ANY_VENDOR_LOGIN=false

# ============================================================================
# Optional: App URL for SSO audience validation
# ============================================================================
NEXT_PUBLIC_APP_URL=https://tenant-app.vercel.app
```

### Provider Portal (`apps/provider-portal/.env.local`)

```bash
# ============================================================================
# SSO Ticket Secret (MUST match tenant-app)
# ============================================================================
AUTH_TICKET_HMAC_SECRET=your-strong-random-secret-here

# ============================================================================
# Provider Authentication
# ============================================================================
PROVIDER_EMAIL=provider@example.com
PROVIDER_PASSWORD=your-secure-password
PROVIDER_BREAKGLASS_EMAIL=breakglass-provider@example.com
PROVIDER_BREAKGLASS_PASSWORD=your-breakglass-password
PROVIDER_SESSION_SECRET=your-provider-session-secret

# ============================================================================
# Developer Authentication
# ============================================================================
DEVELOPER_EMAIL=developer@example.com
DEVELOPER_PASSWORD=your-secure-password
DEVELOPER_BREAKGLASS_EMAIL=breakglass-developer@example.com
DEVELOPER_BREAKGLASS_PASSWORD=your-breakglass-password
DEVELOPER_SESSION_SECRET=your-developer-session-secret

# Dev mode flag (ONLY for development - set to false in production)
DEV_ACCEPT_ANY_DEVELOPER_LOGIN=false

# ============================================================================
# Database
# ============================================================================
DATABASE_URL=postgresql://user:password@host:5432/database

# ============================================================================
# Vercel KV (Redis) - Auto-configured by Vercel
# ============================================================================
KV_URL=https://your-kv-instance.kv.vercel-storage.com
KV_TOKEN=your-kv-token

# ============================================================================
# Optional: App URL for SSO audience validation
# ============================================================================
NEXT_PUBLIC_APP_URL=https://provider-portal.vercel.app
```

---

## 🛠️ Step-by-Step Setup Instructions

### Local Development Setup

#### 1. Clone Repository and Install Dependencies

```bash
git clone https://github.com/christcr2012/Cortiware.git
cd Cortiware
npm install
```

#### 2. Create Environment Files

```bash
# Tenant App
cp apps/tenant-app/.env.example apps/tenant-app/.env.local

# Provider Portal
cp apps/provider-portal/.env.example apps/provider-portal/.env.local
```

#### 3. Configure Database

**Option A: Neon (Recommended for Production)**
1. Create account at https://neon.tech/
2. Create new project and database
3. Copy connection string
4. Add to both `.env.local` files as `DATABASE_URL`

**Option B: Local PostgreSQL (Development)**
1. Install PostgreSQL locally
2. Create database: `createdb cortiware_dev`
3. Set `DATABASE_URL=postgresql://localhost:5432/cortiware_dev`

#### 4. Generate Secrets

```bash
# Generate random secrets (use output for environment variables)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use this for:
- `AUTH_TICKET_HMAC_SECRET` (MUST be same in both apps)
- `TENANT_COOKIE_SECRET`
- `PROVIDER_SESSION_SECRET`
- `DEVELOPER_SESSION_SECRET`

#### 5. Generate Password Hashes

```bash
# Generate bcrypt hash for emergency access passwords
npm run setpwd
```

Follow prompts and add hashes to tenant-app `.env.local`:
- `PROVIDER_ADMIN_PASSWORD_HASH`
- `DEVELOPER_ADMIN_PASSWORD_HASH`

#### 6. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed database with sample data
npm run seed
```

#### 7. Start Development Servers

```bash
# Start all apps in parallel
npm run dev

# Or start individually
cd apps/tenant-app && npm run dev
cd apps/provider-portal && npm run dev
```

**Access URLs:**
- Tenant App: http://localhost:3003
- Provider Portal: http://localhost:3001

---

### Production Deployment (Vercel)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

#### 2. Create Vercel Projects

```bash
# In tenant-app directory
cd apps/tenant-app
vercel link

# In provider-portal directory
cd apps/provider-portal
vercel link
```

#### 3. Create Vercel KV Database

1. Go to https://vercel.com/dashboard
2. Navigate to Storage → Create Database
3. Select "KV" (Redis)
4. Name: `cortiware-kv`
5. Link to both projects (tenant-app, provider-portal)
6. Vercel auto-adds `KV_URL` and `KV_TOKEN` to environment variables

#### 4. Create Vercel Blob Storage

1. Go to https://vercel.com/dashboard
2. Navigate to Storage → Create Database
3. Select "Blob"
4. Name: `cortiware-blob`
5. Link to tenant-app project
6. Vercel auto-adds `BLOB_READ_WRITE_TOKEN` to environment variables

#### 5. Configure Environment Variables in Vercel

For each project (tenant-app, provider-portal):

1. Go to project settings → Environment Variables
2. Add all variables from `.env.local`
3. Set appropriate environment (Production, Preview, Development)
4. **CRITICAL:** Ensure `AUTH_TICKET_HMAC_SECRET` is IDENTICAL in both apps

**Required for Tenant App:**
- `DATABASE_URL`
- `AUTH_TICKET_HMAC_SECRET`
- `TENANT_COOKIE_SECRET`
- `EMERGENCY_LOGIN_ENABLED`
- `PROVIDER_ADMIN_PASSWORD_HASH`
- `DEVELOPER_ADMIN_PASSWORD_HASH`
- `BLOB_READ_WRITE_TOKEN` (auto-added by Vercel Blob)
- `KV_URL` (auto-added by Vercel KV)
- `KV_TOKEN` (auto-added by Vercel KV)

**Required for Provider Portal:**
- `DATABASE_URL`
- `AUTH_TICKET_HMAC_SECRET`
- `PROVIDER_EMAIL`
- `PROVIDER_PASSWORD`
- `PROVIDER_SESSION_SECRET`
- `DEVELOPER_EMAIL`
- `DEVELOPER_PASSWORD`
- `DEVELOPER_SESSION_SECRET`
- `KV_URL` (auto-added by Vercel KV)
- `KV_TOKEN` (auto-added by Vercel KV)

#### 6. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys via GitHub integration)
git push origin main
```

#### 7. Verify Deployment

1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Test database connection
4. Test SSO flow between apps
5. Test file upload (Vercel Blob)

---

## 📊 Current Configuration Status

### ✅ Configured Services

| Service | Status | Environment | Notes |
|---------|--------|-------------|-------|
| Vercel | ✅ Configured | Production | Both apps deployed and live |
| Neon Database | ✅ Configured | Production | Connected and migrations applied |
| Vercel Blob | ✅ Configured | Production | Photo upload working |
| GitHub Actions | ✅ Configured | CI/CD | Typecheck and lint running |

### ⚠️ Needs Verification

| Service | Status | Environment | Notes |
|---------|--------|-------------|-------|
| Vercel KV | ⚠️ Needs Verification | Production | May be configured; verify in Vercel dashboard |

### ❌ Not Configured (Blocking Features)

| Service | Status | Blocked Features | Priority |
|---------|--------|------------------|----------|
| Email Service (Resend/SendGrid) | ❌ Not Configured | Invoice payment emails, job notifications | High |
| Stripe | ❌ Not Configured | Online payments (future feature) | Low |

---

## 🔒 Security Best Practices

### Secret Management

**DO:**
- ✅ Use strong, randomly generated secrets (32+ characters)
- ✅ Use different secrets for each environment (dev, staging, prod)
- ✅ Store secrets in Vercel environment variables (encrypted at rest)
- ✅ Use `.env.local` for local development (never commit)
- ✅ Rotate secrets regularly (every 90 days recommended)
- ✅ Use bcrypt for password hashing (already implemented)

**DON'T:**
- ❌ Never commit `.env.local` or `.env` files to git
- ❌ Never share secrets in Slack, email, or other channels
- ❌ Never use the same secret across multiple apps (except `AUTH_TICKET_HMAC_SECRET`)
- ❌ Never use weak or predictable secrets
- ❌ Never log secrets to console or error messages

### Key Rotation

**If a secret is compromised:**

1. **Immediate Actions:**
   - Generate new secret immediately
   - Update in Vercel dashboard
   - Redeploy affected apps
   - Invalidate all active sessions (if session secret)

2. **Database URL:**
   - Create new database user with different password
   - Update `DATABASE_URL` in Vercel
   - Redeploy apps
   - Delete old database user

3. **API Keys (Vercel Blob, KV, Email):**
   - Regenerate key in service dashboard
   - Update in Vercel environment variables
   - Redeploy apps
   - Revoke old key

4. **SSO Ticket Secret:**
   - Generate new `AUTH_TICKET_HMAC_SECRET`
   - Update in BOTH tenant-app AND provider-portal
   - Redeploy BOTH apps simultaneously
   - All users will need to re-authenticate

### Access Control

- Limit Vercel team access to necessary personnel only
- Use Vercel's role-based access control (RBAC)
- Enable 2FA on all service accounts (Vercel, Neon, GitHub)
- Use IP allowlisting for emergency access (optional)
- Regularly audit access logs

---

## 🔧 Troubleshooting

### Common Issues

#### "Database connection failed"

**Symptoms:** App crashes on startup, "Can't reach database server" error

**Solutions:**
1. Verify `DATABASE_URL` is set correctly in environment variables
2. Check database is running and accessible
3. Verify SSL mode is set: `?sslmode=require` for Neon
4. Check firewall rules allow connections from Vercel IPs
5. Verify database user has correct permissions

#### "KV not configured, using in-memory fallback"

**Symptoms:** Warning in logs, sessions don't persist across deployments

**Solutions:**
1. Create Vercel KV database in dashboard
2. Link to your project
3. Verify `KV_URL` and `KV_TOKEN` are set
4. Redeploy app

#### "Blob upload failed"

**Symptoms:** Photo upload returns 401 or 403 error

**Solutions:**
1. Verify `BLOB_READ_WRITE_TOKEN` is set in environment variables
2. Check Vercel Blob storage is linked to project
3. Verify token has read/write permissions
4. Check file size limits (default 4.5 MB for Hobby plan)

#### "SSO ticket validation failed"

**Symptoms:** Can't log in from Provider Portal to Tenant App

**Solutions:**
1. Verify `AUTH_TICKET_HMAC_SECRET` is IDENTICAL in both apps
2. Check both apps are deployed and running
3. Verify `NEXT_PUBLIC_APP_URL` is set correctly
4. Check browser allows cookies from both domains
5. Verify Vercel KV is configured (for nonce tracking)

#### "Email notifications not working"

**Symptoms:** No emails sent, silent failures

**Solutions:**
1. Verify email service API key is configured
2. Check sender email is verified (SendGrid) or domain is verified (Resend)
3. Check API key has correct permissions
4. Verify `EMAIL_FROM` matches verified sender
5. Check email service dashboard for error logs

---

## 📚 Additional Resources

### Official Documentation

- **Vercel:** https://vercel.com/docs
- **Neon:** https://neon.tech/docs
- **Vercel KV:** https://vercel.com/docs/storage/vercel-kv
- **Vercel Blob:** https://vercel.com/docs/storage/vercel-blob
- **Resend:** https://resend.com/docs
- **SendGrid:** https://docs.sendgrid.com/
- **Prisma:** https://www.prisma.io/docs
- **Next.js:** https://nextjs.org/docs

### Internal Documentation

- **Phase 2 Completion Report:** `docs/PHASE_2_COMPLETION_REPORT.md`
- **AI Agent Reference:** `docs/AI_AGENT_REFERENCE.md`
- **Prisma Schema:** `prisma/schema.prisma`
- **Environment Examples:** `apps/*/. env.example`

---

**Document Version:** 1.0.0
**Last Updated:** January 13, 2025
**Maintained By:** Development Team

