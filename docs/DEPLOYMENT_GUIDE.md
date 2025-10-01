# StreamFlow Deployment Guide

**Version**: 1.0.0-beta  
**Last Updated**: 2025-01-01

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Required Accounts:
- [ ] Vercel account (for hosting)
- [ ] Neon account (for PostgreSQL database)
- [ ] GitHub account (for repository)
- [ ] Domain registrar (optional, for custom domain)

### Required Tools:
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Vercel CLI installed (`npm i -g vercel`)

---

## 🔧 ENVIRONMENT VARIABLES

### Required Variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Provider Authentication (Break-glass)
PROVIDER_ADMIN_EMAIL="ops@yourdomain.com"
PROVIDER_ADMIN_PASSWORD_HASH="$argon2id$v=19$m=65536,t=3,p=4$..."  # Use argon2 or bcrypt
PROVIDER_ADMIN_TOTP_SECRET="KZXW6YTBOI2XIZLT"  # Base32 encoded

# Developer Authentication
DEVELOPER_EMAIL="dev@yourdomain.com"
DEVELOPER_PASSWORD="your-secure-password"

# Encryption
MASTER_ENC_KEY="base64-encoded-32-byte-key"  # Generate with: openssl rand -base64 32

# Logging
LOG_LEVEL="info"  # debug, info, warn, error, fatal
NODE_ENV="production"
```

### Optional Variables:

```bash
# External Services (TODO)
SENDGRID_API_KEY="SG...."
STRIPE_SECRET_KEY="sk_live_..."
SENTRY_DSN="https://..."
REDIS_URL="redis://..."
BULLMQ_REDIS_URL="redis://..."
```

---

## 🚀 DEPLOYMENT STEPS

### 1. Database Setup

#### Create Neon Database:
1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Add to Vercel environment variables as `DATABASE_URL`

#### Run Migrations:
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify database
npx prisma studio
```

### 2. Generate Secrets

#### Master Encryption Key:
```bash
openssl rand -base64 32
```

#### Provider Password Hash (using Node.js):
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

#### TOTP Secret (using Node.js):
```javascript
const speakeasy = require('speakeasy');
const secret = speakeasy.generateSecret({ length: 20 });
console.log(secret.base32);  // Use this for PROVIDER_ADMIN_TOTP_SECRET
console.log(secret.otpauth_url);  // Scan with authenticator app
```

### 3. Vercel Deployment

#### Link Project:
```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add PROVIDER_ADMIN_EMAIL
vercel env add PROVIDER_ADMIN_PASSWORD_HASH
vercel env add PROVIDER_ADMIN_TOTP_SECRET
vercel env add DEVELOPER_EMAIL
vercel env add DEVELOPER_PASSWORD
vercel env add MASTER_ENC_KEY
vercel env add LOG_LEVEL
```

#### Deploy:
```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

### 4. Post-Deployment Verification

#### Health Check:
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "checks": {
    "database": true,
    "cache": true,
    "queue": true
  }
}
```

#### Provider Login:
```bash
curl -X POST https://your-domain.vercel.app/api/provider/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ops@yourdomain.com",
    "password": "your-password",
    "totpCode": "123456"
  }'
```

#### Client Registration:
```bash
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "orgName": "Test Company"
  }'
```

---

## 🔒 SECURITY CHECKLIST

### Pre-Production:
- [ ] All environment variables set
- [ ] Strong passwords used
- [ ] TOTP 2FA enabled for provider
- [ ] Master encryption key generated securely
- [ ] Database connection uses SSL
- [ ] No secrets in code or git history

### Post-Production:
- [ ] Health check endpoint working
- [ ] Provider login working
- [ ] Client registration working
- [ ] Audit logs being created
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Cookies are HTTP-only and Secure

---

## 📊 MONITORING SETUP

### Vercel Analytics:
1. Enable Vercel Analytics in project settings
2. Monitor performance metrics
3. Set up alerts for errors

### Health Monitoring:
```bash
# Add to uptime monitoring service (e.g., UptimeRobot)
GET https://your-domain.vercel.app/api/health
```

### Log Monitoring:
```bash
# View logs in Vercel dashboard
vercel logs

# Or use Vercel CLI
vercel logs --follow
```

### Metrics Dashboard:
```bash
# Provider metrics endpoint
GET https://your-domain.vercel.app/api/provider/monitoring/metrics
```

---

## 🔄 MAINTENANCE

### Database Migrations:
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migration to production
npx prisma migrate deploy
```

### Backup Database:
```bash
# Neon provides automatic backups
# Manual backup:
pg_dump $DATABASE_URL > backup.sql
```

### Update Dependencies:
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test locally
npm run dev

# Deploy
vercel --prod
```

### Rotate Secrets:
1. Generate new secret
2. Add to Vercel environment variables
3. Redeploy application
4. Remove old secret

---

## 🐛 TROUBLESHOOTING

### Database Connection Issues:
```bash
# Test connection
npx prisma db pull

# Check connection string
echo $DATABASE_URL

# Verify SSL mode
# Should include: ?sslmode=require
```

### Build Failures:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm install

# Clear cache
rm -rf .next node_modules
npm install
```

### Provider Login Issues:
```bash
# Verify environment variables
vercel env ls

# Check password hash
# Should start with $2b$ (bcrypt) or $argon2id$ (argon2)

# Test TOTP code
# Use authenticator app to generate code
```

### Performance Issues:
```bash
# Check health endpoint
curl https://your-domain.vercel.app/api/health

# Check queue stats
curl https://your-domain.vercel.app/api/provider/queue/stats

# Check cache stats (in health response)
```

---

## 📈 SCALING

### Horizontal Scaling:
- Vercel automatically scales based on traffic
- No configuration needed
- Monitor usage in Vercel dashboard

### Database Scaling:
- Neon provides automatic scaling
- Upgrade plan for more connections
- Consider read replicas for heavy read workloads

### Caching:
- Current: In-memory cache (per-instance)
- Upgrade: Redis for shared cache
- Set `REDIS_URL` environment variable

### Background Jobs:
- Current: In-memory queue (per-instance)
- Upgrade: BullMQ with Redis
- Set `BULLMQ_REDIS_URL` environment variable

---

## 🎯 PRODUCTION BEST PRACTICES

### 1. Environment Separation:
- Use separate databases for dev/staging/prod
- Use different Vercel projects
- Never test in production

### 2. Monitoring:
- Set up uptime monitoring
- Enable error tracking (Sentry)
- Monitor performance metrics
- Set up alerts for critical issues

### 3. Backups:
- Neon provides automatic backups
- Test restore process regularly
- Keep backups for 30+ days

### 4. Security:
- Rotate secrets regularly (every 90 days)
- Monitor audit logs
- Review access logs
- Keep dependencies updated

### 5. Performance:
- Monitor response times
- Optimize slow queries
- Use caching effectively
- Enable CDN for static assets

---

## 📞 SUPPORT

### Documentation:
- System Overview: `docs/COMPLETE_SYSTEM_OVERVIEW.md`
- API Documentation: `docs/API_REFERENCE.md` (TODO)
- Code Review: `ops/CODE_REVIEW_AND_ENHANCEMENTS.md`

### Logs:
```bash
# View application logs
vercel logs --follow

# View database logs
# Check Neon dashboard
```

### Health Check:
```bash
# System health
GET /api/health

# Provider metrics
GET /api/provider/monitoring/metrics

# Queue stats
GET /api/provider/queue/stats
```

---

## 🎉 DEPLOYMENT COMPLETE!

Your StreamFlow instance is now live and ready for use!

### Next Steps:
1. Create first organization
2. Set up provider settings
3. Configure vertical settings
4. Test AI agents
5. Invite beta users
6. Monitor performance
7. Gather feedback

**Welcome to StreamFlow!** 🚀

