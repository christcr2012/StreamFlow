# Implementation Checklist - Micro-Worker & Optimizations

## Status: ✅ Core Implementation Complete

This checklist tracks the implementation of the micro-worker system and Neon/Vercel optimizations from `$$$.txt`.

## 1. Micro-Worker System (BullMQ + Upstash Redis)

### Core Infrastructure ✅

- [x] Create `packages/queue` package
  - [x] Job type definitions (8 types)
  - [x] Queue configuration
  - [x] Job processor stubs
  - [x] TypeScript configuration

- [x] Create `services/worker` service
  - [x] Environment validation
  - [x] Queue connection setup
  - [x] Processor registration
  - [x] HTTP health server
  - [x] Graceful shutdown
  - [x] Dockerfile
  - [x] Fly.io configuration

- [x] Create enqueue helper
  - [x] `src/lib/queue/enqueue.ts`
  - [x] Job enqueueing function
  - [x] Job status checking

- [x] Update monorepo configuration
  - [x] Add `services/*` to workspaces
  - [x] Add BullMQ dependency

### Job Processors (Stubs Created) ⚠️

- [x] CSV Import (`csv.import`) - Stub only
- [x] Schedule Expand (`schedule.expand`) - Stub only
- [x] Billing Close Day (`billing.closeDay`) - Stub only
- [x] Inspections Generate (`inspections.generate`) - Stub only
- [x] S3 Image Process (`s3.image.process`) - Stub only
- [x] PDF Generate (`pdf.generate`) - Stub only
- [x] Vendor Sync (`vendor.sync`) - Stub only
- [x] Stripe Fanout (`stripe.fanout`) - Partial implementation

### API Route Refactoring ⚠️

- [x] Stripe webhook → enqueue (DONE)
- [ ] CSV import endpoint → enqueue
- [ ] Cron endpoints → enqueue
  - [ ] Schedule expansion cron
  - [ ] Billing close cron
  - [ ] Inspection generation cron

### Deployment 🔴

- [ ] Deploy Upstash Redis
  - [ ] Create database
  - [ ] Copy connection URL
  - [ ] Add to Vercel env vars

- [ ] Deploy Worker to Fly.io
  - [ ] Install flyctl
  - [ ] Run `flyctl launch`
  - [ ] Set secrets
  - [ ] Verify health endpoint

- [ ] Test end-to-end
  - [ ] Enqueue test job
  - [ ] Verify processing
  - [ ] Check logs

## 2. Neon/Vercel Optimizations

### Database Configuration ⚠️

- [ ] Update DATABASE_URL to use Neon pooler
  - Current: `postgresql://user:pass@ep-xxx.neon.tech/db`
  - Target: `postgresql://user:pass@ep-xxx-pooler.neon.tech/db`
  - [ ] Update in Vercel env vars
  - [ ] Update in local .env

- [ ] Add connection pool limit to Prisma schema
  - [ ] Root schema: `connection_limit = 5`
  - [ ] Provider schema: `connection_limit = 5`

### Runtime Optimizations ⚠️

- [x] Health check endpoint (`/api/health/db`) ✅
- [x] Slow query logging (Prisma middleware) ✅
- [ ] Mark read-only endpoints as Edge runtime
  - [ ] Dashboard summary
  - [ ] Analytics endpoints
  - [ ] List endpoints
- [ ] Add ISR to dashboard pages
  - [ ] Main dashboard: `revalidate = 300`
  - [ ] Analytics pages: `revalidate = 600`
  - [ ] Customer lists: `revalidate = 300`

### Bundle Optimization 🔴

- [ ] Add outputFileTracingExcludes to next.config.js
  - [ ] Exclude unused SWC binaries
  - [ ] Exclude unused esbuild binaries

### Monitoring 🔴

- [ ] Add database metrics to Provider Portal
  - [ ] Connection pool usage
  - [ ] Slow query count
  - [ ] Query volume
  - [ ] Error rate
- [ ] Add queue metrics to Provider Portal
  - [ ] Queue depth
  - [ ] Processing rate
  - [ ] Failed jobs
  - [ ] Worker uptime

## 3. OpenAI Compliance

### Documentation ✅

- [x] Create compliance disclosure document
  - [x] Explain data sharing with OpenAI
  - [x] List client responsibilities
  - [x] Identify AI-powered features
  - [x] Provide opt-out instructions

### Implementation 🔴

- [ ] Add disclosure to client onboarding
- [ ] Add AI feature markers (🤖 icon)
- [ ] Add "Powered by OpenAI" labels
- [ ] Create opt-out mechanism
- [ ] Update terms of service

## 4. Testing & Validation

### Unit Tests 🔴

- [ ] Queue package tests
  - [ ] Job type validation
  - [ ] Enqueue function
  - [ ] Status checking
- [ ] Worker processor tests
  - [ ] Each processor stub
  - [ ] Error handling
  - [ ] Retry logic

### Integration Tests 🔴

- [ ] End-to-end queue flow
  - [ ] Enqueue → Process → Complete
  - [ ] Enqueue → Process → Fail → Retry
  - [ ] Idempotency testing
- [ ] Stripe webhook flow
  - [ ] Signature verification
  - [ ] Event enqueueing
  - [ ] Event processing

### Acceptance Tests (from spec §12) 🔴

- [ ] Stripe webhook processes within 30s
- [ ] CSV import (10k rows) under 3 minutes
- [ ] Cleaning RRULE expansion creates 28 days WOs
- [ ] Billing close-day generates correct billables
- [ ] Worker resilience (restart recovery)
- [ ] Cost: worker monthly cost ≤ $15

## 5. Documentation

### Created ✅

- [x] `docs/MICRO_WORKER_IMPLEMENTATION.md` - Implementation summary
- [x] `docs/OPENAI_COMPLIANCE_DISCLOSURE.md` - Client disclosure
- [x] `docs/NEON_VERCEL_OPTIMIZATIONS.md` - Performance guide
- [x] `services/worker/DEPLOYMENT.md` - Deployment guide
- [x] `docs/IMPLEMENTATION_CHECKLIST.md` - This file

### Needed 🔴

- [ ] Update main README with worker info
- [ ] Add queue usage examples to docs
- [ ] Create troubleshooting guide
- [ ] Add monitoring dashboard guide

## Priority Order

### Phase 1: Deploy Core (Do First) 🔥

1. Deploy Upstash Redis
2. Deploy Worker to Fly.io
3. Test Stripe webhook flow
4. Update DATABASE_URL to pooler endpoint

### Phase 2: Implement Processors (Next)

1. CSV import processor
2. Schedule expansion processor
3. Billing close processor
4. Refactor cron endpoints

### Phase 3: Optimize & Monitor (Then)

1. Add Edge runtime to read endpoints
2. Add ISR to dashboards
3. Implement monitoring dashboards
4. Add OpenAI compliance to UI

### Phase 4: Test & Validate (Finally)

1. Run acceptance tests
2. Load testing
3. Cost validation
4. Documentation review

## Quick Start Commands

```bash
# Install dependencies
npm install

# Build queue package
cd packages/queue && npm run build

# Build worker
cd services/worker && npm run build

# Deploy worker (after Upstash setup)
cd services/worker
flyctl launch --now
flyctl secrets set REDIS_URL="..." DATABASE_URL="..." ...

# Test locally
cd services/worker
npm run dev
```

## Cost Tracking

| Service | Expected Cost | Actual Cost |
|---------|---------------|-------------|
| Upstash Redis | $0-10/mo | TBD |
| Fly.io Worker | $2-15/mo | TBD |
| **Total** | **$2-25/mo** | **TBD** |

## Notes

- Worker processors are currently stubs - need full implementation
- Stripe webhook is refactored but needs testing
- Database optimizations need Vercel env var updates
- OpenAI compliance needs UI integration
- All acceptance tests need to be run after deployment

## Last Updated

2025-01-20 - Initial implementation complete, deployment pending

