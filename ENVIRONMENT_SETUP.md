# 🔐 StreamFlow Environment Variables Setup

## Critical Security Configuration

This document outlines the required environment variables for the StreamFlow Enterprise Platform, with emphasis on the dual-layer authentication system and break-glass recovery capabilities.

## 🚨 Break-Glass Provider Authentication

### Required Environment Variables

```bash
# === PROVIDER BREAK-GLASS AUTHENTICATION ===
# These variables enable emergency access when the database is unavailable
PROVIDER_ADMIN_EMAIL=your-provider-email@company.com
PROVIDER_ADMIN_PASSWORD_HASH=$2a$12$your-bcrypt-hash-here
PROVIDER_ADMIN_TOTP_SECRET=KZXW6YTBMFZXK4TPNRQW2ZLBMFZXK4TP

# === DEVELOPER BREAK-GLASS AUTHENTICATION ===
DEVELOPER_ADMIN_EMAIL=your-developer-email@company.com
DEVELOPER_ADMIN_PASSWORD_HASH=$2a$12$your-bcrypt-hash-here

# === ACCOUNTANT BREAK-GLASS AUTHENTICATION ===
ACCOUNTANT_ADMIN_EMAIL=your-accountant-email@company.com
ACCOUNTANT_ADMIN_PASSWORD_HASH=$2a$12$your-bcrypt-hash-here
```

### 🔑 Generating Secure Password Hashes

**NEVER store plaintext passwords in environment variables!**

Use bcrypt with cost factor 12 or higher:

```javascript
// Node.js example
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-secure-password', 12);
console.log(hash); // Use this hash in your environment variables
```

```bash
# Command line using htpasswd
htpasswd -bnBC 12 "" your-secure-password | tr -d ':\n'
```

### 🔐 TOTP Secret Generation

Generate a secure TOTP secret for 2FA:

```javascript
// Node.js example
const crypto = require('crypto');
const secret = crypto.randomBytes(20).toString('base32');
console.log(secret); // Use this as PROVIDER_ADMIN_TOTP_SECRET
```

## 🗄️ Database Configuration

```bash
# === DATABASE ===
DATABASE_URL=postgresql://username:password@localhost:5432/streamflow
MASTER_ENC_KEY=base64-encoded-32-byte-key-for-encryption
```

### Generating Master Encryption Key

```javascript
// Node.js example
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('base64');
console.log(key); // Use this as MASTER_ENC_KEY
```

## 🌐 External Services

```bash
# === STRIPE INTEGRATION ===
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# === AI SERVICES ===
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# === COMMUNICATION ===
TWILIO_ACCOUNT_SID=ACyour-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# === EMAIL ===
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

## 🚀 Deployment Configuration

```bash
# === VERCEL DEPLOYMENT ===
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-key

# === MONITORING ===
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# === CACHING ===
REDIS_URL=redis://localhost:6379
```

## 🔒 Security Best Practices

### 1. Environment Variable Security

- **Never commit `.env` files to version control**
- Use different credentials for development, staging, and production
- Rotate credentials regularly (quarterly minimum)
- Use strong, unique passwords for each environment

### 2. Break-Glass Credentials

- Store break-glass credentials in a secure password manager
- Test recovery mode access quarterly
- Document the recovery process for your team
- Limit break-glass access to essential operations only

### 3. Encryption Keys

- Generate unique encryption keys for each environment
- Store keys securely (Azure Key Vault, AWS Secrets Manager, etc.)
- Never reuse encryption keys across environments
- Implement key rotation procedures

### 4. Access Control

- Limit who has access to production environment variables
- Use role-based access control for environment management
- Audit access to sensitive configuration regularly
- Implement approval workflows for credential changes

## 🧪 Development Setup

### Local Development (.env.local)

```bash
# === LOCAL DEVELOPMENT ===
DATABASE_URL=postgresql://postgres:password@localhost:5432/streamflow_dev
MASTER_ENC_KEY=dev-key-not-for-production-use-only

# Provider break-glass (development only)
PROVIDER_ADMIN_EMAIL=dev@streamflow.local
PROVIDER_ADMIN_PASSWORD_HASH=$2a$12$dev.hash.for.testing.only
DEVELOPER_ADMIN_EMAIL=dev@streamflow.local
ACCOUNTANT_ADMIN_EMAIL=dev@streamflow.local

# External services (use test/sandbox keys)
STRIPE_SECRET_KEY=sk_test_your-test-key
OPENAI_API_KEY=sk-test-key-or-leave-empty
```

## 🔄 Environment Variable Validation

The system automatically validates required environment variables on startup:

```javascript
// Validation occurs in src/lib/env-validation.ts
const requiredVars = [
  'DATABASE_URL',
  'MASTER_ENC_KEY',
  'PROVIDER_ADMIN_EMAIL',
  'PROVIDER_ADMIN_PASSWORD_HASH'
];
```

## 🆘 Recovery Procedures

### Database Outage Recovery

1. **Automatic Detection**: System detects database unavailability
2. **Recovery Mode Activation**: Break-glass authentication activates
3. **Limited Operations**: Only essential provider functions available
4. **Recovery Banner**: UI shows "RECOVERY MODE" warning
5. **Audit Logging**: All recovery actions are logged

### Credential Compromise Response

1. **Immediate Action**: Rotate compromised credentials
2. **Update Environment**: Deploy new credentials to all environments
3. **Audit Review**: Check logs for unauthorized access
4. **Team Notification**: Inform security team of incident

## 📋 Deployment Checklist

- [ ] All required environment variables configured
- [ ] Password hashes generated with bcrypt cost ≥ 12
- [ ] TOTP secrets generated and tested
- [ ] Encryption keys are unique per environment
- [ ] External service credentials are valid
- [ ] Break-glass access tested and documented
- [ ] Monitoring and alerting configured
- [ ] Backup procedures established

## 🔍 Troubleshooting

### Common Issues

1. **"MASTER_ENC_KEY not configured"**
   - Ensure MASTER_ENC_KEY is set and is a valid base64 string

2. **"Provider authentication failed"**
   - Verify PROVIDER_ADMIN_PASSWORD_HASH matches your password
   - Check PROVIDER_ADMIN_EMAIL is correct

3. **"Database connection failed"**
   - Verify DATABASE_URL format and credentials
   - Check database server is running and accessible

4. **"Recovery mode not working"**
   - Ensure break-glass environment variables are set
   - Verify password hash generation is correct

### Support

For environment setup assistance, contact the StreamFlow development team or refer to the comprehensive documentation in the `/docs` directory.

---

**⚠️ SECURITY REMINDER**: This configuration contains sensitive security information. Treat this document as confidential and follow your organization's security policies for credential management.
