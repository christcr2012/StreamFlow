# 🚀 Fly.io Worker Deployment Guide

## ✅ Prerequisites Complete

- ✅ Redis: Using existing Vercel KV (already configured)
- ✅ Code: Worker service ready in `services/worker`
- ✅ Database: Neon PostgreSQL configured

## 📋 What You Need

1. **Fly.io Account** (free signup, ~$2-5/month for worker)
2. **Credit Card** (required for deployment, but free tier available)
3. **10 minutes** of your time

---

## Step 1: Install Fly.io CLI

### Windows (PowerShell - Run as Administrator)

```powershell
# Install Fly CLI
iwr https://fly.io/install.ps1 -useb | iex

# Verify installation
flyctl version
```

If you get an error about execution policy:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Alternative: Download Installer
- Visit: https://fly.io/docs/hands-on/install-flyctl/
- Download Windows installer
- Run and follow prompts

---

## Step 2: Sign Up & Login

```bash
# Open browser for signup/login
flyctl auth login

# This will:
# 1. Open browser
# 2. Sign up with email or GitHub
# 3. Add credit card (required, but won't charge unless you exceed free tier)
# 4. Authenticate CLI
```

**Cost Info**:
- Free tier: $5/month credit
- Worker cost: ~$2-5/month (auto-scales to 0 when idle)
- You'll get email alerts before charges

---

## Step 3: Get Environment Variables

You'll need these values for the worker. Let me help you get them:

### 3.1 Get Redis URL from Vercel

```bash
# Option A: Use Vercel CLI
vercel env pull .env.worker

# Option B: Get from Vercel dashboard
# Go to: https://vercel.com/cortiware/cortiware-tenant-app/settings/environment-variables
# Copy the value of: KV_REDIS_URL or REDIS_URL
```

The Redis URL should look like:
```
rediss://default:xxx@xxx.upstash.io:6379
```

### 3.2 Get Database URL from Vercel

```bash
# Same as above - get DATABASE_URL from Vercel
# Should look like:
postgresql://user:pass@ep-xxx-pooler.neon.tech/cortiware_provider?sslmode=require
```

### 3.3 Get Stripe Keys (if using Stripe features)

```bash
# From Vercel env vars:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
```

---

## Step 4: Deploy Worker to Fly.io

```bash
# Navigate to worker directory
cd services/worker

# Launch app (first time deployment)
flyctl launch --now

# You'll be prompted:
# ✓ App name: cortiware-worker (or choose your own)
# ✓ Region: iad (US East - same as Vercel/Neon)
# ✓ Postgres: No (we use Neon)
# ✓ Redis: No (we use Vercel KV)
# ✓ Deploy now: Yes
```

This will:
1. Create `fly.toml` config (already exists, will use it)
2. Build Docker image
3. Deploy to Fly.io
4. Assign a URL: `https://cortiware-worker.fly.dev`

---

## Step 5: Set Environment Variables (Secrets)

```bash
# Set all required secrets at once
flyctl secrets set \
  REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379" \
  DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/cortiware_provider?sslmode=require" \
  WORKER_CONCURRENCY="8" \
  WORKER_MAX_RETRIES="5" \
  WORKER_BACKOFF_MS="15000" \
  STRIPE_SECRET_KEY="sk_test_xxx" \
  STRIPE_WEBHOOK_SECRET="whsec_xxx"

# This will trigger an automatic redeploy
```

**Replace the values**:
- `REDIS_URL`: Your Vercel KV connection string
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `STRIPE_SECRET_KEY`: From Vercel env vars (if using Stripe)
- `STRIPE_WEBHOOK_SECRET`: From Vercel env vars (if using Stripe)

---

## Step 6: Verify Deployment

### 6.1 Check Status

```bash
# View app status
flyctl status

# Should show:
# ✓ Status: running
# ✓ Health: passing
# ✓ Instances: 1
```

### 6.2 View Logs

```bash
# Stream live logs
flyctl logs

# You should see:
# [env] Configuration loaded
# [queues] Registering 8 workers
# [server] Worker listening on port 8080
```

### 6.3 Test Health Endpoint

```bash
# Test health check
curl https://cortiware-worker.fly.dev/health

# Should return:
# {"ok":true,"ts":1234567890}
```

---

## Step 7: Configure Auto-Scaling (Cost Optimization)

```bash
# Set to auto-scale: min=0, max=2
flyctl autoscale set min=0 max=2

# This means:
# - Worker stops when idle (saves money)
# - Auto-starts when jobs arrive
# - Can scale to 2 instances under heavy load
```

**Cost Impact**:
- Idle: $0/hour (stopped)
- Running: ~$0.01/hour (~$7/month if always on)
- With auto-stop: ~$2-5/month (typical usage)

---

## Step 8: Test End-to-End

### 8.1 Trigger a Test Job

From your local machine or Vercel function:

```typescript
// Test enqueueing a job
import { enqueue, QUEUE_NAMES } from '@cortiware/queue';

const job = await enqueue(
  QUEUE_NAMES.STRIPE,
  'test.job',
  {
    orgId: 'test-org',
    idempotencyKey: 'test-' + Date.now(),
    webhookId: 'test-webhook',
    eventType: 'customer.subscription.created',
    payload: { id: 'sub_test' }
  }
);

console.log('Job enqueued:', job.id);
```

### 8.2 Check Worker Logs

```bash
# Watch logs for job processing
flyctl logs

# You should see:
# [stripe-fanout] Processing customer.subscription.created (test-webhook)
# [stripe-fanout] Subscription event: customer.subscription.created
```

### 8.3 Test Stripe Webhook (if configured)

```bash
# Go to Stripe Dashboard → Webhooks
# Send test webhook
# Check Fly.io logs for processing
```

---

## 🎯 Success Criteria

After deployment, verify:

- ✅ Worker is running: `flyctl status`
- ✅ Health check passes: `curl https://cortiware-worker.fly.dev/health`
- ✅ Logs show workers registered: `flyctl logs`
- ✅ Auto-scaling configured: `flyctl autoscale show`
- ✅ Test job processes successfully

---

## 📊 Monitoring & Management

### View Metrics

```bash
# View app metrics
flyctl dashboard

# Opens browser with:
# - CPU/Memory usage
# - Request volume
# - Error rates
# - Cost tracking
```

### Scale Manually (if needed)

```bash
# Scale to specific count
flyctl scale count 2

# Scale VM size (if needed more resources)
flyctl scale vm shared-cpu-1x --memory 512
```

### Update Worker Code

```bash
# After making code changes
cd services/worker
flyctl deploy

# Or from repo root
flyctl deploy --config services/worker/fly.toml
```

### View Secrets

```bash
# List configured secrets (values hidden)
flyctl secrets list

# Remove a secret
flyctl secrets unset STRIPE_SECRET_KEY
```

---

## 🆘 Troubleshooting

### Worker won't start

```bash
# Check logs for errors
flyctl logs

# Common issues:
# - Missing REDIS_URL or DATABASE_URL
# - Invalid connection strings
# - Port conflicts (should use PORT=8080)
```

### Can't connect to Redis

```bash
# Verify REDIS_URL format
flyctl secrets list

# Should start with: rediss:// (note the double 's' for TLS)
# Test connection from worker:
flyctl ssh console
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log)"
```

### Database connection errors

```bash
# Verify DATABASE_URL includes ?sslmode=require
# Check Neon dashboard for connection limits
# Ensure using pooler endpoint: ep-xxx-pooler.neon.tech
```

### Jobs not processing

```bash
# Check queue depth in Vercel KV dashboard
# Verify worker is running: flyctl status
# Check worker logs: flyctl logs
# Test health endpoint: curl https://cortiware-worker.fly.dev/health
```

### High costs

```bash
# Check if auto-scaling is enabled
flyctl autoscale show

# Should show: min=0, max=2
# If not, set it:
flyctl autoscale set min=0 max=2

# View current usage
flyctl dashboard
```

---

## 🔄 Next Steps After Deployment

1. **Update Vercel Apps** - Ensure all apps can enqueue jobs
2. **Implement Job Processors** - Replace stubs with real logic
3. **Add Monitoring** - Set up alerts for failed jobs
4. **Test Stripe Webhooks** - Verify end-to-end flow
5. **Apply Optimizations** - Neon pooler, Edge runtime, ISR

---

## 📚 Useful Commands

```bash
# Quick reference
flyctl status              # Check app status
flyctl logs                # View logs
flyctl ssh console         # SSH into worker
flyctl dashboard           # Open metrics dashboard
flyctl secrets list        # List secrets
flyctl autoscale show      # Show scaling config
flyctl deploy              # Deploy updates
flyctl apps destroy        # Delete app (careful!)
```

---

## 💰 Cost Tracking

Monitor your costs:
- Fly.io Dashboard: https://fly.io/dashboard
- Billing: https://fly.io/dashboard/personal/billing
- Set budget alerts in dashboard

Expected monthly cost: **$2-5** (with auto-scaling)

---

## ✅ Deployment Complete!

Once you've completed all steps:

1. Worker is deployed and running
2. Auto-scaling is configured
3. Jobs are processing
4. Monitoring is set up

You're ready to implement the actual job processors and start using the queue system!

**Questions?** Check the troubleshooting section or Fly.io docs: https://fly.io/docs/

