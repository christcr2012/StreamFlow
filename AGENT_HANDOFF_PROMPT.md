# Agent Handoff Prompt - Phase 1 Scaffolding Continuation

**Copy and paste this entire prompt to the next agent to gain full context and resume work.**

---

## Current Session Summary

You are continuing Phase 1 scaffolding work on the Cortiware monorepo. The previous agent completed **75% of Phase 1** (backend APIs and admin pages). Your task is to **complete the remaining 25%** by creating frontend pages, service layers, and documentation.

---

## What's Been Completed ✅

### Backend APIs: 25/25 Routes (100% Done)

All backend API routes have been scaffolded with:

- ✅ Zod validation schemas for all inputs
- ✅ getAuthContext() auth guards
- ✅ Org scoping on queries
- ✅ Cursor-based pagination (cursor/limit/hasMore)
- ✅ TODO markers for Phase 2 implementation
- ✅ TypeScript strict typing

**Files Created:**

- `/api/incidents/[id]` - incident detail CRUD
- `/api/v2/contacts/[id]` - contact detail CRUD
- `/api/referrals/[id]` - referral detail CRUD
- `/api/analytics/snapshots` - daily analytics aggregation
- `/api/usage-meters` - usage tracking
- `/api/infrastructure/limits` - resource limits
- `/api/infrastructure/metrics` - health metrics
- `/api/upgrades` - upgrade requests
- `/api/subscription-tiers` - subscription plans
- `/api/pricing/overrides` - custom pricing
- `/api/monetization/config` - billing config
- `/api/integrations` + `/api/integrations/[provider]` - OAuth integrations
- `/api/import/jobs` + `/api/import/mappings` - CSV import
- `/api/ai/model-tests` + `/api/ai/model-tests/[id]/results` - AI QA
- `/api/offers` - promotional offers
- `/api/plans/prices` - regional pricing
- Plus 6 previously created: `/api/v2/contacts`, `/api/incidents`, `/api/ai/monthly-summaries`, `/api/referrals`

### Frontend Pages: 13/30 Pages (43% Done)

**CRM Pages (5/6 complete):**

- ✅ `/opportunities` - Kanban board UI
- ✅ `/opportunities/new` - Creation form
- ✅ `/opportunities/[id]` - Detail page
- ✅ `/contacts` - List table with search
- ✅ `/contacts/[id]` - Detail page

**Admin Pages (7/7 complete):**

- ✅ `/admin` - Dashboard with stats
- ✅ `/admin/feature-flags` - Feature flag management
- ✅ `/admin/vertical-packs` - Vertical pack config
- ✅ `/admin/subscription-tiers` - Subscription plans
- ✅ `/admin/pricing` - Pricing overrides
- ✅ `/admin/integrations` - Integration management
- ✅ `/admin/infrastructure` - System health dashboard

---

## What You Need to Complete ⏳

### Priority 1: Operations Pages (5 pages - ~1,000 lines)

Create these pages in `apps/tenant-app/src/app/(tenant)/`:

1. **`/incidents/page.tsx`** - Incident list page
   - Table with severity badges (P1/P2/P3)
   - Status filters (OPEN, ACK, IN_PROGRESS, RESOLVED, CLOSED)
   - Search by title/description
   - Create incident button
   - Pagination
   - Data from `/api/incidents`

2. **`/incidents/[id]/page.tsx`** - Incident detail page
   - Incident details card
   - Status progression UI
   - SLA countdown/timer
   - Assignee display
   - Activity timeline
   - Update status/assignment actions
   - Data from `/api/incidents/[id]`

3. **`/referrals/page.tsx`** - Referral list page
   - Table with referrer, referred person, status
   - Status filters (pending, contacted, converted)
   - Conversion tracking
   - Create referral button
   - Data from `/api/referrals`

4. **`/import/history/page.tsx`** - Import job history
   - Table of past imports (entity type, status, date)
   - Status indicators (pending, processing, completed, failed)
   - Error count and download error report
   - View import details
   - Data from `/api/import/jobs`

5. **`/import/mappings/page.tsx`** - Import mapping management
   - List of saved mappings
   - Entity type filter
   - Create/edit mapping forms
   - Test mapping preview
   - Data from `/api/import/mappings`

### Priority 2: Analytics Pages (4 pages - ~800 lines)

Create these pages in `apps/tenant-app/src/app/(tenant)/reports/`:

1. **`/reports/analytics/page.tsx`** - Analytics dashboard
   - Revenue charts (MRR, ARR)
   - Customer growth graphs
   - Key metrics cards
   - Date range picker
   - Data from `/api/analytics/snapshots`

2. **`/reports/pipeline/page.tsx`** - Sales pipeline analytics
   - Funnel chart (stage progression)
   - Conversion rates between stages
   - Average deal size per stage
   - Time-in-stage analysis
   - Data from `/api/opportunities` (aggregated)

3. **`/reports/conversion/page.tsx`** - Conversion funnel
   - Lead → Opportunity → Customer conversion rates
   - Drop-off analysis
   - Time to conversion metrics
   - Source attribution

4. **`/reports/usage/page.tsx`** - Usage analytics
   - Feature usage heatmap
   - Active users over time
   - API usage graphs
   - Data from `/api/usage-meters`

### Priority 3: Cleaning Vertical (1 page - ~200 lines)

1. **`/cleaning/checklist-templates/page.tsx`**
   - List of checklist templates
   - Space type grouping (office, bathroom, kitchen, etc.)
   - Create/edit template forms
   - Checklist item management
   - Default template toggle
   - Data from (check if API exists or needs creation)

### Priority 4: Service Layers (13 files - ~1,500 lines)

Create these in `apps/tenant-app/src/services/`:

1. **`CommunicationService.ts`**

   ```typescript
   export class CommunicationService {
     async sendSMS(to: string, message: string): Promise<void> {
       // TODO Phase 2: Integrate with Twilio
     }
     async sendEmail(to: string, subject: string, body: string): Promise<void> {
       // TODO Phase 2: Integrate with SendGrid/AWS SES
     }
     async getThreads(customerId: string): Promise<CommunicationThread[]> {
       // TODO Phase 2: Fetch communication history
     }
     async updateStatus(threadId: string, status: string): Promise<void> {
       // TODO Phase 2: Update thread status
     }
   }
   ```

2. **`AIUsageTracker.ts`**

   ```typescript
   export class AIUsageTracker {
     async logEvent(
       orgId: string,
       feature: string,
       tokensUsed: number,
     ): Promise<void> {
       // TODO Phase 2: Log to AIUsageEvent table
     }
     async getCurrentMonthUsage(orgId: string): Promise<AiMonthlySummary> {
       // TODO Phase 2: Query current month usage
     }
     async checkBudget(
       orgId: string,
     ): Promise<{ withinBudget: boolean; percentUsed: number }> {
       // TODO Phase 2: Compare usage to org budget
     }
   }
   ```

3. **`AIBudgetMonitor.ts`**

   ```typescript
   export class AIBudgetMonitor {
     async checkThreshold(orgId: string): Promise<boolean> {
       // TODO Phase 2: Check if approaching budget limit
     }
     async createAlert(orgId: string, thresholdPercent: number): Promise<void> {
       // TODO Phase 2: Create budget alert
     }
     async notifyAdmins(orgId: string, message: string): Promise<void> {
       // TODO Phase 2: Send notifications
     }
   }
   ```

4. **`LeadEnrichmentService.ts`**

   ```typescript
   export class LeadEnrichmentService {
     async enrichLead(leadId: string): Promise<Lead> {
       // TODO Phase 2: Enrich with external data (Clearbit, ZoomInfo)
     }
     async calculateScore(leadId: string): Promise<number> {
       // TODO Phase 2: Calculate lead score
     }
     async extractFactors(lead: Lead): Promise<Record<string, any>> {
       // TODO Phase 2: Extract scoring factors
     }
   }
   ```

5. **`LeadDeduplicationService.ts`**

   ```typescript
   export class LeadDeduplicationService {
     async generateHash(email: string, phone?: string): Promise<string> {
       // TODO Phase 2: Generate deduplication hash
     }
     async findDuplicates(leadId: string): Promise<Lead[]> {
       // TODO Phase 2: Find duplicate leads
     }
     async mergeDuplicates(
       primaryId: string,
       duplicateIds: string[],
     ): Promise<void> {
       // TODO Phase 2: Merge duplicate records
     }
   }
   ```

6. **`RecurringJobCreator.ts`**

   ```typescript
   export class RecurringJobCreator {
     async createJobs(
       contractId: string,
       startDate: Date,
       endDate: Date,
     ): Promise<Job[]> {
       // TODO Phase 2: Generate recurring jobs from contract
     }
     async sendConfirmations(jobs: Job[]): Promise<void> {
       // TODO Phase 2: Send job confirmations to customers
     }
     async updateNextRun(contractId: string): Promise<void> {
       // TODO Phase 2: Update nextOccurrence date
     }
   }
   ```

7. **`JobCostCalculator.ts`**

   ```typescript
   export class JobCostCalculator {
     async calculateVariance(jobId: string): Promise<number> {
       // TODO Phase 2: Calculate actual vs estimated cost
     }
     async calculateMargin(jobId: string): Promise<number> {
       // TODO Phase 2: Calculate profit margin
     }
     async checkBudget(
       jobId: string,
     ): Promise<{ overBudget: boolean; variance: number }> {
       // TODO Phase 2: Check if job is over budget
     }
   }
   ```

8. **`ImportMapperService.ts`**

   ```typescript
   export class ImportMapperService {
     async detectMapping(
       headers: string[],
       entityType: string,
     ): Promise<Record<string, string>> {
       // TODO Phase 2: Auto-detect column mappings
     }
     async applyMapping(
       row: any,
       mapping: Record<string, string>,
     ): Promise<any> {
       // TODO Phase 2: Apply mapping to row
     }
     async validateData(
       data: any[],
       entityType: string,
     ): Promise<{ valid: any[]; invalid: any[] }> {
       // TODO Phase 2: Validate imported data
     }
   }
   ```

9. **`AnalyticsAggregator.ts`**

   ```typescript
   export class AnalyticsAggregator {
     async createSnapshot(date: Date): Promise<AnalyticsSnapshot> {
       // TODO Phase 2: Aggregate daily analytics
     }
     async aggregateDaily(): Promise<void> {
       // TODO Phase 2: Run daily aggregation job
     }
     async calculateMetrics(date: Date): Promise<Record<string, number>> {
       // TODO Phase 2: Calculate all metrics for date
     }
   }
   ```

10. **`UsageMeterService.ts`**

    ```typescript
    export class UsageMeterService {
      async trackUsage(
        orgId: string,
        meter: string,
        quantity: number,
      ): Promise<void> {
        // TODO Phase 2: Record usage event
      }
      async calculateCharges(
        orgId: string,
        period: { start: Date; end: Date },
      ): Promise<number> {
        // TODO Phase 2: Calculate usage charges
      }
      async checkLimits(
        orgId: string,
        meter: string,
      ): Promise<{ withinLimit: boolean; usage: number; limit: number }> {
        // TODO Phase 2: Check if usage exceeds limits
      }
    }
    ```

11. **`UpgradeRecommender.ts`**

    ```typescript
    export class UpgradeRecommender {
      async analyzeUsage(orgId: string): Promise<Record<string, any>> {
        // TODO Phase 2: Analyze org usage patterns
      }
      async createRecommendation(
        orgId: string,
      ): Promise<{ recommended: boolean; targetTier: string; reason: string }> {
        // TODO Phase 2: Generate upgrade recommendation
      }
      async notifyTenant(orgId: string, recommendation: any): Promise<void> {
        // TODO Phase 2: Send upgrade recommendation email
      }
    }
    ```

12. **`IncidentEscalator.ts`**

    ```typescript
    export class IncidentEscalator {
      async checkSLA(
        incidentId: string,
      ): Promise<{ breached: boolean; timeRemaining: number }> {
        // TODO Phase 2: Check SLA status
      }
      async escalate(incidentId: string): Promise<void> {
        // TODO Phase 2: Escalate to higher severity/assignee
      }
      async notifyOnCall(incidentId: string): Promise<void> {
        // TODO Phase 2: Send on-call notifications
      }
    }
    ```

13. **`ReferralTracker.ts`**
    ```typescript
    export class ReferralTracker {
      async trackConversion(
        referralId: string,
        customerId: string,
      ): Promise<void> {
        // TODO Phase 2: Mark referral as converted
      }
      async calculateReward(referralId: string): Promise<number> {
        // TODO Phase 2: Calculate referral reward
      }
      async processPayment(referralId: string): Promise<void> {
        // TODO Phase 2: Process reward payment
      }
    }
    ```

### Priority 5: Documentation (1 file)

1. **`/docs/trace-matrix.md`** - Comprehensive traceability matrix
   - Map all 90 Prisma models to:
     - Backend API routes
     - Frontend pages
     - Service layers
     - Test files
   - Identify gaps
   - Track completion status

Format:

```markdown
| Model | Backend Route | Frontend Page | Service               | Unit Tests | E2E Tests | Status |
| ----- | ------------- | ------------- | --------------------- | ---------- | --------- | ------ |
| Lead  | /api/leads    | /leads        | LeadEnrichmentService | ✅         | ⏳        | 80%    |

...
```

---

## Critical Instructions

### 1. Follow Established Patterns

**All frontend pages must include:**

- TypeScript interfaces for data types
- `useState` and `useEffect` hooks (scaffolded, not implemented)
- TODO markers: `// TODO Phase 2: Implement useSWR data fetching from [endpoint]`
- Search/filter placeholders
- Pagination placeholders
- Action buttons (create, edit, delete)
- Empty state messages
- Consistent Tailwind CSS styling

**Example pattern from existing pages:**

```typescript
'use client';

import { useState } from 'react';

interface DataType {
  id: string;
  // ... fields
}

export default function PageName() {
  const [items, setItems] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO Phase 2: Implement useSWR data fetching from /api/...
  // TODO Phase 2: Add search functionality
  // TODO Phase 2: Add pagination

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Page Title</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Add Item
        </button>
      </div>

      {/* Table/Grid/Cards */}
      {/* TODO Phase 2: Add modals */}
    </div>
  );
}
```

### 2. Schema Alignment

**IMPORTANT:** Always verify Prisma schema before creating pages/services:

```bash
# Read schema first
grep -A 20 "model ModelName" prisma/schema.prisma
```

Previous agent found 6 schema mismatches. Check:

- Field names (exact case)
- Relation names (Customer vs customer)
- Enum values (P1/P2/P3 not LOW/MEDIUM/HIGH)
- Optional vs required fields

### 3. File Locations

- APIs: `apps/tenant-app/src/app/api/[route]/route.ts`
- Pages: `apps/tenant-app/src/app/(tenant)/[route]/page.tsx`
- Services: `apps/tenant-app/src/services/[ServiceName].ts`
- Docs: `docs/[filename].md`

### 4. Quality Checklist

Before marking a file complete:

- ✅ TypeScript compiles (no errors)
- ✅ Consistent naming conventions
- ✅ TODO markers for all Phase 2 work
- ✅ Proper imports (Next.js, React, types)
- ✅ Follows patterns from existing files
- ✅ No `any` types (except in TODO areas)

---

## Verification Commands

```bash
# Check TypeScript errors
npm run typecheck

# View current directory structure
ls apps/tenant-app/src/app/(tenant)/

# Check if a model exists in schema
grep "model ModelName" prisma/schema.prisma

# Count files created
find apps/tenant-app/src/app/(tenant) -name "page.tsx" | wc -l
```

---

## Completion Criteria

Phase 1 is complete when:

- ✅ All 30 frontend pages exist (currently 13/30)
- ✅ All 13 service layer files exist with method signatures
- ✅ Trace matrix document created
- ✅ All files compile without errors
- ✅ PHASE_1_PROGRESS_CHECKPOINT.md updated to 100%

**DO NOT:**

- ❌ Implement actual API calls (that's Phase 2)
- ❌ Add real useSWR hooks (that's Phase 2)
- ❌ Create full form validation (that's Phase 2)
- ❌ Write unit/E2E tests (that's Phase 3)

**DO:**

- ✅ Create all file structures
- ✅ Add TypeScript interfaces
- ✅ Scaffold UI components
- ✅ Add TODO markers everywhere
- ✅ Follow established patterns

---

## Current Status Summary

```
Phase 1 Progress: 75% Complete

✅ Backend APIs:     25/25 (100%)
🟡 Frontend Pages:   13/30 (43%)
   ✅ CRM:            5/6  (83%)
   ✅ Admin:          7/7  (100%)
   ⏳ Operations:     0/5  (0%)   ← START HERE
   ⏳ Analytics:      0/4  (0%)
   ⏳ Cleaning:       0/1  (0%)
⏳ Service Layers:    0/13 (0%)
⏳ Documentation:     1/2  (50%)

Estimated Time to Complete: 2-3 hours
```

---

## Next Steps

1. **Start with operations pages** (highest business value)
2. **Then analytics pages** (user-requested reporting)
3. **Then cleaning vertical page** (vertical-specific)
4. **Then service layers** (batch create all 13)
5. **Finally trace matrix** (documentation)
6. **Update checkpoint and verify compilation**

---

## Reference Files

Look at these existing files as templates:

- Page template: `apps/tenant-app/src/app/(tenant)/contacts/page.tsx`
- Detail page template: `apps/tenant-app/src/app/(tenant)/contacts/[id]/page.tsx`
- Admin page template: `apps/tenant-app/src/app/(tenant)/admin/vertical-packs/page.tsx`
- API template: `apps/tenant-app/src/app/api/v2/contacts/route.ts`

---

## Questions to Ask User

If you encounter issues:

1. "Should I verify if cleaning pages exist from a previous session?"
2. "Do you want unit/E2E tests scaffolded now or in Phase 3?"
3. "Should I create missing Prisma models or just note them as TODOs?"

---

**Ready to continue? Start by creating `/incidents/page.tsx` following the pattern from existing pages. Work systematically through the remaining 17 pages, then move to service layers, then documentation. You've got this! 🚀**
