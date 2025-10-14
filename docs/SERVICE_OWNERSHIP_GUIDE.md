# Service Ownership Guide

## Overview

This document defines the ownership model for all third-party services used in the Cortiware platform. Understanding this architecture is critical for developers, as it determines who creates accounts, who pays for services, and where credentials are stored.

**Cortiware Architecture:** Tenant-Level Multi-Tenant SaaS

- **Provider (Robinson AI Systems):** Builds, maintains, and hosts the Cortiware platform
- **Clients/Tenants:** Independent service contractor businesses (plumbers, electricians, HVAC, etc.)
- **End Users:** The tenants' customers (homeowners, businesses needing services)

**Key Principle:** The provider does NOT interact with tenants' customers. Each tenant runs their own independent business using Cortiware as their software platform.

---

## Service Ownership Decision Matrix

| Service | Account Owner | Credentials Scope | Who Pays | Development Setup | Production Setup | Rationale |
|---------|--------------|-------------------|----------|-------------------|------------------|-----------|
| **Vercel** | Provider | Provider-level | Provider | Provider's Vercel account | Same provider account | Provider hosts the platform for all tenants |
| **Neon Database** | Provider | Provider-level | Provider | Provider's Neon account | Same provider account | Shared database with tenant isolation via orgId |
| **Vercel KV (Redis)** | Provider | Provider-level | Provider | Provider's Vercel account | Same provider account | Shared Redis for sessions, rate limiting, nonces |
| **Vercel Blob** | Provider | Provider-level | Provider | Provider's Vercel account | Same provider account | File storage with tenant isolation via orgId |
| **Email Service** | **Client/Tenant** | **Tenant-level** | **Client** | Developer's test account | Each tenant's own account | Emails must come from tenant's domain to their customers |
| **Stripe Payments** | **Client/Tenant** | **Tenant-level** | **Client** | Developer's test account | Each tenant's own account | Payments go directly to tenant's bank account |
| **SMS Service** | **Client/Tenant** | **Tenant-level** | **Client** | Developer's test account | Each tenant's own account | SMS sent from tenant's number to their customers |

---

## Detailed Service Breakdown

### 1. Vercel (Deployment Platform)

**Account Owner:** Provider (Robinson AI Systems)

**Credentials:**
- Stored in: Provider's environment (CI/CD, Vercel dashboard)
- Scope: Provider-level (one account for entire platform)
- Location: `VERCEL_TOKEN` in GitHub Actions secrets

**Development:**
- Developer uses provider's Vercel account
- Deploy to preview environments via Vercel CLI or GitHub integration
- Access granted via Vercel team membership

**Production:**
- Same provider Vercel account
- Hosts all tenants on shared infrastructure
- Tenant isolation via Next.js multi-tenancy patterns

**Why Provider-Level:**
- Provider hosts the SaaS platform
- All tenants share the same deployment
- Provider pays for hosting costs
- Simplifies deployment and scaling

**Setup Instructions:**
1. Provider creates Vercel account
2. Connect GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Add team members for development access

---

### 2. Neon Database (PostgreSQL)

**Account Owner:** Provider (Robinson AI Systems)

**Credentials:**
- Stored in: Vercel environment variables
- Scope: Provider-level (one database for entire platform)
- Location: `DATABASE_URL` in Vercel project settings

**Development:**
- Developer uses provider's Neon account
- Can create separate development branches in Neon
- Local development uses provider's dev database or local PostgreSQL

**Production:**
- Same provider Neon account
- Single database with tenant isolation via `orgId` field
- All tables include `orgId` for row-level security

**Why Provider-Level:**
- Shared database architecture with tenant isolation
- Provider manages database backups and scaling
- Simpler data model and migrations
- Cost-effective for multi-tenant SaaS

**Setup Instructions:**
1. Provider creates Neon account
2. Create production database
3. Add `DATABASE_URL` to Vercel environment variables
4. Run Prisma migrations: `npx prisma migrate deploy`

---

### 3. Vercel KV (Redis)

**Account Owner:** Provider (Robinson AI Systems)

**Credentials:**
- Stored in: Vercel environment variables
- Scope: Provider-level (one Redis instance for entire platform)
- Location: `KV_REST_API_URL`, `KV_REST_API_TOKEN` in Vercel

**Development:**
- Developer uses provider's Vercel KV
- Can create separate KV stores for dev/staging
- Local development can use local Redis or skip KV features

**Production:**
- Same provider Vercel KV
- Shared Redis with tenant isolation via key prefixes
- Used for: sessions, nonces, rate limiting, caching

**Why Provider-Level:**
- Shared infrastructure for sessions and caching
- Provider manages Redis scaling and persistence
- Tenant isolation via key naming conventions
- Cost-effective for multi-tenant SaaS

**Setup Instructions:**
1. Provider creates Vercel KV store in Vercel dashboard
2. Vercel automatically adds environment variables
3. Use `@cortiware/kv` package for tenant-isolated access

---

### 4. Vercel Blob (File Storage)

**Account Owner:** Provider (Robinson AI Systems)

**Credentials:**
- Stored in: Vercel environment variables
- Scope: Provider-level (one Blob store for entire platform)
- Location: `BLOB_READ_WRITE_TOKEN` in Vercel

**Development:**
- Developer uses provider's Vercel Blob
- Can create separate Blob stores for dev/staging
- Local development uses provider's dev Blob store

**Production:**
- Same provider Vercel Blob
- Shared storage with tenant isolation via path prefixes
- Used for: job photos, invoice PDFs, customer documents

**Why Provider-Level:**
- Shared file storage with tenant isolation
- Provider manages storage costs and scaling
- Tenant isolation via folder structure: `{orgId}/{resource}/{file}`
- Simpler access control and CDN integration

**Setup Instructions:**
1. Provider creates Vercel Blob store in Vercel dashboard
2. Vercel automatically adds environment variables
3. Upload files with tenant-specific paths

---

### 5. Email Service (SendGrid or Resend)

**Account Owner:** Client/Tenant (Each contractor)

**Credentials:**
- Stored in: Database (`Org` model, encrypted)
- Scope: Tenant-level (each tenant has their own account)
- Fields: `emailProvider`, `emailApiKey`, `emailFromAddress`, `emailFromName`

**Development:**
- Developer creates their own SendGrid/Resend test account
- Configure in Settings → Integrations
- Test email sending with developer's credentials
- Use test mode to avoid sending real emails

**Production:**
- Each tenant creates their own SendGrid/Resend account
- Tenant configures credentials in Settings → Integrations
- Emails sent from tenant's domain (e.g., `noreply@abcplumbing.com`)
- Tenant pays for email service based on their usage

**Why Tenant-Level:**
- **Trust:** Emails must come from tenant's domain, not provider's
- **Deliverability:** Tenant controls their own sender reputation
- **Compliance:** Tenant responsible for CAN-SPAM, GDPR compliance
- **Branding:** Tenant's company name and domain in emails
- **Liability:** Provider not responsible for tenant's email content
- **Payments:** Tenant pays for their own email volume

**Setup Instructions (Tenant):**
1. Tenant creates SendGrid or Resend account
2. Verify sender domain (e.g., `abcplumbing.com`)
3. Generate API key
4. Go to Cortiware Settings → Integrations
5. Configure email service with API key and sender details
6. Test email sending

**Setup Instructions (Developer):**
1. Create free SendGrid or Resend account for testing
2. Use test mode or sandbox domain
3. Configure in local Cortiware instance
4. Test email templates and sending logic

---

### 6. Stripe (Payment Processing)

**Account Owner:** Client/Tenant (Each contractor)

**Credentials:**
- Stored in: Database (`Org` model, encrypted)
- Scope: Tenant-level (each tenant has their own account)
- Fields: `stripeSecretKey`, `stripePublishableKey`, `stripeWebhookSecret`

**Development:**
- Developer creates their own Stripe test account
- Use Stripe test mode keys
- Configure in Settings → Integrations
- Test payment flows with test cards

**Production:**
- Each tenant creates their own Stripe account
- Tenant completes Stripe onboarding (KYC, bank account)
- Tenant configures credentials in Settings → Integrations
- Payments go directly to tenant's bank account
- Tenant pays Stripe processing fees

**Why Tenant-Level:**
- **Payments:** Money goes directly to tenant's bank account
- **Compliance:** Tenant responsible for PCI compliance (Stripe handles)
- **Fees:** Tenant pays Stripe processing fees (2.9% + 30¢)
- **Liability:** Provider not responsible for payment disputes
- **Tax:** Tenant responsible for sales tax and 1099 reporting
- **Refunds:** Tenant controls refund policy and processing

**Setup Instructions (Tenant):**
1. Tenant creates Stripe account
2. Complete Stripe onboarding (business info, bank account)
3. Enable payment processing (charges_enabled)
4. Generate API keys (secret and publishable)
5. Configure webhook endpoint: `https://tenant-app.vercel.app/api/webhooks/stripe`
6. Generate webhook secret
7. Go to Cortiware Settings → Integrations
8. Configure Stripe with all credentials
9. Test payment with test card

**Setup Instructions (Developer):**
1. Create free Stripe test account
2. Use test mode keys
3. Configure in local Cortiware instance
4. Use Stripe test cards for testing
5. Test webhook events with Stripe CLI

---

### 7. SMS Service (Twilio - Future)

**Account Owner:** Client/Tenant (Each contractor)

**Credentials:**
- Stored in: Database (`Org` model, encrypted)
- Scope: Tenant-level (each tenant has their own account)
- Fields: `smsProvider`, `smsApiKey`, `smsFromNumber`

**Development:**
- Developer creates their own Twilio test account
- Use Twilio test credentials
- Configure in Settings → Integrations
- Test SMS sending with test numbers

**Production:**
- Each tenant creates their own Twilio account
- Tenant purchases phone number
- Tenant configures credentials in Settings → Integrations
- SMS sent from tenant's number to their customers
- Tenant pays for SMS usage

**Why Tenant-Level:**
- **Branding:** SMS sent from tenant's business phone number
- **Compliance:** Tenant responsible for TCPA compliance
- **Costs:** Tenant pays for SMS volume
- **Liability:** Provider not responsible for SMS content

**Setup Instructions (Tenant):**
1. Tenant creates Twilio account
2. Purchase phone number
3. Generate API credentials
4. Go to Cortiware Settings → Integrations
5. Configure SMS service
6. Test SMS sending

---

## Environment Variables Reference

### Provider-Level (Vercel Environment Variables)

```bash
# Database
DATABASE_URL=postgresql://...

# Vercel KV (Redis)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Vercel Blob (File Storage)
BLOB_READ_WRITE_TOKEN=...

# Encryption (for tenant credentials)
ENCRYPTION_MASTER_KEY=... # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# NextAuth (if used)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tenant-app.vercel.app
```

### Tenant-Level (Database - Org Model)

```prisma
model Org {
  // Email Service (per-tenant)
  emailProvider     String? // "sendgrid" | "resend"
  emailApiKey       String? // Encrypted
  emailFromAddress  String? // e.g., "noreply@abcplumbing.com"
  emailFromName     String? // e.g., "ABC Plumbing"
  emailConfigured   Boolean @default(false)
  
  // Stripe Payment (per-tenant)
  stripeSecretKey        String? // Encrypted
  stripePublishableKey   String? // Safe to expose
  stripeWebhookSecret    String? // Encrypted
  stripeConfigured       Boolean @default(false)
  
  // SMS Service (per-tenant, future)
  smsProvider      String? // "twilio"
  smsApiKey        String? // Encrypted
  smsFromNumber    String? // e.g., "+15551234567"
  smsConfigured    Boolean @default(false)
}
```

---

## Development Workflow

### Setting Up a New Development Environment

1. **Clone Repository**
   ```bash
   git clone https://github.com/christcr2012/Cortiware.git
   cd Cortiware
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Provider-Level Services** (Ask provider for access)
   - Get added to Vercel team
   - Get `DATABASE_URL` from provider
   - Get `KV_*` and `BLOB_*` tokens from Vercel
   - Generate `ENCRYPTION_MASTER_KEY` for local dev

4. **Configure Tenant-Level Services** (Create your own test accounts)
   - Create SendGrid or Resend test account
   - Create Stripe test account
   - Configure in local Cortiware instance via Settings → Integrations

5. **Run Database Migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## Production Deployment

### Provider Responsibilities

1. **Infrastructure Setup**
   - Create and configure Vercel account
   - Create and configure Neon database
   - Set up Vercel KV and Blob
   - Configure environment variables in Vercel
   - Set up CI/CD pipeline

2. **Deployment**
   - Push to main branch triggers automatic deployment
   - Vercel builds and deploys to production
   - Database migrations run automatically

3. **Monitoring**
   - Monitor Vercel deployment status
   - Monitor database performance
   - Monitor error logs and alerts

### Tenant Responsibilities

1. **Account Creation**
   - Create SendGrid/Resend account
   - Create Stripe account
   - Complete all onboarding and verification

2. **Configuration**
   - Log in to Cortiware
   - Go to Settings → Integrations
   - Configure email service
   - Configure Stripe payment processing
   - Test all integrations

3. **Ongoing Management**
   - Monitor email deliverability
   - Handle payment disputes
   - Manage refunds
   - Pay service fees (SendGrid, Stripe)

---

## Security Best Practices

### Provider-Level Credentials

- Store in Vercel environment variables (encrypted at rest)
- Never commit to Git
- Rotate credentials periodically
- Use separate credentials for dev/staging/production
- Limit access to production credentials

### Tenant-Level Credentials

- Encrypt before storing in database (AES-256-GCM)
- Decrypt only when needed for API calls
- Never expose in client-side code
- Never log decrypted credentials
- Provide UI for tenants to rotate credentials

### Encryption Implementation

```typescript
// Encrypt before storing
const encryptedApiKey = encrypt(apiKey);
await prisma.org.update({
  where: { id: orgId },
  data: { emailApiKey: encryptedApiKey },
});

// Decrypt when needed
const org = await prisma.org.findUnique({ where: { id: orgId } });
const apiKey = decrypt(org.emailApiKey);
// Use apiKey for API call
```

---

## Troubleshooting

### "Email not configured" Error

**Cause:** Tenant hasn't configured email service

**Solution:**
1. Go to Settings → Integrations
2. Configure SendGrid or Resend
3. Test email sending

### "Stripe not configured" Error

**Cause:** Tenant hasn't configured Stripe

**Solution:**
1. Create Stripe account
2. Complete onboarding
3. Go to Settings → Integrations
4. Configure Stripe credentials

### "Database connection failed" Error

**Cause:** Invalid `DATABASE_URL`

**Solution:**
1. Check Vercel environment variables
2. Verify Neon database is running
3. Check database connection string format

### "Encryption failed" Error

**Cause:** Missing or invalid `ENCRYPTION_MASTER_KEY`

**Solution:**
1. Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Add to Vercel environment variables
3. Redeploy application

---

## FAQ

**Q: Why don't we use a single SendGrid account for all tenants?**

A: Emails must come from each tenant's domain to build trust with their customers. Using a shared account would mean all emails come from `@cortiware.com`, which would confuse customers and hurt deliverability.

**Q: Why don't we use Stripe Connect for payments?**

A: Stripe Connect adds complexity and fees. With tenant-level Stripe accounts, payments go directly to tenants, they control refunds, and they're responsible for compliance. This is simpler and more transparent.

**Q: Can tenants share a database?**

A: Yes! The database is provider-level with tenant isolation via `orgId`. All queries filter by `orgId` to ensure data isolation.

**Q: What happens if a tenant's email service fails?**

A: Email notifications will fail for that tenant only. Other tenants are unaffected. The tenant should check their SendGrid/Resend account and credentials.

**Q: How do we handle tenant data migration?**

A: Tenant data is in the shared database. Export via Prisma queries filtered by `orgId`. Import to new system with same `orgId` for continuity.

---

## Summary

**Provider-Level Services (Shared Infrastructure):**
- Vercel (hosting)
- Neon Database (PostgreSQL)
- Vercel KV (Redis)
- Vercel Blob (file storage)

**Tenant-Level Services (Each Tenant's Own):**
- Email Service (SendGrid/Resend)
- Stripe Payment Processing
- SMS Service (Twilio - future)

**Key Takeaway:** The provider hosts the platform, but each tenant brings their own customer-facing service credentials. This ensures proper branding, compliance, and liability separation.

