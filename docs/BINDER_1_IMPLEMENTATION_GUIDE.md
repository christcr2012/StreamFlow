<!-- STATUS: Reference-only. Binder documents are non-executable guidance. Use codebase and current docs as the source of truth. See docs/AI_AGENT_REFERENCE.md. -->


# Binder 1: Leads API Implementation Guide

**Phase:** 1 - v2 CRM APIs Implementation
**Priority:** CRITICAL
**Estimated Time:** 3-5 days
**Dependencies:** None

---

## Overview

This binder implements the complete Leads API with service layer, Prisma integration, deduplication, pagination, and comprehensive tests. This is the first step in closing the architecture gaps and unblocks the client portal migration.

---

## Pre-Implementation Checklist

- [ ] Read `docs/ARCHITECTURE_GAP_CLOSURE_PLAN.md`
- [ ] Review `docs/ARCHITECTURE_OVERVIEW.md` section on v2 APIs
- [ ] Understand Prisma Lead model (`prisma/schema.prisma` lines 295-338)
- [ ] Review existing validation (`src/lib/validation/leads.ts`)
- [ ] Review existing middleware (`src/lib/api/middleware.ts`)
- [ ] Ensure local dev environment is working (`npm run dev`)
- [ ] Ensure tests are passing (`npm run test`)

---

## Implementation Steps

### Step 1: Implement leadService.list() with Prisma

**File:** `src/services/leads.service.ts`

**Current State:**
```typescript
async list(_orgId, _params) {
  // TODO(sonnet): Prisma query with org scoping, search, and cursor pagination
  throw new Error('Not implemented');
}
```

**Implementation:**
```typescript
async list(orgId: string, params: { q?: string; status?: string; cursor?: string; limit?: number }) {
  const { q, status, cursor, limit = 20 } = params;

  // Build where clause
  const where: any = { orgId };

  // Add search filter
  if (q) {
    where.OR = [
      { company: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Add status filter
  if (status) {
    where.status = status;
  }

  // Cursor pagination
  const items = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // Fetch one extra to determine if there's a next page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  // Determine next cursor
  const hasMore = items.length > limit;
  const results = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return { items: results, nextCursor };
}
```

**Key Points:**
- Org scoping is CRITICAL for multi-tenancy
- Use case-insensitive search (`mode: 'insensitive'`)
- Cursor-based pagination (not offset) for performance
- Fetch limit+1 to determine if there's a next page

**Testing:**
- Test with no filters (returns all org leads)
- Test with search query
- Test with status filter
- Test with both search and status
- Test pagination (cursor)
- Test empty results
- Test org isolation (can't see other org's leads)

---

### Step 2: Implement leadService.create() with Deduplication

**File:** `src/services/leads.service.ts`

**Implementation:**
```typescript
async create(orgId: string, userId: string, input: LeadCreateInput) {
  const { email, phoneE164, ...rest } = input;

  // Generate identity hash for deduplication
  const identityHash = generateIdentityHash(email, phoneE164);

  // Check for existing lead with same identity
  const existing = await prisma.lead.findFirst({
    where: { orgId, identityHash },
  });

  if (existing) {
    // Return existing lead (idempotent)
    return { id: existing.id };
  }

  // Create new lead
  const lead = await prisma.lead.create({
    data: {
      orgId,
      publicId: generatePublicId('lead'),
      identityHash,
      email: email ? normalizeEmail(email) : null,
      phoneE164,
      status: 'NEW',
      sourceType: input.sourceType || 'MANUAL',
      ...rest,
    },
  });

  // Audit log
  await auditLog({
    orgId,
    userId,
    action: 'lead.created',
    resourceType: 'lead',
    resourceId: lead.id,
    metadata: { publicId: lead.publicId },
  });

  return { id: lead.id };
}

// Helper functions
function generateIdentityHash(email?: string, phone?: string): string {
  const normalized = email ? normalizeEmail(email) : phone || '';
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function generatePublicId(prefix: string): string {
  return `${prefix}_${nanoid(16)}`;
}
```

**Key Points:**
- Deduplication by identityHash (email or phone)
- Idempotent: return existing lead if duplicate
- Generate publicId for external references
- Audit logging for compliance
- Normalize email before hashing

**Testing:**
- Test create with valid data
- Test duplicate detection (same email)
- Test duplicate detection (same phone)
- Test missing required fields
- Test audit log created

---

### Step 3: Wire GET /api/v2/leads

**File:** `src/app/api/v2/leads/route.ts`

**Current State:**
```typescript
export const GET = guardGet(async (_req: NextRequest) => {
  // TODO(sonnet): query Prisma for leads by orgId; support cursor+limit
  return jsonOk({ items: [], nextCursor: null });
});
```

**Implementation:**
```typescript
export const GET = guardGet(async (req: NextRequest) => {
  // Extract orgId from auth context (injected by withTenantAuth)
  const orgId = req.headers.get('x-org-id');
  if (!orgId) return jsonError(401, 'Unauthorized', 'Missing org context');

  // Parse query params
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const status = searchParams.get('status') || undefined;
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Call service
  const result = await leadService.list(orgId, { q, status, cursor, limit });

  return jsonOk(result);
});
```

**Key Points:**
- Extract orgId from auth context (TODO: enhance withTenantAuth to inject this)
- Parse query params with defaults
- Call service layer (separation of concerns)
- Return jsonOk with items and nextCursor

**Testing:**
- Test with auth (200)
- Test without auth (401)
- Test with filters
- Test pagination
- Test rate limiting (multiple requests)

---

### Step 4: Wire POST /api/v2/leads

**File:** `src/app/api/v2/leads/route.ts`

**Current State:**
```typescript
export const POST = guardPost(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({} as any));
  const v = validateLeadCreate(body);
  if (!v.ok) return jsonError(400, 'ValidationError', v.message);
  // TODO(sonnet): call leadService.create(orgId, userId, body)
  return jsonError(501, 'NotImplemented', 'Leads creation not implemented yet');
});
```

**Implementation:**
```typescript
export const POST = guardPost(async (req: NextRequest) => {
  // Extract context
  const orgId = req.headers.get('x-org-id');
  const userId = req.headers.get('x-user-id');
  if (!orgId || !userId) return jsonError(401, 'Unauthorized', 'Missing auth context');

  // Parse and validate body
  const body = await req.json().catch(() => ({} as any));
  const v = validateLeadCreate(body);
  if (!v.ok) return jsonError(400, 'ValidationError', v.message);

  // Call service
  const result = await leadService.create(orgId, userId, body);

  // Return 201 Created
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Key Points:**
- Extract orgId AND userId from auth context
- Validation already done (validateLeadCreate)
- Return 201 Created (not 200)
- Idempotency handled by middleware (withIdempotencyRequired)

**Testing:**
- Test with valid data (201)
- Test with invalid data (400)
- Test without auth (401)
- Test without Idempotency-Key (400)
- Test duplicate Idempotency-Key (returns cached response)
- Test duplicate lead (returns existing)

---

### Step 5: Write Unit Tests

**File:** `tests/unit/services/leads.service.test.ts`

**Structure:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leadService } from '@/services/leads.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('leadService.list', () => {
  it('should return org-scoped leads', async () => {
    // Mock data
    const mockLeads = [{ id: '1', orgId: 'org1', company: 'Acme' }];
    vi.mocked(prisma.lead.findMany).mockResolvedValue(mockLeads);

    // Call service
    const result = await leadService.list('org1', {});

    // Assertions
    expect(result.items).toEqual(mockLeads);
    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orgId: 'org1' } })
    );
  });

  it('should filter by search query', async () => {
    // Test search functionality
  });

  it('should filter by status', async () => {
    // Test status filter
  });

  it('should paginate with cursor', async () => {
    // Test pagination
  });
});

describe('leadService.create', () => {
  it('should create new lead', async () => {
    // Test creation
  });

  it('should deduplicate by email', async () => {
    // Test deduplication
  });

  it('should include audit log', async () => {
    // Test audit logging
  });
});
```

**Run Tests:**
```bash
npm run test -- tests/unit/services/leads.service.test.ts
```

---

### Step 6: Write Integration Tests

**File:** `tests/integration/api/v2/leads.test.ts`

**Structure:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testRequest } from '@/tests/helpers/request';
import { setupTestDb, cleanupTestDb } from '@/tests/helpers/db';

describe('GET /api/v2/leads', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  it('should return 401 without auth', async () => {
    const res = await testRequest('/api/v2/leads');
    expect(res.status).toBe(401);
  });

  it('should return org-scoped leads with auth', async () => {
    const res = await testRequest('/api/v2/leads', {
      headers: { Cookie: 'rs_user=valid_token' },
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('nextCursor');
  });
});

describe('POST /api/v2/leads', () => {
  it('should require Idempotency-Key', async () => {
    const res = await testRequest('/api/v2/leads', {
      method: 'POST',
      body: { company: 'Acme' },
      headers: { Cookie: 'rs_user=valid_token' },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Idempotency-Key');
  });

  it('should create lead with valid data', async () => {
    const res = await testRequest('/api/v2/leads', {
      method: 'POST',
      body: { company: 'Acme', email: 'test@acme.com' },
      headers: {
        Cookie: 'rs_user=valid_token',
        'Idempotency-Key': 'test-key-1',
      },
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
```

---

### Step 7: Validate Binder 1 Completion

**Checklist:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all tests)
- [ ] Manual API testing with curl/Postman
- [ ] Idempotency verified (same key returns same response)
- [ ] Rate limiting verified (triggers after threshold)
- [ ] Deduplication verified (duplicate email returns existing)
- [ ] Contract snapshot updated (`npm run generate-contract-snapshot`)
- [ ] Git commit with message: "feat: implement Leads API (Binder 1)"
- [ ] Push to GitHub and verify CI passes
- [ ] Verify Vercel deployment succeeds

**Manual Testing Commands:**
```bash
# Test GET (requires auth cookie)
curl -H "Cookie: rs_user=YOUR_TOKEN" \
  "http://localhost:3000/api/v2/leads?limit=10"

# Test POST (requires auth + idempotency key)
curl -X POST \
  -H "Cookie: rs_user=YOUR_TOKEN" \
  -H "Idempotency-Key: test-123" \
  -H "Content-Type: application/json" \
  -d '{"company":"Acme","email":"test@acme.com","sourceType":"MANUAL"}' \
  http://localhost:3000/api/v2/leads

# Test duplicate (same idempotency key)
curl -X POST \
  -H "Cookie: rs_user=YOUR_TOKEN" \
  -H "Idempotency-Key: test-123" \
  -H "Content-Type: application/json" \
  -d '{"company":"Different","email":"other@test.com"}' \
  http://localhost:3000/api/v2/leads
# Should return cached response from first request
```

---

## Common Issues & Solutions

### Issue: withTenantAuth doesn't inject orgId/userId
**Solution:** Enhance middleware to inject headers (see Binder 8 for full implementation)

**Quick Fix:**
```typescript
// In src/lib/api/middleware.ts
export function withTenantAuth(): Wrapper {
  return (handler) => async (req, ...args) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('rs_user')?.value;
    if (!token) return jsonError(401, 'Unauthorized', 'Missing auth token');

    // TODO: Decode token and extract orgId/userId
    // For now, use dev values
    const orgId = process.env.DEV_ORG_ID || 'org_dev';
    const userId = 'user_dev';

    // Inject into headers
    const headers = new Headers(req.headers);
    headers.set('x-org-id', orgId);
    headers.set('x-user-id', userId);

    const newReq = new NextRequest(req, { headers });
    return handler(newReq, ...args);
  };
}
```

### Issue: Prisma client not generated
**Solution:** Run `npx prisma generate`

### Issue: Tests fail with "Cannot find module"
**Solution:** Check tsconfig paths, ensure imports use `@/` alias

---

## Next Steps

After Binder 1 is 100% complete:
1. Update task list: Mark Binder 1 as COMPLETE
2. Move to Binder 2: Opportunities API Implementation
3. Follow same pattern as Binder 1
4. Maintain momentum and quality standards

---

**End of Guide**

