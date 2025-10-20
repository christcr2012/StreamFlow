# Neon + Vercel Performance Optimizations

## Overview

This document outlines performance optimizations for Cortiware's Neon PostgreSQL + Vercel deployment.

## Quick Wins (Implement Now)

### 1. Use Neon's Pooled Connection Endpoint

**Current**: Direct connection to Neon
**Optimized**: Use Neon's connection pooler

```env
# .env.local and Vercel environment variables
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

**Benefits**:
- Handles connection pooling automatically
- Reduces connection overhead
- Better for serverless (Vercel Functions)

### 2. Keep Prisma Pool Size Tiny

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Serverless-optimized connection pool
  connection_limit = 5
}
```

**Why**: Vercel Functions are ephemeral. Large pools waste connections.

### 3. Mark Hot Read Endpoints as Edge Runtime

For pure data-fetch endpoints (no Node.js APIs):

```typescript
// src/app/api/dashboard/summary/route.ts
export const runtime = 'edge'; // Instead of 'nodejs'
export const dynamic = 'force-dynamic';

export async function GET() {
  // Pure fetch/JSON operations only
}
```

**When to use Edge**:
- ✅ Simple data queries
- ✅ JSON responses
- ✅ No file system access
- ❌ Complex Prisma queries (use nodejs)
- ❌ PDF generation (use nodejs)

### 4. ISR for List Endpoints

For dashboards and catalogs that don't need real-time data:

```typescript
// src/app/dashboard/page.tsx
export const revalidate = 300; // 5 minutes

export default async function DashboardPage() {
  // This page is regenerated every 5 minutes
}
```

**Good candidates**:
- Analytics dashboards
- Customer lists
- Asset catalogs
- Pricing tables

### 5. Slim Serverless Bundles

In `next.config.js`:

```javascript
module.exports = {
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },
};
```

### 6. CSV Import Behind Queue

**Before**: CSV parsing in API route (timeout risk)
**After**: Upload to S3, enqueue processing

```typescript
// src/app/api/import/route.ts
export async function POST(req: Request) {
  const file = await req.formData();
  
  // 1. Upload to S3
  const s3Key = await uploadToS3(file);
  
  // 2. Enqueue for processing
  await enqueue('import', 'csv.import', {
    orgId,
    kind: 'customers',
    s3Key,
    idempotencyKey: generateId(),
  });
  
  return json({ queued: true, jobId });
}
```

### 7. Health Check Endpoint

Already implemented at `/api/health/db`:

```bash
curl https://your-app.vercel.app/api/health/db
```

Response:
```json
{
  "ok": true,
  "database": "connected",
  "latency_ms": 45,
  "timestamp": "2025-01-20T..."
}
```

### 8. Slow Query Logging

Add to Prisma middleware:

```typescript
// src/lib/prisma.ts
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    console.warn(`[slow-query] ${params.model}.${params.action} took ${duration}ms`);
  }
  
  return result;
});
```

## Neon-Specific Features

### Preview Branches

Use Neon branching for PR previews:

```bash
# Create branch for PR
neon branches create --name pr-123 --parent main

# Get connection string
neon connection-string pr-123

# Set in Vercel preview deployment
vercel env add DATABASE_URL preview
```

**Benefits**:
- Isolated test data per PR
- Automatic migrations
- No production data pollution

### Read Replicas (Future)

When read load increases:

```typescript
// Read from replica
const DATABASE_READ_URL = process.env.DATABASE_READ_URL;

// Write to primary
const DATABASE_WRITE_URL = process.env.DATABASE_URL;
```

## Monitoring

### Add to Provider Portal

Create `/provider/infrastructure/database` page showing:

- Connection pool usage
- Slow queries (>1s)
- Query volume
- Error rate
- Neon compute hours

### Metrics to Track

1. **P95 Query Latency** - Should be <100ms
2. **Connection Pool Saturation** - Should be <80%
3. **Slow Query Count** - Should be <10/hour
4. **Failed Queries** - Should be <0.1%

## Cost Guards

### 1. AI & SMS Behind Wallet

Already implemented with 402 guard:

```typescript
// src/middleware/wallet.ts
export function withWalletGuard(minBalance: number) {
  return async (req: Request) => {
    const balance = await getWalletBalance(orgId);
    if (balance < minBalance) {
      return new Response('Payment Required', { status: 402 });
    }
  };
}
```

### 2. Batch Write Job Events

Instead of individual inserts:

```typescript
// Bad: N queries
for (const event of events) {
  await prisma.jobEvent.create({ data: event });
}

// Good: 1 query
await prisma.jobEvent.createMany({ data: events });
```

### 3. Compress Images Client-Side

Before upload:

```typescript
// Client-side compression
import imageCompression from 'browser-image-compression';

const compressed = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
});
```

## Migration to Supabase (Future)

**Only consider if you need ALL of**:
1. Built-in Auth (replace current auth)
2. Realtime subscriptions (for dispatch board)
3. Storage (replace S3)

**Migration steps** (if needed):
1. Map RLS policies
2. Migrate file uploads to Supabase Storage
3. Replace WebSocket layer with Supabase Realtime
4. Optional: Use Edge Functions for API routes

**Decision**: Stay with Neon + Vercel for now. Supabase adds complexity without clear benefit.

## Quick Reference

| Optimization | Impact | Effort | Priority |
|--------------|--------|--------|----------|
| Pooled endpoint | High | Low | ✅ Do now |
| Tiny pool size | High | Low | ✅ Do now |
| Edge runtime | Medium | Medium | ✅ Do now |
| ISR | Medium | Low | ✅ Do now |
| Slim bundles | Low | Low | ✅ Do now |
| Queue CSV | High | Medium | ✅ Do now |
| Health check | Low | Low | ✅ Done |
| Slow query log | Medium | Low | ✅ Do now |
| Preview branches | Medium | Medium | Later |
| Read replicas | High | High | Later |

## Implementation Checklist

- [x] Health check endpoint (`/api/health/db`)
- [x] Queue system for CSV imports
- [ ] Update DATABASE_URL to use pooler endpoint
- [ ] Add Prisma connection_limit = 5
- [ ] Mark read-only endpoints as Edge runtime
- [ ] Add ISR to dashboard pages
- [ ] Implement slow query logging
- [ ] Add database metrics to Provider Portal
- [ ] Configure Neon preview branches for PRs
- [ ] Document cost optimization in runbook

## Resources

- [Neon Pooler Docs](https://neon.tech/docs/connect/connection-pooling)
- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [Next.js ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Prisma Connection Pool](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

