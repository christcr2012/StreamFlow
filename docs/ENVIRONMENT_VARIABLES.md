# Environment Variables Reference

This document lists all environment variables used across the Cortiware monorepo.

## Shared Variables (Both Apps)

### Authentication

```bash
# HMAC secret for auth ticket signing (REQUIRED for SSO)
# Generate with: openssl rand -base64 32
AUTH_TICKET_HMAC_SECRET=your-secret-key-here
```

## Provider Portal (`apps/provider-portal`)

### Database

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/cortiware_provider
```

### Authentication

```bash
# Provider admin credentials (for initial setup)
PROVIDER_ADMIN_EMAIL=admin@provider.com
PROVIDER_ADMIN_PASSWORD_HASH=<bcrypt-hash>

# Developer admin credentials
DEVELOPER_ADMIN_EMAIL=dev@provider.com
DEVELOPER_ADMIN_PASSWORD_HASH=<bcrypt-hash>
```

### External Services

```bash
# SendGrid for email
SENDGRID_API_KEY=SG.xxx

# Twilio for SMS
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Stripe for payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# OpenAI for AI features
OPENAI_API_KEY=sk-xxx
```

### Provider Email via Gmail OAuth

```bash
# Gmail OAuth Web Client
GOOGLE_CLIENT_ID=100459931667-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Public base URL for Provider Portal (used for OAuth redirect when origin not present)
NEXT_PUBLIC_PROVIDER_URL=https://provider.yourdomain.com

# Encryption master key (used to encrypt refresh tokens stored in KV)
ENCRYPTION_MASTER_KEY=your-strong-random-secret-32B+
```

Notes:
- Refresh tokens are encrypted with AES-256-GCM and stored in Vercel KV.
- Vercel KV connection variables (KV_URL/KV_TOKEN) are auto-added by Vercel when you link a KV database.


### Redis/KV (Optional - Phase 2)

```bash
# Redis for caching and rate limiting
REDIS_URL=redis://localhost:6379
```

## Tenant App (`apps/tenant-app`)

### Database

```bash
# Uses provider-portal's Prisma client via @cortiware/db
# No separate DATABASE_URL needed in Phase 1
```

### Authentication

```bash
# Cookie secret for session encryption
TENANT_COOKIE_SECRET=your-cookie-secret-here

# Emergency access credentials (OPTIONAL - only if EMERGENCY_LOGIN_ENABLED=true)
PROVIDER_ADMIN_PASSWORD_HASH=<bcrypt-hash>
DEVELOPER_ADMIN_PASSWORD_HASH=<bcrypt-hash>

# Emergency login feature flag
EMERGENCY_LOGIN_ENABLED=true

# Optional IP allowlist for emergency access (comma-separated)
EMERGENCY_IP_ALLOWLIST=192.168.1.1,10.0.0.1
```

### Development Flags

```bash
# Allow any tenant user to login (DEV ONLY)
DEV_ACCEPT_ANY_TENANT_LOGIN=true

# Allow any accountant to login (DEV ONLY)
DEV_ACCEPT_ANY_ACCOUNTANT_LOGIN=true

# Allow any vendor to login (DEV ONLY)
DEV_ACCEPT_ANY_VENDOR_LOGIN=true
```

### App Configuration

```bash
# Public app URL for SSO audience validation
NEXT_PUBLIC_APP_URL=https://tenant.cortiware.com
```

## Generating Secrets

### HMAC Secret

```bash
openssl rand -base64 32
```

### Password Hashes (bcrypt)

```bash
# Using Node.js
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));"
```

### Cookie Secret

```bash
openssl rand -hex 32
```

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` for local development
   - Use Vercel environment variables for production

2. **Rotate secrets regularly**
   - AUTH_TICKET_HMAC_SECRET: Every 90 days
   - Password hashes: When compromised
   - API keys: Per vendor recommendations

3. **Use different secrets per environment**
   - Development, staging, and production should have unique secrets
   - Never reuse production secrets in development

4. **Limit emergency access**
   - Only enable EMERGENCY_LOGIN_ENABLED in production when absolutely necessary
   - Use EMERGENCY_IP_ALLOWLIST to restrict access
   - Monitor audit logs for emergency access usage

## Vercel Deployment

### Setting Variables

```bash
# Set for production
vercel env add AUTH_TICKET_HMAC_SECRET production

# Set for preview
vercel env add AUTH_TICKET_HMAC_SECRET preview

# Set for development
vercel env add AUTH_TICKET_HMAC_SECRET development
```

### Pulling Variables Locally

```bash
# Pull environment variables from Vercel
vercel env pull .env.local
```

## Validation

Both apps validate required environment variables on startup. Missing critical variables will cause the app to fail to start with clear error messages.

### Provider Portal Required Variables

- `DATABASE_URL`
- `AUTH_TICKET_HMAC_SECRET` (if SSO enabled)

### Tenant App Required Variables

- `AUTH_TICKET_HMAC_SECRET` (if SSO enabled)
- `TENANT_COOKIE_SECRET`
- `PROVIDER_ADMIN_PASSWORD_HASH` (if EMERGENCY_LOGIN_ENABLED=true)
- `DEVELOPER_ADMIN_PASSWORD_HASH` (if EMERGENCY_LOGIN_ENABLED=true)

