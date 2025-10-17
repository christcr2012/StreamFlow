# Pricing Management System - Implementation Plan

## Overview
Enable dynamic pricing management from the Provider Portal that automatically updates the Cortiware marketing website. This eliminates the need for code changes and redeployments when adjusting pricing.

---

## Current State (Just Fixed)

### ✅ Issues Resolved
1. **Double Header Bug** - Removed duplicate Navigation component from pricing page
2. **Pricing Data Mismatch** - Synchronized home page and pricing page data
3. **Mobile Badge Display** - Fixed "MOST POPULAR" badge cutoff on mobile

### ⚠️ Current Limitations
- Pricing is hardcoded in two places:
  - `apps/marketing-cortiware/src/app/page.tsx` (home page pricing section)
  - `apps/marketing-cortiware/src/app/pricing/page.tsx` (dedicated pricing page)
- Changing pricing requires code edits and redeployment
- No single source of truth for pricing data

---

## Proposed Solution: Dynamic Pricing Management

### Architecture: Hybrid ISR (Incremental Static Regeneration)

```
┌─────────────────────┐
│  Provider Portal    │
│  (Admin UI)         │
│  - Edit pricing     │
│  - Set features     │
│  - Toggle plans     │
└──────────┬──────────┘
           │
           │ Updates
           ▼
┌─────────────────────┐
│  Database           │
│  (Prisma/Postgres)  │
│  - pricing table    │
│  - features table   │
└──────────┬──────────┘
           │
           │ Exposes
           ▼
┌─────────────────────┐
│  Public API         │
│  /api/public/pricing│
│  (Read-only)        │
└──────────┬──────────┘
           │
           │ Fetches (ISR)
           ▼
┌─────────────────────┐
│  Marketing Site     │
│  (Next.js ISR)      │
│  - Revalidate: 60s  │
│  - Static + Fresh   │
└─────────────────────┘
```

### Benefits
- ✅ **No Code Changes**: Update pricing from UI
- ✅ **No Deployments**: Changes live within 60 seconds
- ✅ **Fast Pages**: Static generation with auto-refresh
- ✅ **Single Source of Truth**: Database is authoritative
- ✅ **Version History**: Track pricing changes over time
- ✅ **A/B Testing Ready**: Can enable experimental pricing
- ✅ **Multi-Site Support**: Same pricing API for multiple marketing sites

---

## Implementation Phases

### Phase 1: Database Schema & API (Week 1)
**Goal**: Create pricing storage and public API

#### 1.1 Database Schema
```prisma
// packages/db/prisma/schema.prisma

model PricingPlan {
  id          String   @id @default(cuid())
  name        String   // "Starter", "Professional", "Enterprise"
  slug        String   @unique // "starter", "professional", "enterprise"
  price       Int?     // Price in cents, null for "Contact Sales"
  description String
  cta         String   // "Start Free Trial", "Contact Sales"
  highlighted Boolean  @default(false) // Shows "MOST POPULAR" badge
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)
  
  features    PricingFeature[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([active, sortOrder])
}

model PricingFeature {
  id          String   @id @default(cuid())
  planId      String
  plan        PricingPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  text        String   // "Up to 3 users", "Advanced AI automation"
  sortOrder   Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([planId, sortOrder])
}

model PricingHistory {
  id          String   @id @default(cuid())
  planSlug    String
  price       Int?
  changedBy   String   // User ID who made the change
  reason      String?  // Optional reason for change
  createdAt   DateTime @default(now())
  
  @@index([planSlug, createdAt])
}
```

#### 1.2 Seed Data
```typescript
// packages/db/prisma/seed-pricing.ts
const pricingPlans = [
  {
    slug: 'starter',
    name: 'Starter',
    price: 4900, // $49.00 in cents
    description: 'Perfect for small teams just getting started',
    cta: 'Start Free Trial',
    highlighted: false,
    sortOrder: 1,
    features: [
      { text: 'Up to 3 users', sortOrder: 1 },
      { text: 'Basic scheduling & dispatch', sortOrder: 2 },
      { text: 'Customer portal', sortOrder: 3 },
      { text: 'Mobile app access', sortOrder: 4 },
      { text: 'Email support', sortOrder: 5 },
      { text: 'Monthly invoicing', sortOrder: 6 },
    ]
  },
  {
    slug: 'professional',
    name: 'Professional',
    price: 19900, // $199.00 in cents
    description: 'For growing businesses with advanced needs',
    cta: 'Start Free Trial',
    highlighted: true, // MOST POPULAR
    sortOrder: 2,
    features: [
      { text: 'Unlimited users', sortOrder: 1 },
      { text: 'Advanced AI automation', sortOrder: 2 },
      { text: 'Custom branding', sortOrder: 3 },
      { text: 'API access', sortOrder: 4 },
      { text: 'Priority support', sortOrder: 5 },
      { text: 'Real-time analytics', sortOrder: 6 },
      { text: 'Custom integrations', sortOrder: 7 },
      { text: 'SSO & advanced security', sortOrder: 8 },
    ]
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    description: 'Custom solutions for large organizations',
    cta: 'Contact Sales',
    highlighted: false,
    sortOrder: 3,
    features: [
      { text: 'Everything in Professional', sortOrder: 1 },
      { text: 'Dedicated account manager', sortOrder: 2 },
      { text: 'Custom SLA', sortOrder: 3 },
      { text: 'On-premise deployment', sortOrder: 4 },
      { text: 'Advanced compliance', sortOrder: 5 },
      { text: 'Custom development', sortOrder: 6 },
      { text: 'Training & onboarding', sortOrder: 7 },
      { text: 'Phone support', sortOrder: 8 },
    ]
  }
];
```

#### 1.3 Public API Endpoint
```typescript
// apps/provider-portal/src/app/api/public/pricing/route.ts
import { prisma } from '@cortiware/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Always fresh data
export const revalidate = 0; // No caching on API side

export async function GET() {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { active: true },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Transform to marketing site format
    const formatted = plans.map(plan => ({
      name: plan.name,
      price: plan.price ? plan.price / 100 : null, // Convert cents to dollars
      description: plan.description,
      features: plan.features.map(f => f.text),
      cta: plan.cta,
      highlighted: plan.highlighted,
    }));

    return NextResponse.json({
      plans: formatted,
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}
```

**Deliverables**:
- [ ] Prisma schema updated
- [ ] Migration created and applied
- [ ] Seed script created
- [ ] Public API endpoint created
- [ ] API tested with Postman/curl

---

### Phase 2: Marketing Site Integration (Week 1-2)
**Goal**: Update marketing site to fetch pricing dynamically

#### 2.1 Create Pricing Fetcher
```typescript
// apps/marketing-cortiware/src/lib/pricing.ts
const PRICING_API = process.env.NEXT_PUBLIC_PRICING_API_URL || 
                    'https://provider.cortiware.com/api/public/pricing';

export interface PricingPlan {
  name: string;
  price: number | null;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export async function getPricing(): Promise<PricingPlan[]> {
  try {
    const res = await fetch(PRICING_API, {
      next: { revalidate: 60 } // ISR: Revalidate every 60 seconds
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch pricing: ${res.status}`);
    }
    
    const data = await res.json();
    return data.plans;
  } catch (error) {
    console.error('Error fetching pricing:', error);
    // Fallback to hardcoded pricing if API fails
    return getFallbackPricing();
  }
}

function getFallbackPricing(): PricingPlan[] {
  // Current hardcoded pricing as fallback
  return [/* ... current pricing data ... */];
}
```

#### 2.2 Update Home Page
```typescript
// apps/marketing-cortiware/src/app/page.tsx
import { getPricing } from '@/lib/pricing';

export default async function CortiwareHomePage() {
  const pricingPlans = await getPricing();
  
  return (
    <div>
      {/* ... other sections ... */}
      
      <section id="pricing">
        {/* ... pricing section header ... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 gap-y-12">
          {pricingPlans.map((plan, idx) => (
            <PricingCard key={plan.name} plan={plan} index={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

#### 2.3 Update Pricing Page
```typescript
// apps/marketing-cortiware/src/app/pricing/page.tsx
import { getPricing } from '@/lib/pricing';

export default async function PricingPage() {
  const plans = await getPricing();
  
  return (
    <div>
      {/* ... render pricing cards ... */}
    </div>
  );
}
```

**Deliverables**:
- [ ] Pricing fetcher utility created
- [ ] Home page updated to use dynamic pricing
- [ ] Pricing page updated to use dynamic pricing
- [ ] Fallback pricing implemented
- [ ] ISR revalidation tested

---

### Phase 3: Provider Portal Admin UI (Week 2-3)
**Goal**: Build UI for managing pricing

#### 3.1 Pricing Management Page
Location: `apps/provider-portal/src/app/(authenticated)/admin/pricing/page.tsx`

Features:
- List all pricing plans
- Edit plan details (name, price, description, CTA)
- Toggle "highlighted" badge
- Reorder plans (drag & drop)
- Add/remove/reorder features
- Activate/deactivate plans
- View pricing history

#### 3.2 API Endpoints (Provider Portal)
```typescript
// POST /api/admin/pricing/plans - Create plan
// PUT /api/admin/pricing/plans/[id] - Update plan
// DELETE /api/admin/pricing/plans/[id] - Delete plan
// POST /api/admin/pricing/plans/[id]/features - Add feature
// PUT /api/admin/pricing/features/[id] - Update feature
// DELETE /api/admin/pricing/features/[id] - Delete feature
```

**Deliverables**:
- [ ] Admin pricing page UI
- [ ] CRUD API endpoints
- [ ] Form validation
- [ ] Pricing history tracking
- [ ] Permission checks (admin only)

---

## Environment Variables

```bash
# apps/marketing-cortiware/.env.local
NEXT_PUBLIC_PRICING_API_URL=https://provider.cortiware.com/api/public/pricing

# apps/provider-portal/.env
DATABASE_URL=postgresql://...
```

---

## Testing Plan

### Unit Tests
- [ ] Pricing API endpoint returns correct format
- [ ] Pricing fetcher handles API failures gracefully
- [ ] Fallback pricing is valid

### Integration Tests
- [ ] Update pricing in admin UI → verify API returns new data
- [ ] Marketing site fetches and displays updated pricing
- [ ] ISR revalidation works (60-second delay)

### Manual Testing
- [ ] Update pricing in provider portal
- [ ] Wait 60 seconds
- [ ] Refresh marketing site → verify changes appear
- [ ] Test with API down → verify fallback works

---

## Rollout Strategy

### Option A: Gradual Migration (Recommended)
1. Deploy Phase 1 (database + API)
2. Seed database with current pricing
3. Deploy Phase 2 (marketing site reads from API)
4. Verify ISR works correctly
5. Deploy Phase 3 (admin UI)
6. Remove hardcoded pricing from code

### Option B: Big Bang
1. Deploy all phases at once
2. Higher risk, faster completion

**Recommendation**: Option A for safety

---

## Future Enhancements

### Phase 4: Advanced Features (Optional)
- [ ] A/B testing different pricing tiers
- [ ] Geo-based pricing (different prices per region)
- [ ] Promotional pricing with expiration dates
- [ ] Pricing calculator (estimate based on usage)
- [ ] Pricing comparison tool
- [ ] Currency conversion (multi-currency support)

---

## Rollback Plan

If issues arise:
1. **Immediate**: Set `NEXT_PUBLIC_PRICING_API_URL` to empty → uses fallback
2. **Short-term**: Revert marketing site deployment
3. **Long-term**: Keep API but revert to hardcoded pricing

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database & API | 2-3 days | None |
| Phase 2: Marketing Site | 2-3 days | Phase 1 complete |
| Phase 3: Admin UI | 3-5 days | Phase 1 complete |
| **Total** | **1-2 weeks** | - |

---

## Success Criteria

- [ ] Pricing can be updated from provider portal UI
- [ ] Marketing site reflects changes within 60 seconds
- [ ] No code changes needed for pricing updates
- [ ] Fallback works if API is unavailable
- [ ] Pricing history is tracked
- [ ] All tests pass

---

## Questions to Resolve

1. **Who has permission to edit pricing?**
   - Only super admins?
   - Specific role?

2. **Do we need approval workflow?**
   - Direct publish vs. draft → review → publish?

3. **Pricing history retention?**
   - Keep forever?
   - Purge after X months?

4. **Multi-currency support?**
   - USD only for now?
   - Plan for future expansion?

5. **Promotional pricing?**
   - Temporary discounts?
   - Coupon codes?

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Answer questions** - Resolve open questions above
3. **Prioritize phases** - All phases or just Phase 1-2?
4. **Schedule work** - When to start implementation?

---

**Status**: 📋 Planning Complete - Awaiting Approval
**Last Updated**: 2025-01-17

