# Cleaning Vertical Implementation Plan - Adapted for Cortiware

**Date**: 2025-10-16  
**Source**: `docs/Execute/cleaningVerticalGuidance.md`  
**Status**: Analysis Complete | Ready to Implement

---

## 🎯 Executive Summary

The cleaning vertical guidance is **excellent and production-ready**, but needs adaptation to our Next.js-based architecture. This plan adapts the comprehensive features while maintaining our existing patterns.

---

## 📊 Architecture Analysis

### Original Design (from guidance doc)
- ❌ Express/Node API in `services/api`
- ❌ Separate admin app in `apps/admin`
- ❌ Separate worker service in `services/worker`
- ✅ Neon Postgres (matches)
- ✅ Stripe integration (matches)
- ✅ Wallet/credits guard (matches)
- ✅ S3/R2 for attachments (matches)

### Our Current Architecture
- ✅ Next.js API routes in `apps/tenant-app/src/app/api`
- ✅ Tenant-facing UI in `apps/tenant-app/src/app/(tenant)`
- ✅ Provider-facing UI in `apps/provider-portal`
- ✅ Vertical packs in `packages/verticals/src/packs`
- ✅ Shared packages (`@cortiware/ui-components`, `@cortiware/wallet`, etc.)
- ✅ Vercel cron for scheduled jobs (no separate worker service)

---

## 🔄 Adaptation Strategy

### What We'll Keep (Excellent Business Logic)

1. ✅ **Leads & Estimates** - AI estimator, multi-option proposals, e-sign
2. ✅ **Contracts & Recurrence** - RRULE engine, SLAs, price escalators
3. ✅ **Scheduling & Dispatch** - Drag-and-drop board, calendar, map
4. ✅ **Work Orders & QA** - SOP templates, inspections, scoring
5. ✅ **Driver PWA** - Offline-first, QR scan, GPS/geofence
6. ✅ **Billing & AR** - Pre-billing review, Stripe integration
7. ✅ **Imports/Exports** - CSV/Excel mappers
8. ✅ **Analytics** - Job profitability, QA scores, lead→win funnel

### What We'll Adapt (Architecture Differences)

1. **API Routes**: Express → Next.js API routes
   - `/v1/cleaning/*` → `/api/cleaning/*`
   - Keep same endpoint structure, adapt to Next.js handlers

2. **UI Location**: Separate admin app → Tenant app
   - `apps/admin/src/pages/cleaning/*` → `apps/tenant-app/src/app/(tenant)/cleaning/*`
   - Reuse existing tenant app layout and navigation

3. **Worker Jobs**: Separate worker service → Vercel cron
   - `services/worker/src/jobs/cleaning/*` → `apps/tenant-app/src/app/api/cron/cleaning/*`
   - Use Vercel cron for schedule expansion, invoicing, inspections

4. **Vertical Pack**: Keep simple, focused on forms/pricing/estimation
   - `packages/verticals/src/packs/cleaning.ts` - Enhanced with real logic
   - Advanced features (scheduling, QA, etc.) in tenant app

---

## 📁 File Structure (Adapted)

### Vertical Pack (Simple, Focused)
```
packages/verticals/src/packs/cleaning.ts
packages/verticals/cleaning/
  ├── forms/
  │   ├── lead.json
  │   ├── estimate.json
  │   └── work-order.json
  ├── pricebook.json
  ├── checklists/
  │   ├── residential.json
  │   ├── commercial.json
  │   └── post-construction.json
  └── estimator.ts (AI logic)
```

### Tenant App (Advanced Features)
```
apps/tenant-app/src/app/(tenant)/cleaning/
  ├── leads/
  │   ├── page.tsx (Kanban board)
  │   └── [id]/page.tsx (Lead detail + AI estimate)
  ├── estimates/
  │   ├── page.tsx (List)
  │   └── [id]/page.tsx (Builder with templates)
  ├── contracts/
  │   ├── page.tsx (List)
  │   └── [id]/page.tsx (RRULE editor, SLA, escalators)
  ├── schedule/
  │   ├── page.tsx (Drag-drop board + calendar + map)
  │   └── [id]/page.tsx (Work order detail)
  ├── qa/
  │   ├── inspections/page.tsx (List + scoring)
  │   └── checklists/page.tsx (Template designer)
  ├── billing/
  │   ├── page.tsx (Pre-billing review)
  │   └── [id]/page.tsx (Invoice detail)
  └── analytics/page.tsx (KPIs + charts)
```

### API Routes
```
apps/tenant-app/src/app/api/cleaning/
  ├── leads/route.ts
  ├── estimates/
  │   ├── route.ts
  │   └── [id]/ai/route.ts (AI estimator - wallet guarded)
  ├── contracts/route.ts
  ├── schedules/route.ts
  ├── work-orders/
  │   ├── route.ts
  │   └── [id]/events/route.ts
  ├── qa/
  │   ├── inspections/route.ts
  │   └── checklists/route.ts
  ├── billing/route.ts
  └── imports/route.ts
```

### Cron Jobs (Vercel)
```
apps/tenant-app/src/app/api/cron/cleaning/
  ├── expand-schedules/route.ts (every 15 min)
  ├── generate-invoices/route.ts (nightly)
  └── create-inspections/route.ts (daily)
```

### Database (Prisma Schema)
```
apps/tenant-app/prisma/schema.prisma
  - Add cleaning-specific models
  - Reuse existing: Org, User, Invoice, etc.
```

---

## 🗄️ Database Schema (Adapted to Prisma)

### New Models for Cleaning Vertical

```prisma
// Cleaning Leads
model CleaningLead {
  id              String   @id @default(cuid())
  orgId           String
  org             Org      @relation(fields: [orgId], references: [id])
  
  // Contact info
  company         String?
  contactName     String
  email           String?
  phone           String?
  
  // Site info
  address         String
  city            String
  state           String
  zip             String
  lat             Decimal?
  lon             Decimal?
  
  // Service details
  spaceType       String   // residential, commercial, post-construction
  squareFeet      Int?
  frequency       String?  // one-time, weekly, bi-weekly, monthly
  
  // Status
  status          String   @default("NEW") // NEW, CONTACTED, ESTIMATED, WON, LOST
  
  // AI estimate
  aiEstimateJson  Json?
  aiTokensUsed    Int?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  estimates       CleaningEstimate[]
  
  @@index([orgId, status])
  @@index([orgId, createdAt])
}

// Cleaning Estimates
model CleaningEstimate {
  id              String   @id @default(cuid())
  orgId           String
  org             Org      @relation(fields: [orgId], references: [id])
  leadId          String?
  lead            CleaningLead? @relation(fields: [leadId], references: [id])
  
  // Estimate details
  version         Int      @default(1)
  spaceType       String
  squareFeet      Int
  frequency       String
  
  // Pricing (3 options: Good, Better, Best)
  optionsJson     Json     // [{tier, price, scope, features}]
  
  // Status
  status          String   @default("DRAFT") // DRAFT, SENT, ACCEPTED, REJECTED
  acceptedOption  String?  // good, better, best
  
  // E-signature
  signedAt        DateTime?
  signedBy        String?
  signatureUrl    String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  contract        CleaningContract?
  
  @@index([orgId, status])
  @@index([leadId])
}

// Cleaning Contracts
model CleaningContract {
  id              String   @id @default(cuid())
  orgId           String
  org             Org      @relation(fields: [orgId], references: [id])
  estimateId      String   @unique
  estimate        CleaningEstimate @relation(fields: [estimateId], references: [id])
  
  // Contract details
  customerId      String?  // Link to Customer model if exists
  siteAddress     String
  spaceType       String
  squareFeet      Int
  
  // Recurrence (RRULE)
  recurrenceRule  String?  // RRULE format
  frequency       String   // one-time, weekly, bi-weekly, monthly
  startDate       DateTime
  endDate         DateTime?
  
  // Pricing
  basePrice       Decimal
  taxRate         Decimal?
  escalatorPct    Decimal? // Annual price increase %
  
  // SLA
  slaResponseHours Int?
  slaCompletionHours Int?
  
  // Status
  status          String   @default("ACTIVE") // ACTIVE, PAUSED, CANCELLED, COMPLETED
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  workOrders      CleaningWorkOrder[]
  
  @@index([orgId, status])
  @@index([orgId, startDate])
}

// Cleaning Work Orders
model CleaningWorkOrder {
  id              String   @id @default(cuid())
  orgId           String
  org             Org      @relation(fields: [orgId], references: [id])
  contractId      String?
  contract        CleaningContract? @relation(fields: [contractId], references: [id])
  
  // Work order details
  publicId        String   @unique
  siteAddress     String
  spaceType       String
  squareFeet      Int
  
  // Scheduling
  scheduledDate   DateTime
  scheduledStart  DateTime
  scheduledEnd    DateTime
  
  // Assignment
  assignedTo      String?  // User ID
  assignedAt      DateTime?
  
  // Execution
  actualStart     DateTime?
  actualEnd       DateTime?
  
  // Status
  status          String   @default("SCHEDULED") // SCHEDULED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
  
  // Checklist
  checklistJson   Json?    // SOP checklist with completion status
  
  // QA
  inspectionId    String?
  
  // Photos/signatures
  photosJson      Json?    // [{url, timestamp, type}]
  signatureUrl    String?
  signedBy        String?
  signedAt        DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  events          CleaningWorkOrderEvent[]
  inspection      CleaningInspection? @relation(fields: [inspectionId], references: [id])
  
  @@index([orgId, status])
  @@index([orgId, scheduledDate])
  @@index([assignedTo, scheduledDate])
}

// Work Order Events (for timeline/audit)
model CleaningWorkOrderEvent {
  id              String   @id @default(cuid())
  workOrderId     String
  workOrder       CleaningWorkOrder @relation(fields: [workOrderId], references: [id])
  
  eventType       String   // CREATED, ASSIGNED, STARTED, PAUSED, RESUMED, COMPLETED, CANCELLED
  userId          String?
  timestamp       DateTime @default(now())
  metadata        Json?
  
  @@index([workOrderId, timestamp])
}

// QA Inspections
model CleaningInspection {
  id              String   @id @default(cuid())
  orgId           String
  org             Org      @relation(fields: [orgId], references: [id])
  workOrderId     String   @unique
  workOrder       CleaningWorkOrder[]
  
  // Inspection details
  inspectorId     String?  // User ID
  inspectedAt     DateTime?
  
  // Scoring
  checklistJson   Json     // [{item, passed, notes, photo}]
  score           Decimal? // 0-100
  defectsCount    Int      @default(0)
  
  // Status
  status          String   @default("PENDING") // PENDING, IN_PROGRESS, COMPLETED
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([orgId, status])
  @@index([orgId, inspectedAt])
}

// Checklist Templates
model CleaningChecklistTemplate {
  id              String   @id @default(cuid())
  orgId           String
  org             Org      @relation(fields: [orgId], references: [id])
  
  name            String
  spaceType       String   // residential, commercial, post-construction
  itemsJson       Json     // [{category, item, required, photo_required}]
  
  isDefault       Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([orgId, spaceType])
}
```

---

## 🚀 Implementation Phases

### Phase 1: Enhanced Vertical Pack (2-3 hours)

**Goal**: Upgrade `packages/verticals/src/packs/cleaning.ts` with real logic

**Tasks**:
1. ✅ Create comprehensive forms (lead, estimate, work-order)
2. ✅ Create detailed pricebook with SKUs
3. ✅ Implement real estimation logic (not placeholder)
4. ✅ Add checklist templates (residential, commercial, post-construction)
5. ✅ Add AI estimator function (wallet-guarded)

**Files**:
- `packages/verticals/src/packs/cleaning.ts` (enhanced)
- `packages/verticals/cleaning/forms/*.json`
- `packages/verticals/cleaning/pricebook.json`
- `packages/verticals/cleaning/checklists/*.json`
- `packages/verticals/cleaning/estimator.ts`

---

### Phase 2: Database Schema & Migration (1-2 hours)

**Goal**: Add cleaning-specific models to Prisma schema

**Tasks**:
1. ✅ Add models to `apps/tenant-app/prisma/schema.prisma`
2. ✅ Create migration
3. ✅ Run migration on Neon database
4. ✅ Generate Prisma client

**Files**:
- `apps/tenant-app/prisma/schema.prisma`
- `apps/tenant-app/prisma/migrations/YYYYMMDD_add_cleaning_models/migration.sql`

---

### Phase 3: API Routes (4-6 hours)

**Goal**: Implement Next.js API routes for cleaning vertical

**Tasks**:
1. ✅ Leads API (`/api/cleaning/leads`)
2. ✅ Estimates API (`/api/cleaning/estimates`)
3. ✅ AI Estimator API (`/api/cleaning/estimates/[id]/ai`) - wallet guarded
4. ✅ Contracts API (`/api/cleaning/contracts`)
5. ✅ Schedules API (`/api/cleaning/schedules`)
6. ✅ Work Orders API (`/api/cleaning/work-orders`)
7. ✅ QA/Inspections API (`/api/cleaning/qa/inspections`)
8. ✅ Billing API (`/api/cleaning/billing`)

**Patterns to Follow**:
- Use existing auth middleware (`assertOwnerOr403`, etc.)
- Use Zod for validation
- Use Prisma for database access
- Return consistent JSON responses
- Add idempotency keys for mutations

---

### Phase 4: Tenant App UI (6-8 hours)

**Goal**: Build tenant-facing UI for cleaning features

**Tasks**:
1. ✅ Leads Kanban board (`/cleaning/leads`)
2. ✅ Estimate builder (`/cleaning/estimates/[id]`)
3. ✅ Contract editor with RRULE (`/cleaning/contracts/[id]`)
4. ✅ Schedule board (drag-drop) (`/cleaning/schedule`)
5. ✅ Work order detail (`/cleaning/schedule/[id]`)
6. ✅ QA inspections (`/cleaning/qa/inspections`)
7. ✅ Billing review (`/cleaning/billing`)
8. ✅ Analytics dashboard (`/cleaning/analytics`)

**UI Components to Create**:
- `DragDropScheduleBoard` - Drag-and-drop scheduling
- `RRuleEditor` - Recurrence rule editor
- `ChecklistDesigner` - Checklist template builder
- `InspectionScoring` - QA scoring interface
- `EstimateOptionCard` - Good/Better/Best options
- `MapView` - Site locations map

---

### Phase 5: Cron Jobs (2-3 hours)

**Goal**: Implement scheduled jobs for automation

**Tasks**:
1. ✅ Schedule expansion (`/api/cron/cleaning/expand-schedules`)
   - Runs every 15 minutes
   - Expands RRULE contracts into work orders
2. ✅ Invoice generation (`/api/cron/cleaning/generate-invoices`)
   - Runs nightly
   - Creates invoices from completed work orders
3. ✅ Inspection creation (`/api/cron/cleaning/create-inspections`)
   - Runs daily
   - Randomly selects work orders for QA

**Files**:
- `apps/tenant-app/src/app/api/cron/cleaning/expand-schedules/route.ts`
- `apps/tenant-app/src/app/api/cron/cleaning/generate-invoices/route.ts`
- `apps/tenant-app/src/app/api/cron/cleaning/create-inspections/route.ts`
- `vercel.json` (add cron configuration)

---

### Phase 6: Driver PWA (Optional - Future Phase)

**Goal**: Offline-first mobile app for field workers

**Status**: ⏳ **DEFERRED** to future phase

**Rationale**: Focus on core features first, add PWA later

---

## 📊 Success Criteria

### Vertical Pack
- ✅ Forms return real JSON schemas (not placeholders)
- ✅ Pricebook has detailed SKUs with pricing
- ✅ Estimator calculates real totals (not mock data)
- ✅ Checklists are comprehensive and usable

### API Routes
- ✅ All endpoints return proper JSON responses
- ✅ Authentication works correctly
- ✅ Validation catches invalid inputs
- ✅ Database operations are idempotent
- ✅ AI estimator is wallet-guarded (returns 402 on low balance)

### UI
- ✅ Leads board shows leads in correct columns
- ✅ Estimate builder generates 3 options (Good/Better/Best)
- ✅ Contract editor saves RRULE correctly
- ✅ Schedule board allows drag-and-drop
- ✅ Work orders show checklist completion
- ✅ QA inspections calculate scores correctly

### Automation
- ✅ Cron jobs run on schedule
- ✅ Work orders are created from contracts
- ✅ Invoices are generated from work orders
- ✅ Inspections are created randomly

---

## 🎯 Next Steps

1. **Implement Phase 1** (Enhanced Vertical Pack) - 2-3 hours
2. **Implement Phase 2** (Database Schema) - 1-2 hours
3. **Test vertical pack** with test tenant
4. **Continue with Phases 3-5** as needed

---

**Status**: ✅ Plan Complete | ⏳ Ready to Implement Phase 1

