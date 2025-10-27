# Go-Live & Client Onboarding Checklist

**Date Created**: 2025-10-27  
**Status**: Pre-Production  
**Purpose**: Final checklist before client onboarding and production launch

---

## 🚨 CRITICAL: Remove Developer/Test Credentials

### Tenant-App Environment Variables to Remove
Before client onboarding, **remove all developer/test credentials** from Vercel Production environment:

- [ ] **Remove** `TWILIO_AUTH_TOKEN` (developer test token: `be6c34b0e23babba678d0705647fbc7d`)
  - Location: Vercel → cortiware-tenant-app → Production
  - Reason: This is a developer test account, not for production use
  - Action: Delete from Production, keep in Preview/Development for testing

- [ ] **Remove** `RESEND_WEBHOOK_SECRET` (if set with developer account secret)
  - Location: Vercel → cortiware-tenant-app → Production
  - Reason: Developer test account, not for production use
  - Action: Delete from Production, keep in Preview/Development for testing

- [ ] **Remove** any test Twilio SID from environment
  - Verify no `TWILIO_ACCOUNT_SID` with test credentials in Production

### Provider Portal - Keep As-Is
- Provider portal credentials are system-level and should remain
- Database connection strings should remain (but migrate from staging to prod DBs per GO_LIVE_RUNBOOK.md)

---

## 📋 Client Onboarding Process

### Phase 1: Client Setup (Per-Tenant Configuration)

Each client/tenant organization needs to configure their own communication services:

#### Twilio Configuration (For SMS Features)
**Client provides**:
1. Twilio Account SID
2. Twilio Auth Token
3. Twilio Phone Number

**Setup Steps**:
- [ ] Client creates Twilio account at twilio.com
- [ ] Client purchases phone number or uses existing
- [ ] Client provides credentials securely (encrypted channel)
- [ ] Add to tenant's configuration in database (encrypted)
- [ ] Configure webhook URL: `https://[tenant-domain]/api/webhooks/twilio`
- [ ] Enable signature validation in Twilio dashboard
- [ ] Test SMS sending and delivery status webhooks

**Documentation Needed**:
- Create `docs/client-onboarding/TWILIO_SETUP_GUIDE.md`
- Include screenshots of Twilio dashboard configuration
- Document webhook URL format and security requirements

#### Resend Configuration (For Email Features)
**Client provides**:
1. Resend API Key
2. Verified domain (optional but recommended)

**Setup Steps**:
- [ ] Client creates Resend account at resend.com
- [ ] Client generates API key
- [ ] Client verifies sending domain (if custom domain needed)
- [ ] Add to tenant's configuration in database (encrypted)
- [ ] Configure webhook URL: `https://[tenant-domain]/api/webhooks/resend`
- [ ] Get webhook signing secret from Resend dashboard
- [ ] Test email sending and delivery status webhooks

**Documentation Needed**:
- Create `docs/client-onboarding/RESEND_SETUP_GUIDE.md`
- Include domain verification steps
- Document webhook configuration and signing secret setup

---

## 🏗️ Architecture: Per-Tenant vs System-Wide

### Per-Tenant Configuration (Stored in Database)
These should be configured **per organization** in the database:
- Twilio credentials (Account SID, Auth Token, Phone Number)
- Resend API keys
- Webhook secrets for signature validation
- Custom branding/domains
- Billing settings
- Feature flags

### System-Wide Configuration (Vercel Environment Variables)
These remain in Vercel and apply to all tenants:
- `DATABASE_URL` (production database)
- `DIRECT_DATABASE_URL` (for Prisma migrations)
- `NEXTAUTH_SECRET` (system auth)
- `NEXTAUTH_URL` (system URL)
- System monitoring/logging credentials
- Infrastructure secrets (Redis, etc.)

---

## 🔐 Webhook Security Best Practices

### Production Webhook Requirements
All production clients should configure webhook signature validation:

1. **Twilio Webhooks**:
   - Store client's `TWILIO_AUTH_TOKEN` in database (encrypted)
   - Validate `X-Twilio-Signature` header on every webhook request
   - Return 403 if signature validation fails
   - Log all failed validation attempts for security monitoring

2. **Resend Webhooks**:
   - Store client's `RESEND_WEBHOOK_SECRET` in database (encrypted)
   - Validate `svix-signature` header on every webhook request
   - Check timestamp to prevent replay attacks
   - Return 403 if signature validation fails
   - Log all failed validation attempts

### Development/Testing
- Developer accounts can be used in Preview/Development environments
- Signature validation is optional in non-production environments
- Clear separation between test and production credentials

---

## ✅ Pre-Launch Checklist

### Database & Infrastructure
- [ ] Production Neon databases provisioned (per GO_LIVE_RUNBOOK.md)
- [ ] Prisma migrations applied to production databases
- [ ] Backups and PITR enabled on production databases
- [ ] Redis/Vercel KV configured for production
- [ ] All system-wide environment variables set in Vercel Production

### Security
- [ ] All developer/test credentials removed from Production environment
- [ ] Webhook signature validation implemented and tested
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Audit logging enabled and tested
- [ ] All secrets rotated (not using defaults)

### Client Onboarding Documentation
- [ ] Create `docs/client-onboarding/` directory
- [ ] Write Twilio setup guide with screenshots
- [ ] Write Resend setup guide with screenshots
- [ ] Document webhook configuration requirements
- [ ] Create client configuration form/checklist
- [ ] Document how to store client credentials securely in database
- [ ] Create troubleshooting guide for common webhook issues

### Application Features
- [ ] All deployments successful (tenant-app + provider-portal)
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] All critical features tested end-to-end
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] Performance monitoring configured

### Testing
- [ ] Unit tests passing (all apps)
- [ ] Integration tests passing
- [ ] Webhook signature validation tested with real credentials
- [ ] Multi-tenant isolation tested
- [ ] Security penetration testing completed (if applicable)

---

## 📝 Client Onboarding Workflow

### Step 1: Initial Setup
1. Client signs agreement and provides company information
2. Create organization in tenant database
3. Generate initial admin user credentials
4. Send onboarding welcome email

### Step 2: Communication Services Setup
1. Provide client with communication setup guides:
   - `docs/client-onboarding/TWILIO_SETUP_GUIDE.md`
   - `docs/client-onboarding/RESEND_SETUP_GUIDE.md`
2. Client creates their own Twilio and/or Resend accounts
3. Client provides credentials securely (via encrypted form or secure channel)
4. Store credentials in database (encrypted at rest)
5. Configure webhook URLs and signing secrets
6. Test SMS and email sending
7. Test webhook delivery and signature validation

### Step 3: Configuration & Testing
1. Configure client branding/theme
2. Set up billing/subscription
3. Enable requested features
4. Run smoke tests with client credentials
5. Provide client training/documentation

### Step 4: Go-Live
1. Client reviews and approves configuration
2. Enable production access
3. Monitor first 24 hours closely
4. Provide ongoing support

---

## 🔄 Migration from Current State

### Current State (Development)
- Developer Twilio credentials in Vercel Production environment
- Webhooks using test credentials
- No per-tenant configuration

### Target State (Production-Ready)
- **No** developer credentials in Production environment
- Webhooks configured per-tenant with client credentials
- Per-tenant configuration stored securely in database
- Clear client onboarding process

### Migration Steps
1. [ ] Remove developer credentials from Vercel Production
2. [ ] Update webhook handlers to fetch credentials from database (per tenant/organization)
3. [ ] Create database schema for storing tenant credentials (encrypted)
4. [ ] Implement credential encryption/decryption utilities
5. [ ] Create admin UI for managing tenant communication settings
6. [ ] Write client onboarding documentation
7. [ ] Test with first pilot client

---

## 📚 Required Documentation (TODO)

### Create These Guides:
- [ ] `docs/client-onboarding/TWILIO_SETUP_GUIDE.md`
  - Account creation
  - Phone number purchase
  - Webhook configuration
  - Signature validation setup
  - Testing and troubleshooting

- [ ] `docs/client-onboarding/RESEND_SETUP_GUIDE.md`
  - Account creation
  - Domain verification
  - API key generation
  - Webhook configuration
  - Signing secret setup
  - Testing and troubleshooting

- [ ] `docs/client-onboarding/WEBHOOK_SECURITY.md`
  - Why signature validation matters
  - How to configure webhooks securely
  - Common security issues and solutions
  - Monitoring and alerting

- [ ] `docs/client-onboarding/CLIENT_ONBOARDING_WORKFLOW.md`
  - End-to-end onboarding process
  - Checklist for each client
  - Support escalation procedures

### Update Existing Docs:
- [ ] Update `ENV_VARS_TODO.md` to clarify per-tenant vs system-wide variables
- [ ] Update `GO_LIVE_RUNBOOK.md` to reference this checklist
- [ ] Update `PRODUCTION_READINESS.md` with client onboarding requirements

---

## 🎯 Next Actions (Priority Order)

### Immediate (Before Any Client Onboarding)
1. **Remove developer credentials from Production** (do this NOW)
2. Implement per-tenant credential storage in database
3. Update webhook handlers to use per-tenant credentials
4. Write client onboarding documentation

### High Priority (This Week)
1. Create admin UI for managing tenant communication settings
2. Implement credential encryption/decryption
3. Test entire flow with test tenant
4. Security review of credential storage

### Medium Priority (Before First Client)
1. Create all client onboarding guides
2. Build automated testing for webhook signature validation
3. Set up monitoring/alerting for webhook failures
4. Create support runbook for common issues

---

## 🔍 Verification Commands

### Check Production Environment Variables
```bash
# Check tenant-app production env vars
npx vercel env ls --scope production

# Look for any developer/test credentials that should be removed
```

### Verify Webhook Configuration
```bash
# Test webhook signature validation
curl -X POST https://[tenant-domain]/api/webhooks/twilio \
  -H "X-Twilio-Signature: invalid" \
  -d "test=data"
# Should return 403 if TWILIO_AUTH_TOKEN is set

curl -X POST https://[tenant-domain]/api/webhooks/resend \
  -H "svix-signature: invalid" \
  -d "test=data"
# Should return 403 if RESEND_WEBHOOK_SECRET is set
```

---

## ✅ Sign-Off

Before launching to production and onboarding clients:

- [ ] Engineering Lead Review: _______________ Date: ___________
- [ ] Security Review: _______________ Date: ___________
- [ ] Product Owner Approval: _______________ Date: ___________
- [ ] All developer credentials removed from Production: ✅ / ❌
- [ ] Client onboarding documentation complete: ✅ / ❌
- [ ] First pilot client ready: ✅ / ❌

---

**Last Updated**: 2025-10-27  
**Next Review**: Before first client onboarding
