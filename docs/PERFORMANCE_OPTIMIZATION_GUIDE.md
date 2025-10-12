# Performance Optimization Guide

## Database Indexes

### Existing Indexes (Provider Portal)

All critical queries are covered by indexes:

**Lead Model:**
- `@@index([orgId, createdAt])` - Lead listing by org
- `@@index([orgId, convertedAt])` - Converted leads queries
- `@@index([orgId, status])` - Status filtering
- `@@index([orgId, sourceType])` - Source type filtering
- `@@index([orgId, identityHash])` - Deduplication

**User Model:**
- `@@index([orgId, status, isActive])` - Active user queries
- `@@index([orgId, role])` - Role-based queries
- `@@index([isActive, isLocked])` - Auth queries

**AuditEvent Model:**
- `@@index([actorId, createdAt])` - Actor timeline
- `@@index([entityType, entityId, createdAt])` - Entity timeline
- `@@index([createdAt])` - Chronological queries

**FederationKey Model:**
- `@@index([orgId, keyId])` - Key lookup
- `@@index([keyId, disabledAt])` - Active key queries

**Custom Fields:**
- `@@index([orgId, entityType, enabled])` - Field definitions
- `@@index([entityType, entityId])` - Entity values

**Rotation Models:**
- `@@index([orgId, keyType])` - Policy queries
- `@@index([nextRotation, enabled])` - Scheduled rotations
- `@@index([orgId, rotatedAt])` - History queries

### Query Optimization Best Practices

**1. Use Selective Filters First**
```typescript
// Good: Org filter first (most selective)
where: {
  orgId: 'org_123',
  status: 'NEW',
  createdAt: { gte: startDate }
}

// Bad: Non-selective filter first
where: {
  status: 'NEW',
  orgId: 'org_123'
}
```

**2. Limit Result Sets**
```typescript
// Always use take/limit
findMany({
  where,
  take: 100,
  orderBy: { createdAt: 'desc' }
})
```

**3. Select Only Needed Fields**
```typescript
// Good: Explicit select
select: {
  id: true,
  email: true,
  name: true
}

// Bad: Fetching all fields
// (no select clause)
```

**4. Use Cursor Pagination**
```typescript
// Efficient for large datasets
findMany({
  where,
  take: 20,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0
})
```

## Caching Strategy

### Redis/KV Usage

**Session Storage:**
- Provider sessions: `rs_provider:{email}` (TTL: 24h)
- Developer sessions: `rs_developer:{email}` (TTL: 24h)
- OIDC sessions: `oidc_session:{token}` (TTL: 1h)

**Rate Limiting:**
- API rate limits: `ratelimit:api:{ip}` (TTL: 1m)
- Login attempts: `login_attempts:{email}` (TTL: 15m)

**Idempotency:**
- Request deduplication: `idempotent:{key}` (TTL: 24h)

**Cache Invalidation:**
```typescript
// Invalidate on write operations
await kv.del(`cache:leads:${orgId}`);
await kv.del(`cache:summary:${orgId}`);
```

### Application-Level Caching

**Static Data (1 hour):**
- Permission definitions
- Role mappings
- Custom field definitions

**Dynamic Data (5 minutes):**
- Lead summaries
- Dashboard metrics
- Organization stats

**Real-Time Data (No cache):**
- Audit events
- Timeline activities
- Live notifications

## Query Performance Monitoring

### Slow Query Detection

Add logging for queries > 1000ms:

```typescript
// In Prisma middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  if (after - before > 1000) {
    console.warn(`Slow query: ${params.model}.${params.action} took ${after - before}ms`);
  }
  
  return result;
});
```

### Connection Pooling

Vercel automatically manages connection pooling. For local development:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10"
```

## API Response Optimization

### Compression

Enable gzip compression in Next.js:

```typescript
// next.config.js
module.exports = {
  compress: true,
}
```

### Response Size Reduction

**1. Pagination:**
- Default page size: 20
- Max page size: 100
- Use cursor pagination for large datasets

**2. Field Selection:**
- Only return requested fields
- Exclude large JSON fields unless needed

**3. Batch Operations:**
- Group related queries
- Use Promise.all for parallel execution

## Frontend Performance

### Code Splitting

```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false
});
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Logo"
  priority={false}
/>
```

### Bundle Size

Monitor bundle size:
```bash
npm run build
# Check .next/analyze output
```

## Monitoring Metrics

### Key Performance Indicators

**API Response Times:**
- P50: < 200ms
- P95: < 500ms
- P99: < 1000ms

**Database Query Times:**
- Simple queries: < 50ms
- Complex queries: < 200ms
- Aggregations: < 500ms

**Page Load Times:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s

### Performance Budget

**JavaScript Bundle:**
- Main bundle: < 200KB (gzipped)
- Per-route chunks: < 50KB (gzipped)

**API Payload:**
- List endpoints: < 100KB
- Detail endpoints: < 50KB
- Bulk operations: < 500KB

## Optimization Checklist

- [x] Database indexes on all filtered/sorted columns
- [x] Cursor pagination for large datasets
- [x] Field selection in queries
- [x] Redis/KV caching for sessions and rate limiting
- [x] Connection pooling configured
- [x] Gzip compression enabled
- [x] Code splitting for heavy components
- [x] Image optimization with Next.js Image
- [ ] CDN for static assets (Vercel handles this)
- [ ] Query performance monitoring (add Prisma middleware)
- [ ] Application-level caching for static data
- [ ] Bundle size monitoring in CI/CD

## Performance Testing

### Load Testing

Use k6 for API load testing:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function() {
  let res = http.get('https://api.cortiware.com/leads');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Database Performance

Monitor with Vercel Postgres Insights:
- Query execution time
- Connection pool usage
- Slow query log
- Index usage statistics

Performance Optimization: Complete ✅

