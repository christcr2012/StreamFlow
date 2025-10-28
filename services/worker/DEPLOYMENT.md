# Cortiware Worker Deployment Guide

## Overview

The Cortiware Worker is a background job processing service built with BullMQ and Node.js. It handles async tasks like CSV imports, schedule expansion, billing, inspections, vendor sync, and Stripe webhooks.

## Prerequisites

1. **Upstash Redis** - Queue storage
   - Sign up at https://upstash.com
   - Create a Redis database
   - Copy the connection URL (starts with `rediss://`)

2. **Fly.io Account** - Deployment platform
   - Sign up at https://fly.io
   - Install flyctl: `curl -L https://fly.io/install.sh | sh`
   - Login: `flyctl auth login`

## Environment Variables

Set these secrets in Fly.io:

```bash
flyctl secrets set \
  REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379" \
  DATABASE_URL="postgresql://..." \
  WORKER_CONCURRENCY="8" \
  WORKER_MAX_RETRIES="5" \
  WORKER_BACKOFF_MS="15000" \
  WORKER_DLQ_ENABLED="true" \
  S3_ENDPOINT="..." \
  S3_REGION="..." \
  S3_ACCESS_KEY_ID="..." \
  S3_SECRET_ACCESS_KEY="..." \
  S3_BUCKET="..." \
  STRIPE_SECRET_KEY="..." \
  STRIPE_WEBHOOK_SECRET="..."
```

## Deployment Steps

### 1. Build and Deploy

From the repository root:

```bash
# Navigate to worker directory
cd services/worker

# Launch on Fly.io (first time)
flyctl launch --now

# Or deploy updates
flyctl deploy
```

### 2. Scale Configuration

```bash
# Set to 1 machine (auto-stop when idle)
flyctl scale count 1

# Or set min/max for auto-scaling
flyctl autoscale set min=0 max=2
```

### 3. Monitor

```bash
# View logs
flyctl logs

# Check status
flyctl status

# SSH into machine
flyctl ssh console
```

## Vercel Configuration

Add these environment variables to your Vercel projects:

```
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
WORKER_MAX_RETRIES=5
WORKER_BACKOFF_MS=15000
```

## Testing

### Local Development

```bash
# Install dependencies
npm install

# Start worker locally
npm run dev
```

### Health Check

```bash
# Check worker health
curl https://cortiware-worker.fly.dev/health
```

Expected response:
```json
{
  "ok": true,
  "ts": 1234567890
}
```

## Cost Optimization

The worker is configured for minimal cost:

- **auto_stop_machines**: true - Stops when idle
- **auto_start_machines**: true - Starts on job arrival
- **min_machines_running**: 0 - No always-on machines

Expected monthly cost: **$2-$15** depending on usage.

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection:
   ```bash
   flyctl ssh console
   node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log)"
   ```

2. Check logs for errors:
   ```bash
   flyctl logs --app cortiware-worker
   ```

### Jobs stuck in queue

1. Check queue status using BullMQ Board (optional):
   ```bash
   npm install -g bull-board
   bull-board --redis $REDIS_URL
   ```

2. Manually retry failed jobs via admin dashboard (to be implemented)

## Monitoring

Add these to your monitoring dashboard:

- Queue depth (jobs waiting)
- Processing rate (jobs/minute)
- Error rate (failed jobs %)
- Worker uptime
- Average job duration

## Rollback

```bash
# List releases
flyctl releases

# Rollback to previous
flyctl releases rollback <version>
```

