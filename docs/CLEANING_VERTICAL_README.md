# Cleaning Vertical - Complete Implementation Guide

**Status:** ✅ Production Ready  
**Last Updated:** 2025-10-16  
**Version:** 1.0.0

## Overview

The Cleaning Vertical is a complete, production-ready implementation for commercial cleaning businesses. It provides end-to-end workflow management from lead generation through invoicing, with automated scheduling, quality assurance, and billing.

## Features

### 1. Lead Management
- **Location:** `apps/tenant-app/src/app/(tenant)/cleaning/leads/page.tsx`
- **API:** `apps/tenant-app/src/app/api/cleaning/leads/route.ts`
- **Features:**
  - Lead capture with contact information
  - Property details (address, type, square footage)
  - Service requirements and frequency
  - Lead status tracking (new, contacted, qualified, converted, lost)
  - Lead source tracking

### 2. Estimate Generation
- **Location:** `apps/tenant-app/src/app/(tenant)/cleaning/estimates/page.tsx`
- **API:** `apps/tenant-app/src/app/api/cleaning/estimates/route.ts`
- **Features:**
  - Good/Better/Best pricing tiers
  - Automated pricing calculation using vertical pack
  - Complexity multipliers (1.0-2.0x)
  - Frequency discounts (weekly 15%, bi-weekly 10%, monthly 5%)
  - 27 SKUs in price book
  - Estimate status tracking (draft, sent, accepted, rejected, expired)

### 3. Contract Management
- **Location:** `apps/tenant-app/src/app/(tenant)/cleaning/contracts/page.tsx`
- **API:** `apps/tenant-app/src/app/api/cleaning/contracts/route.ts`
- **Features:**
  - Recurring contract creation
  - RRULE-based scheduling (RFC 5545)
  - Contract terms and pricing
  - Tax rate configuration
  - Price escalation clauses
  - SLA response and completion hours
  - Contract status tracking (draft, active, paused, cancelled, expired)

### 4. Work Order Scheduling
- **Location:** `apps/tenant-app/src/app/(tenant)/cleaning/schedules/page.tsx`
- **API:** `apps/tenant-app/src/app/api/cleaning/work-orders/route.ts`
- **Features:**
  - Drag-and-drop scheduling board
  - Work order creation and assignment
  - Status tracking (scheduled, in_progress, completed, cancelled, failed)
  - Timeline/audit trail via work order events
  - Automated schedule expansion (cron job)

### 5. Quality Assurance
- **Location:** `apps/tenant-app/src/app/(tenant)/cleaning/qa/page.tsx`
- **API:** `apps/tenant-app/src/app/api/cleaning/inspections/route.ts`
- **Features:**
  - Inspection scoring (0-100)
  - Defect tracking and categorization
  - Photo upload support
  - Checklist templates
  - Pass/fail determination
  - Automated inspection creation (cron job)

### 6. Billing & Invoicing
- **Location:** `apps/tenant-app/src/app/(tenant)/cleaning/billing/page.tsx`
- **API:** `apps/tenant-app/src/app/api/cleaning/billing/generate-invoices/route.ts`
- **Features:**
  - Automated invoice generation (cron job)
  - Invoice status tracking (draft, sent, paid, overdue, cancelled)
  - Payment tracking
  - Tax calculation
  - Invoice line items

### 7. Analytics Dashboard
- **Location:** `apps/tenant-app/src/app/(tenant)/cleaning/analytics/page.tsx`
- **Features:**
  - Revenue metrics
  - Work order completion rates
  - Quality scores
  - Customer satisfaction
  - Trend analysis

## Database Schema

### Models (7 total)

1. **CleaningLead**
   - Customer contact information
   - Property details
   - Service requirements
   - Lead status and source

2. **CleaningEstimate**
   - Good/Better/Best pricing tiers
   - Estimate status
   - Validity period
   - Linked to lead

3. **CleaningContract**
   - Recurring agreement details
   - RRULE scheduling
   - Pricing and terms
   - SLA configuration
   - Linked to customer and estimate

4. **CleaningWorkOrder**
   - Individual job details
   - Scheduling information
   - Status tracking
   - Linked to contract

5. **CleaningWorkOrderEvent**
   - Timeline/audit trail
   - Event types (created, assigned, started, completed, etc.)
   - Metadata storage

6. **CleaningInspection**
   - QA scoring
   - Defect tracking
   - Photo storage
   - Pass/fail status
   - Linked to work order

7. **CleaningChecklistTemplate**
   - Reusable QA checklists
   - Item definitions
   - Scoring criteria

## Vertical Pack

**Location:** `packages/verticals/src/packs/cleaning.ts`

### Price Book (27 SKUs)

**Basic Services:**
- General Office Cleaning
- Restroom Cleaning
- Kitchen/Break Room Cleaning
- Floor Sweeping/Mopping
- Vacuuming
- Trash Removal
- Surface Dusting

**Deep Cleaning:**
- Deep Carpet Cleaning
- Floor Stripping/Waxing
- Window Cleaning (Interior)
- Window Cleaning (Exterior)
- High Dusting
- Upholstery Cleaning

**Specialized:**
- Medical Facility Cleaning
- Industrial Cleaning
- Post-Construction Cleaning
- Move-In/Move-Out Cleaning
- Green/Eco-Friendly Cleaning

**Supplies & Equipment:**
- Cleaning Supplies
- Equipment Rental
- Specialty Products
- Consumables

**Additional Services:**
- Emergency Cleaning
- After-Hours Service
- Weekend Service

### Pricing Logic

```typescript
// Complexity multipliers
const complexityMultipliers = {
  low: 1.0,
  medium: 1.3,
  high: 1.6,
  very_high: 2.0
};

// Frequency discounts
const frequencyDiscounts = {
  weekly: 0.15,      // 15% off
  biweekly: 0.10,    // 10% off
  monthly: 0.05,     // 5% off
  quarterly: 0.0,    // No discount
  annual: 0.0        // No discount
};

// Good/Better/Best tiers
const tiers = {
  good: 1.0,         // Base price
  better: 1.3,       // 30% premium
  best: 1.6          // 60% premium
};
```

## Automation (Vercel Cron Jobs)

### 1. Schedule Expansion
- **Endpoint:** `/api/cleaning/schedules/expand`
- **Schedule:** Every 15 minutes (`*/15 * * * *`)
- **Function:** Expands RRULE contracts into work orders
- **Lookhead:** 30 days

### 2. Invoice Generation
- **Endpoint:** `/api/cleaning/billing/generate-invoices`
- **Schedule:** Daily at 2 AM (`0 2 * * *`)
- **Function:** Generates invoices for completed work orders
- **Scope:** Previous day's completed work

### 3. Inspection Creation
- **Endpoint:** `/api/cleaning/inspections/create-scheduled`
- **Schedule:** Daily at 8 AM (`0 8 * * *`)
- **Function:** Creates QA inspections for completed work orders
- **Criteria:** Work orders completed in last 24 hours without inspections

## API Endpoints

### Leads
- `GET /api/cleaning/leads` - List leads
- `POST /api/cleaning/leads` - Create lead

### Estimates
- `GET /api/cleaning/estimates` - List estimates
- `POST /api/cleaning/estimates` - Generate estimate

### Contracts
- `GET /api/cleaning/contracts` - List contracts
- `POST /api/cleaning/contracts` - Create contract

### Work Orders
- `GET /api/cleaning/work-orders` - List work orders
- `POST /api/cleaning/work-orders` - Create work order
- `POST /api/cleaning/work-orders/[id]/status` - Update status

### Inspections
- `GET /api/cleaning/inspections` - List inspections
- `POST /api/cleaning/inspections` - Create inspection

### Automation (Cron)
- `POST /api/cleaning/schedules/expand` - Expand schedules
- `POST /api/cleaning/billing/generate-invoices` - Generate invoices
- `POST /api/cleaning/inspections/create-scheduled` - Create inspections

## Testing

### Test Data
**Script:** `scripts/seed-test-tenants.ts`

Creates 5 test tenants with:
- 3 leads each
- 2 estimates each
- 1 contract each
- Sample work orders
- Sample inspections

### Running Tests
```bash
# Seed test data
npm run seed

# Run typecheck
npm run typecheck

# Run build
npm run build
```

## Deployment

### Environment Variables
```env
DATABASE_URL="postgresql://..."
CRON_SECRET="your-cron-secret"
```

### Vercel Configuration
**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cleaning/schedules/expand",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cleaning/billing/generate-invoices",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cleaning/inspections/create-scheduled",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Future Enhancements

1. **Mobile App** - Field technician app for work order completion
2. **Customer Portal** - Self-service portal for customers
3. **Route Optimization** - Optimize technician routes
4. **Inventory Management** - Track cleaning supplies
5. **Equipment Tracking** - Track equipment usage and maintenance
6. **Employee Management** - Technician scheduling and payroll
7. **Reporting** - Advanced analytics and reporting
8. **Integrations** - QuickBooks, Stripe, etc.

## Support

For questions or issues, contact the development team or refer to:
- `docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md`
- `docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md`
- `docs/PROVIDER_PORTAL_ISSUES_AND_FIXES_2025-10-16.md`

