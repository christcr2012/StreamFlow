# 🚀 Deployment Next Steps - Micro-Worker System

## ✅ Completed

1. **Code Implementation** - All micro-worker code is complete
2. **Vercel Environment Variables** - Added `REDIS_URL` to all 4 projects:
   - ✅ cortiware-provider-portal
   - ✅ cortiware-tenant-app  
   - ✅ cortiware-marketing-cortiware
   - ✅ cortiware-marketing-robinson

## 🔴 Required: Deploy Infrastructure

### Step 1: Deploy Upstash Redis (5 minutes)

1. **Sign up at Upstash**:
   ```bash
   # Visit: https://console.upstash.com/
   # Sign up with GitHub or email
   ```

2. **Create Redis Database**:
   - Click "Create Database"
   - Name: `cortiware-queue`
   - Type: Regional
   - Region: `us-east-1` (same as Vercel)
   - TLS: Enabled
   - Eviction: No eviction

3. **Copy Connection URL**:
   - Click on database → "Details" tab
   - Copy the **TLS (rediss://)** URL
   - Format: `rediss://default:AbCd1234...@us1-xxx.upstash.io:6379`

4. **Update Vercel Environment Variables**:
   ```bash
   # Replace PLACEHOLDER with real URL in all 4 projects
   # Go to: https://vercel.com/cortiware/settings/environment-variables
   
   # Or use Vercel CLI:
   vercel env rm REDIS_URL production
   vercel env add REDIS_URL production
   # Paste: rediss://default:xxx@us1-xxx.upstash.io:6379
   
   # Repeat for preview and development
   ```

### Step 2: Deploy Worker to Fly.io (10 minutes)

1. **Install Fly CLI**:
   ```powershell
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # Or download from: https://fly.io/docs/hands-on/install-flyctl/
   ```

2. **Login to Fly.io**:
   ```bash
   flyctl auth login
   # Opens browser for authentication
   ```

3. **Deploy Worker**:
   ```bash
   cd services/worker
   
   # Launch (creates app + deploys)
   flyctl launch --now
   
   # When prompted:
   # - App name: cortiware-worker
   # - Region: iad (US East, same as Vercel/Upstash)
   # - Postgres: No (we use Neon)
   # - Redis: No (we use Upstash)
   # - Deploy: Yes
   ```

4. **Set Environment Variables**:
   ```bash
   # Get DATABASE_URL from Vercel
   # Get REDIS_URL from Upstash
   
   flyctl secrets set \
     REDIS_URL="rediss://default:xxx@us1-xxx.upstash.io:6379" \
     DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/cortiware_provider?sslmode=require" \
     WORKER_CONCURRENCY="8" \
     WORKER_MAX_RETRIES="5" \
     WORKER_BACKOFF_MS="15000"
   
   # This will trigger a redeploy
   ```

5. **Verify Deployment**:
   ```bash
   # Check status
   flyctl status
   
   # View logs
   flyctl logs
   
   # Test health endpoint
   curl https://cortiware-worker.fly.dev/health
   # Should return: {"ok":true,"ts":1234567890}
   ```

### Step 3: Test End-to-End (5 minutes)

1. **Test Stripe Webhook**:
   ```bash
   # Go to Stripe Dashboard → Developers → Webhooks
   # Click on your webhook endpoint
   # Click "Send test webhook"
   # Select: customer.subscription.created
   # Click "Send test webhook"
   
   # Check Vercel logs (should see "enqueued")
   # Check Fly.io logs (should see processing)
   flyctl logs
   ```

2. **Test Database Health**:
   ```bash
   # Test provider portal
   curl https://cortiware-provider-portal.vercel.app/api/health/db
   
   # Test tenant app
   curl https://cortiware-tenant-app.vercel.app/api/health/db
   
   # Should return: {"ok":true,"database":"connected","latency_ms":45}
   ```

3. **Monitor Queue**:
   ```bash
   # Check Upstash dashboard
   # Visit: https://console.upstash.com/redis/xxx
   # Should see keys like: bull:stripe:* 
   ```

## 🟡 Recommended: Apply Optimizations

### Optimization 1: Use Neon Pooler Endpoint

**Why**: Reduces connection overhead, improves cold start performance

**How**:
1. Get pooler endpoint from Neon dashboard
2. Update `DATABASE_URL` in Vercel:
   ```
   # Change from:
   postgresql://user:pass@ep-xxx.neon.tech/db
   
   # To:
   postgresql://user:pass@ep-xxx-pooler.neon.tech/db
   ```

### Optimization 2: Add Prisma Connection Limits

**Why**: Prevents connection pool exhaustion on Vercel

**How**:
```prisma
// packages/db/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 5  // Add this line
}

// apps/tenant-app/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 5  // Add this line
}
```

Then run:
```bash
npm run db:generate
git add . && git commit -m "Add Prisma connection limits"
git push
```

### Optimization 3: Mark Read-Only Endpoints as Edge Runtime

**Why**: Faster cold starts, lower latency, lower cost

**How**: See `docs/NEON_VERCEL_OPTIMIZATIONS.md` for full list

Example:
```typescript
// src/app/api/customers/route.ts
export const runtime = 'edge';  // Add this line

export async function GET(req: Request) {
  // ... existing code
}
```

### Optimization 4: Add ISR to Dashboard Pages

**Why**: Reduces database load, improves page load time

**How**:
```typescript
// src/app/(tenant)/dashboard/page.tsx
export const revalidate = 300;  // Cache for 5 minutes

export default async function DashboardPage() {
  // ... existing code
}
```

## 📊 Cost Breakdown

| Service | Monthly Cost | Status |
|---------|--------------|--------|
| Upstash Redis (Free tier) | $0 | ⏳ Need to deploy |
| Fly.io Worker (Hobby) | $2-15 | ⏳ Need to deploy |
| Neon (existing) | ~$20 | ✅ Deployed |
| Vercel (existing) | ~$20 | ✅ Deployed |
| **Total New** | **$2-15** | **Ready to deploy** |

**Note**: Upstash free tier includes 10k commands/day. Fly.io auto-scales to 0 when idle.

## 🎯 Success Criteria

After deployment, verify:

- [ ] Stripe webhooks process within 30 seconds
- [ ] No Vercel timeout errors on long-running tasks
- [ ] Worker auto-scales to 0 when idle (check after 1 hour)
- [ ] Health endpoints return 200 OK
- [ ] Slow queries logged in Vercel logs
- [ ] Monthly cost ≤ $15 for worker

## 📚 Documentation

- **Implementation Guide**: `docs/MICRO_WORKER_IMPLEMENTATION.md`
- **Optimization Guide**: `docs/NEON_VERCEL_OPTIMIZATIONS.md`
- **Worker Deployment**: `services/worker/DEPLOYMENT.md`
- **Checklist**: `docs/IMPLEMENTATION_CHECKLIST.md`

## 🆘 Troubleshooting

### Worker won't start
```bash
flyctl logs
# Check for missing env vars or connection errors
```

### Vercel can't connect to Redis
```bash
# Verify REDIS_URL format (must start with rediss://)
# Check Upstash dashboard for connection errors
```

### Database connection errors
```bash
# Verify DATABASE_URL includes ?sslmode=require
# Check Neon dashboard for connection limits
```

### Jobs not processing
```bash
# Check Upstash dashboard for queue depth
# Check Fly.io logs for worker errors
flyctl logs --app cortiware-worker
```

## 🚀 Ready to Deploy!

**Estimated Time**: 20 minutes total
**Difficulty**: Easy (mostly copy-paste)
**Risk**: Low (can rollback by removing env vars)

Start with Step 1 (Upstash Redis) and work through sequentially.

**Questions?** Check the docs or ask for help!

