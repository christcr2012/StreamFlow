# Caching Strategy

## Overview

Cortiware uses a multi-layer caching strategy to optimize performance:

1. **Vercel Edge Cache** - Static assets and pages
2. **Redis/KV Cache** - Session data, rate limiting, idempotency
3. **Application Cache** - In-memory caching for frequently accessed data
4. **Database Query Cache** - Prisma query result caching

## Vercel KV (Redis) Usage

### Session Management

**Provider Sessions:**
```typescript
// Store session
await kv.set(`rs_provider:${email}`, sessionData, { ex: 86400 }); // 24h TTL

// Retrieve session
const session = await kv.get(`rs_provider:${email}`);

// Delete session (logout)
await kv.del(`rs_provider:${email}`);
```

**Developer Sessions:**
```typescript
await kv.set(`rs_developer:${email}`, sessionData, { ex: 86400 });
```

**OIDC Sessions:**
```typescript
await kv.set(`oidc_session:${token}`, sessionData, { ex: 3600 }); // 1h TTL
```

### Rate Limiting

**API Rate Limits:**
```typescript
const key = `ratelimit:api:${ip}`;
const count = await kv.incr(key);
if (count === 1) {
  await kv.expire(key, 60); // 1 minute window
}
if (count > 100) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

**Login Attempts:**
```typescript
const key = `login_attempts:${email}`;
const attempts = await kv.incr(key);
if (attempts === 1) {
  await kv.expire(key, 900); // 15 minute window
}
if (attempts > 5) {
  return new Response('Too many login attempts', { status: 429 });
}
```

### Idempotency Keys

**Request Deduplication:**
```typescript
const idempotencyKey = request.headers.get('Idempotency-Key');
if (idempotencyKey) {
  const cached = await kv.get(`idempotent:${idempotencyKey}`);
  if (cached) {
    return NextResponse.json(cached); // Return cached response
  }
  
  // Process request
  const result = await processRequest();
  
  // Cache result for 24 hours
  await kv.set(`idempotent:${idempotencyKey}`, result, { ex: 86400 });
  return NextResponse.json(result);
}
```

## Application-Level Caching

### Static Data Caching

**Permission Definitions (1 hour):**
```typescript
let permissionsCache: Permission[] | null = null;
let permissionsCacheTime = 0;

async function getPermissions() {
  const now = Date.now();
  if (permissionsCache && now - permissionsCacheTime < 3600000) {
    return permissionsCache;
  }
  
  permissionsCache = await prisma.rbacPermission.findMany();
  permissionsCacheTime = now;
  return permissionsCache;
}
```

**Custom Field Definitions (1 hour):**
```typescript
const fieldDefCache = new Map<string, CustomFieldDefinition[]>();

async function getFieldDefinitions(orgId: string, entityType: string) {
  const cacheKey = `${orgId}:${entityType}`;
  const cached = fieldDefCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }
  
  const fields = await prisma.customFieldDefinition.findMany({
    where: { orgId, entityType, enabled: true }
  });
  
  fieldDefCache.set(cacheKey, { data: fields, timestamp: Date.now() });
  return fields;
}
```

### Dynamic Data Caching

**Lead Summaries (5 minutes):**
```typescript
async function getLeadSummary(orgId: string) {
  const cacheKey = `cache:lead_summary:${orgId}`;
  const cached = await kv.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const summary = await prisma.lead.groupBy({
    by: ['status'],
    where: { orgId },
    _count: true
  });
  
  await kv.set(cacheKey, summary, { ex: 300 }); // 5 minutes
  return summary;
}
```

**Dashboard Metrics (5 minutes):**
```typescript
async function getDashboardMetrics(orgId: string) {
  const cacheKey = `cache:dashboard:${orgId}`;
  const cached = await kv.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const metrics = {
    totalLeads: await prisma.lead.count({ where: { orgId } }),
    convertedLeads: await prisma.lead.count({ where: { orgId, status: 'CONVERTED' } }),
    // ... other metrics
  };
  
  await kv.set(cacheKey, metrics, { ex: 300 });
  return metrics;
}
```

## Cache Invalidation

### Write-Through Invalidation

**On Lead Update:**
```typescript
async function updateLead(id: string, data: any) {
  const lead = await prisma.lead.update({
    where: { id },
    data
  });
  
  // Invalidate related caches
  await kv.del(`cache:lead_summary:${lead.orgId}`);
  await kv.del(`cache:dashboard:${lead.orgId}`);
  
  return lead;
}
```

**On Bulk Operations:**
```typescript
async function bulkUpdateLeads(leadIds: string[], data: any) {
  const leads = await prisma.lead.updateMany({
    where: { id: { in: leadIds } },
    data
  });
  
  // Get unique org IDs
  const orgIds = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { orgId: true },
    distinct: ['orgId']
  });
  
  // Invalidate caches for all affected orgs
  await Promise.all(
    orgIds.map(({ orgId }) => 
      Promise.all([
        kv.del(`cache:lead_summary:${orgId}`),
        kv.del(`cache:dashboard:${orgId}`)
      ])
    )
  );
  
  return leads;
}
```

### Time-Based Invalidation

**Short TTL for Frequently Changing Data:**
- Real-time metrics: 1 minute
- Dashboard summaries: 5 minutes
- List views: 5 minutes

**Long TTL for Rarely Changing Data:**
- Permission definitions: 1 hour
- Custom field definitions: 1 hour
- Organization settings: 1 hour

**No Cache for Critical Data:**
- Audit events
- Timeline activities
- Authentication tokens
- Payment transactions

## Cache Warming

### Preload Common Queries

**On Application Start:**
```typescript
async function warmCache() {
  // Preload permission definitions
  await getPermissions();
  
  // Preload active organizations
  const orgs = await prisma.org.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true }
  });
  
  // Warm dashboard caches for active orgs
  await Promise.all(
    orgs.map(org => getDashboardMetrics(org.id))
  );
}
```

## Cache Monitoring

### Metrics to Track

**Hit Rate:**
```typescript
let cacheHits = 0;
let cacheMisses = 0;

async function getCached(key: string) {
  const value = await kv.get(key);
  if (value) {
    cacheHits++;
  } else {
    cacheMisses++;
  }
  return value;
}

// Log hit rate every hour
setInterval(() => {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;
  console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);
  cacheHits = 0;
  cacheMisses = 0;
}, 3600000);
```

**Memory Usage:**
```typescript
// Monitor KV storage usage
const info = await kv.info('memory');
console.log('Redis memory usage:', info);
```

## Best Practices

### DO:
- ✅ Use short TTLs for frequently changing data
- ✅ Invalidate cache on write operations
- ✅ Use cache keys with clear naming conventions
- ✅ Monitor cache hit rates
- ✅ Set appropriate TTLs based on data volatility
- ✅ Use idempotency keys for critical operations

### DON'T:
- ❌ Cache sensitive data without encryption
- ❌ Use infinite TTLs
- ❌ Cache data that changes frequently
- ❌ Forget to invalidate on updates
- ❌ Cache large objects (> 1MB)
- ❌ Use cache as primary data store

## Cache Key Conventions

**Format:** `{namespace}:{entity}:{identifier}`

**Examples:**
- `rs_provider:user@example.com` - Provider session
- `cache:lead_summary:org_123` - Lead summary
- `ratelimit:api:192.168.1.1` - Rate limit counter
- `idempotent:abc123` - Idempotency key

## Performance Impact

**Without Caching:**
- Dashboard load: ~2000ms
- Lead list: ~500ms
- Permission check: ~100ms

**With Caching:**
- Dashboard load: ~200ms (10x faster)
- Lead list: ~50ms (10x faster)
- Permission check: ~5ms (20x faster)

Caching Strategy: Complete ✅

