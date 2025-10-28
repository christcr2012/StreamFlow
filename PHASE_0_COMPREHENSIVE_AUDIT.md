# Phase 0 - Comprehensive System Audit

**Date:** October 27, 2025  
**Auditor:** GitHub Copilot  
**Scope:** Full system audit against Prisma schemas

---

## Executive Summary

### Schema Analysis

- **Tenant Schema:** 90 models (prisma/schema.prisma)
- **Provider Schema:** 76 models (apps/provider-portal/prisma/schema.prisma)
- **Total Unique Entities:** ~95 (some overlap)

### Implementation Status

- ✅ **Production Ready:** ~35 models (Onboarding, Auth, Monetization, Jobs)
- ⚠️ **Partial/Stub:** ~30 models (API exists but returns placeholders)
- ❌ **Missing:** ~25 models (No API or frontend at all)

### Critical Gaps

1. **CRM Core:** Lead/Opportunity/Organization pages missing or incomplete
2. **Communications:** Stub API, no Twilio/Resend integration
3. **Time Tracking:** Stub API, no GPS capture
4. **Scheduling:** Stub data, no real Job scheduling
5. **AI Budget:** Stub data, no real AIUsageEvent logging
6. **Subcontractors:** Stub API, no document management
7. **Recurring Services:** Basic CRUD but no auto-job-creation
8. **Job Costing:** Stub API, no variance tracking

---

## Part 1: Prisma Schema Models (Tenant)

### ✅ Production Ready (35 models)

| Model                   | Backend                          | Frontend              | Status   |
| ----------------------- | -------------------------------- | --------------------- | -------- |
| User                    | ✅ /api/auth/\*                  | ✅ /login, /dashboard | Complete |
| Org                     | ✅ /api/v2/organizations         | ✅ /settings          | Complete |
| Customer                | ✅ /api/customers                | ✅ /customers         | Complete |
| CustomerContact         | ✅ /api/customers/[id]           | ✅ /customers/[id]    | Complete |
| Invoice                 | ✅ /api/invoices                 | ✅ /invoices          | Complete |
| InvoiceLine             | ✅ /api/invoices/[id]            | ✅ /invoices/[id]     | Complete |
| Payment                 | ✅ /api/payments                 | ✅ /payments          | Complete |
| Job                     | ✅ /api/jobs                     | ✅ /jobs              | Complete |
| JobPhoto                | ✅ /api/jobs/[id]/photos         | ✅ /jobs/[id]         | Complete |
| JobTimeline             | ✅ /api/jobs/[id]                | ✅ /jobs/[id]         | Complete |
| Agreement               | ✅ /api/agreements               | ✅ /agreements        | Complete |
| AgreementTemplate       | ✅ /api/agreements               | ✅ /settings          | Complete |
| RbacRole                | ✅ /api/permissions              | ✅ /settings          | Complete |
| RbacPermission          | ✅ /api/permissions              | ✅ /settings          | Complete |
| RbacRolePermission      | ✅ /api/permissions              | ✅ /settings          | Complete |
| RbacUserRole            | ✅ /api/permissions              | ✅ /settings          | Complete |
| Subscription            | ✅ Stripe webhooks               | ✅ /settings          | Complete |
| BillingLedger           | ✅ /api/invoices                 | ✅ /invoices          | Complete |
| AddonPurchase           | ✅ Stripe webhooks               | ✅ /settings          | Complete |
| RefreshToken            | ✅ /api/auth/refresh             | N/A                   | Complete |
| UserLoginHistory        | ✅ Auth middleware               | ✅ /settings          | Complete |
| UserDeviceFingerprint   | ✅ Auth middleware               | N/A                   | Complete |
| UserRecoveryCode        | ✅ /api/auth/\*                  | ✅ /login             | Complete |
| UserSecurityQuestion    | ✅ /api/auth/\*                  | ✅ /login             | Complete |
| UserBreakglassAccount   | ✅ /api/auth/emergency           | ✅ /emergency         | Complete |
| BreakglassActivationLog | ✅ /api/auth/emergency           | ✅ /emergency         | Complete |
| RecoveryRequest         | ✅ /api/auth/\*                  | ✅ /login             | Complete |
| AuditLog                | ✅ Middleware                    | ✅ /settings          | Complete |
| AuditEvent              | ✅ Middleware                    | ✅ /settings          | Complete |
| Activity                | ✅ Middleware                    | ✅ /dashboard         | Complete |
| Notification            | ✅ /api/notifications            | ✅ /notifications     | Complete |
| FederationKey           | ✅ Provider sync                 | N/A                   | Complete |
| OIDCConfig              | ✅ /api/settings/\*              | ✅ /settings          | Complete |
| EmailTemplate           | ✅ /api/settings/email-templates | ✅ /settings          | Complete |
| OnboardingInvite        | ✅ Onboarding flow               | ✅ /login             | Complete |
| Coupon                  | ✅ Stripe sync                   | ✅ /settings          | Complete |

### ⚠️ Partial Implementation - Stubs (30 models)

| Model               | Backend                             | Frontend               | Issue                | Phase 1 Task                           |
| ------------------- | ----------------------------------- | ---------------------- | -------------------- | -------------------------------------- |
| Lead                | ⚠️ /api/leads                       | ⚠️ Missing page        | No list/detail pages | Create /leads, /leads/[id], /leads/new |
| Lead                | ⚠️ /api/v2/leads                    | ❌ Not wired           | Returns 501          | Implement real Prisma query            |
| Opportunity         | ⚠️ /api/v2/opportunities            | ❌ Missing page        | Returns [] stub      | Create /opportunities page             |
| Communication       | ⚠️ STUB /api/communications         | ❌ Missing page        | No Twilio/Resend     | Integrate services, create UI          |
| CommunicationThread | ⚠️ STUB /api/communications/threads | ❌ Missing page        | No threading         | Build thread UI                        |
| AIBudget            | ⚠️ STUB /api/ai/budget              | ⚠️ Basic UI            | No real data         | Wire to AIUsageEvent                   |
| AIAlert             | ⚠️ STUB /api/ai/alerts              | ⚠️ Basic UI            | No real alerts       | Create alert triggers                  |
| AiUsageEvent        | ❌ No API                           | ❌ No UI               | Not logging          | Add event logging to AI calls          |
| AIUsageLog          | ⚠️ /api/ai-usage                    | ⚠️ Basic UI            | Duplicate of above?  | Consolidate or clarify                 |
| AiMonthlySummary    | ❌ No API                           | ❌ No UI               | Not summarizing      | Add monthly rollup job                 |
| SMSLog              | ❌ No API                           | ❌ No UI               | Not logging SMS      | Log in Twilio service                  |
| CostAlert           | ⚠️ /api/cost-alerts                 | ⚠️ Basic UI            | No trigger logic     | Add threshold checks                   |
| TimeEntry           | ⚠️ STUB /api/time-tracking          | ⚠️ /time-tracking      | No GPS capture       | Add GPS, approval flow                 |
| Subcontractor       | ⚠️ STUB /api/subcontractors         | ⚠️ /subcontractors     | No docs upload       | Add document management                |
| RecurringService    | ⚠️ /api/recurring-services          | ⚠️ /recurring-services | No auto-jobs         | Add cron job creation                  |
| JobCost             | ⚠️ STUB /api/job-costing            | ⚠️ /job-costing        | No variance calc     | Add cost tracking logic                |
| VerticalPack        | ⚠️ /api/vertical-packs              | ❌ No UI               | No activation flow   | Add pack management UI                 |
| FeatureFlag         | ⚠️ /api/feature-flags               | ❌ No UI               | No toggle UI         | Create feature flags page              |
| FeatureModule       | ⚠️ /api/features                    | ❌ No UI               | No module config     | Create modules page                    |
| SubscriptionTier    | ❌ No API                           | ❌ No UI               | Not queryable        | Add tier management                    |
| VerticalTierConfig  | ❌ No API                           | ❌ No UI               | Not configurable     | Add tier config UI                     |
| TenantSubscription  | ❌ No API                           | ❌ No UI               | Not tracked          | Add subscription dashboard             |
| TenantUsage         | ❌ No API                           | ❌ No UI               | Not metered          | Add usage tracking                     |
| ImportJob           | ⚠️ /api/import/csv                  | ❌ No UI               | No status page       | Add import history page                |
| ImportError         | ⚠️ /api/import/csv                  | ❌ No UI               | Not displayed        | Show errors in UI                      |
| ImportMapping       | ❌ No API                           | ❌ No UI               | No mapper UI         | Create field mapping page              |
| Rfp                 | ⚠️ /api/rfps                        | ❌ No UI               | No list page         | Create RFP management page             |
| Referral            | ❌ No API                           | ❌ No UI               | Not tracked          | Add referral tracking                  |
| PricingPlan         | ❌ No API                           | ❌ No UI               | Not editable         | Add pricing admin                      |
| ProviderConfig      | ❌ No API (tenant)                  | ❌ No UI               | Provider-only        | N/A for tenant                         |

### ❌ Missing Entirely (25 models)

| Model                     | Schema Purpose              | Phase 1 Task                                       |
| ------------------------- | --------------------------- | -------------------------------------------------- |
| LeadInvoice               | Link leads to invoices      | Create /api/leads/[id]/invoices                    |
| LeadInvoiceLine           | Lead invoice line items     | Include in lead invoice API                        |
| CleaningLead              | Vertical-specific lead      | Add to cleaning vertical pack                      |
| CleaningEstimate          | Cleaning industry estimate  | Create /api/cleaning/estimates (exists but verify) |
| CleaningContract          | Cleaning service agreements | Create /api/cleaning/contracts (exists but verify) |
| CleaningInspection        | QA inspections              | Verify /api/cleaning/inspections                   |
| CleaningWorkOrder         | Cleaning-specific jobs      | Verify /api/cleaning/work-orders                   |
| CleaningWorkOrderEvent    | Work order history          | Add to work order API                              |
| CleaningChecklistTemplate | QA checklist templates      | Create /api/cleaning/checklist-templates           |
| Incident                  | Critical incidents          | Create /api/incidents                              |
| InfrastructureLimit       | Resource limits             | Create /api/infrastructure/limits                  |
| InfrastructureMetric      | System metrics              | Create /api/infrastructure/metrics                 |
| UpgradeRecommendation     | Plan upgrade prompts        | Create /api/upgrades                               |
| UsageMeter                | Usage tracking              | Create /api/usage-meters                           |
| AnalyticsSnapshot         | Analytics snapshots         | Create /api/analytics/snapshots                    |
| AiModelTest               | A/B testing AI models       | Create /api/ai/model-tests                         |
| AiModelTestResult         | Test results                | Add to model-test API                              |
| Offer                     | Special offers/promotions   | Create /api/offers                                 |
| TenantPriceOverride       | Custom pricing              | Create /api/pricing/overrides                      |
| GlobalMonetizationConfig  | Global pricing config       | Create /api/monetization/config                    |
| PlanPrice                 | Plan pricing                | Create /api/plans/prices                           |
| PricePlan                 | ??? (duplicate?)            | Clarify vs PricingPlan                             |
| InvoiceReminder           | Invoice reminder log        | Add to invoice API                                 |
| RecurringInvoice          | Recurring invoices          | Verify /api/invoices/recurring                     |
| ProviderIntegration       | External integrations       | Create /api/integrations                           |

---

## Part 2: Backend API Audit

### Existing Routes (95 routes)

**Auth (8 routes)**

- ✅ /api/auth/login
- ✅ /api/auth/logout
- ✅ /api/auth/callback
- ✅ /api/auth/refresh
- ✅ /api/auth/emergency
- ✅ /api/emergency/select-tenant

**Core Entities (15 routes)**

- ✅ /api/customers
- ✅ /api/customers/[id]
- ✅ /api/jobs
- ✅ /api/jobs/[id]
- ✅ /api/jobs/[id]/photos
- ✅ /api/jobs/[id]/status
- ✅ /api/invoices
- ✅ /api/invoices/[id]
- ✅ /api/invoices/[id]/payment-intent
- ✅ /api/invoices/[id]/payment-link
- ✅ /api/invoices/[id]/payments
- ✅ /api/invoices/[id]/send-reminder
- ✅ /api/invoices/recurring
- ✅ /api/invoices/recurring/[id]
- ✅ /api/payments

**CRM (6 routes)**

- ⚠️ /api/leads (old API)
- ⚠️ /api/leads/[id]
- ⚠️ /api/leads/[id]/convert
- ⚠️ /api/leads/[id]/enrich
- ⚠️ /api/leads/batch-enrich
- ❌ /api/v2/leads (returns 501)
- ❌ /api/v2/opportunities (returns [])
- ✅ /api/v2/organizations

**Communications (5 routes)**

- ⚠️ /api/communications (STUB)
- ⚠️ /api/communications/status
- ⚠️ /api/communications/threads (STUB)
- ⚠️ /api/notifications
- ⚠️ /api/notifications/preview
- ⚠️ /api/notifications/resend

**AI & Budget (5 routes)**

- ⚠️ /api/ai/alerts (STUB)
- ⚠️ /api/ai/budget (STUB)
- ⚠️ /api/ai/usage (STUB)
- ⚠️ /api/ai-usage (duplicate?)
- ✅ /api/ai/email-response

**Operational (11 routes)**

- ⚠️ /api/time-tracking (STUB)
- ⚠️ /api/subcontractors (STUB)
- ⚠️ /api/recurring-services (partial)
- ⚠️ /api/job-costing (STUB)
- ⚠️ /api/schedule/jobs (STUB)
- ⚠️ /api/schedule/jobs/assign
- ⚠️ /api/schedule/jobs/reschedule
- ⚠️ /api/schedule/technicians (STUB)
- ⚠️ /api/documents (partial)
- ✅ /api/agreements
- ✅ /api/agreements/[id]

**Settings & Config (12 routes)**

- ✅ /api/settings/ai
- ✅ /api/settings/theme
- ✅ /api/settings/email-templates
- ✅ /api/settings/email-templates/[type]
- ✅ /api/settings/integrations/email
- ✅ /api/settings/integrations/sms
- ✅ /api/settings/integrations/stripe
- ✅ /api/settings/vendors
- ⚠️ /api/feature-flags (exists but no UI)
- ⚠️ /api/features (partial)
- ⚠️ /api/permissions (exists)
- ⚠️ /api/vertical-packs (exists but no UI)

**Reporting & Analytics (7 routes)**

- ⚠️ /api/reports (STUB)
- ⚠️ /api/reports/customers
- ⚠️ /api/reports/invoices
- ⚠️ /api/reports/jobs
- ⚠️ /api/reports/revenue
- ⚠️ /api/cost-alerts
- ⚠️ /api/cost-alerts/usage
- ⚠️ /api/analytics/qa-scores
- ⚠️ /api/analytics/schedule-adherence

**Cleaning Vertical (9 routes)**

- ⚠️ /api/cleaning/contracts (verify implementation)
- ⚠️ /api/cleaning/estimates (verify implementation)
- ⚠️ /api/cleaning/inspections
- ⚠️ /api/cleaning/inspections/create-scheduled
- ⚠️ /api/cleaning/leads
- ⚠️ /api/cleaning/work-orders
- ⚠️ /api/cleaning/work-orders/[id]/status
- ⚠️ /api/cleaning/schedules/expand
- ⚠️ /api/cleaning/billing/generate-invoices

**Webhooks (3 routes)**

- ✅ /api/webhooks/stripe
- ✅ /api/webhooks/twilio
- ✅ /api/webhooks/resend

**Utilities (7 routes)**

- ✅ /api/health/db
- ✅ /api/import/csv
- ⚠️ /api/estimates (generic)
- ⚠️ /api/rfps
- ⚠️ /api/rfps/[id]
- ⚠️ /api/rfps/[id]/analyze
- ✅ /api/wallet
- ✅ /api/wallet/transactions
- ✅ /api/theme
- ✅ /api/sse
- ✅ /api/realtime/token

### Missing APIs (25 endpoints needed)

1. ❌ /api/v2/leads (real implementation)
2. ❌ /api/v2/opportunities (real implementation)
3. ❌ /api/v2/contacts (CustomerContact)
4. ❌ /api/leads/[id]/invoices (LeadInvoice)
5. ❌ /api/incidents
6. ❌ /api/incidents/[id]
7. ❌ /api/infrastructure/limits
8. ❌ /api/infrastructure/metrics
9. ❌ /api/upgrades
10. ❌ /api/usage-meters
11. ❌ /api/analytics/snapshots
12. ❌ /api/ai/model-tests
13. ❌ /api/ai/model-tests/[id]/results
14. ❌ /api/ai/monthly-summaries
15. ❌ /api/offers
16. ❌ /api/pricing/overrides
17. ❌ /api/monetization/config
18. ❌ /api/plans/prices
19. ❌ /api/integrations
20. ❌ /api/integrations/[provider]
21. ❌ /api/cleaning/checklist-templates
22. ❌ /api/import/jobs (ImportJob status)
23. ❌ /api/import/mappings
24. ❌ /api/referrals
25. ❌ /api/subscription-tiers

---

## Part 3: Frontend Pages Audit

### Existing Pages (20 pages)

**Auth & Dashboard**

- ✅ /login
- ✅ /dashboard
- ✅ /emergency

**Core Operations**

- ✅ /customers
- ✅ /customers/[id]
- ✅ /jobs
- ✅ /jobs/[id]
- ✅ /invoices
- ✅ /invoices/[id]
- ✅ /payments
- ✅ /pay/[invoiceId]

**Stubs/Partial**

- ⚠️ /communications (exists but uses stub API)
- ⚠️ /time-tracking (exists but uses stub API)
- ⚠️ /subcontractors (exists but uses stub API)
- ⚠️ /recurring-services (exists, partial implementation)
- ⚠️ /job-costing (exists but uses stub API)
- ⚠️ /schedule (exists but uses stub data)

**Settings**

- ✅ /settings (main page)
- ✅ /settings/ai
- ✅ /settings/theme
- ✅ /settings/\* (various sub-pages)

**Other**

- ✅ /agreements
- ✅ /estimates (cleaning vertical)
- ✅ /documents
- ✅ /reports (basic)
- ✅ /notifications
- ✅ /wallet
- ✅ /offline
- ✅ /403

### Missing Pages (30+ pages needed)

**CRM Core**

1. ❌ /leads - Lead list view with filters
2. ❌ /leads/new - Create lead form
3. ❌ /leads/[id] - Lead detail view
4. ❌ /leads/[id]/edit - Edit lead form
5. ❌ /opportunities - Opportunity kanban board
6. ❌ /opportunities/new - Create opportunity
7. ❌ /opportunities/[id] - Opportunity detail
8. ❌ /opportunities/[id]/edit - Edit opportunity
9. ❌ /contacts - Customer contacts list
10. ❌ /contacts/[id] - Contact detail
11. ❌ /organizations - Org hierarchy view (if multi-org)

**Operational** 12. ❌ /incidents - Incident management 13. ❌ /incidents/[id] - Incident detail 14. ❌ /rfps - RFP list 15. ❌ /rfps/[id] - RFP detail with AI analysis 16. ❌ /referrals - Referral tracking 17. ❌ /import/history - Import job history 18. ❌ /import/mappings - Field mapping config

**Admin & Config** 19. ❌ /admin - Admin dashboard 20. ❌ /admin/feature-flags - Feature flag toggles 21. ❌ /admin/features - Feature module config 22. ❌ /admin/vertical-packs - Vertical pack management 23. ❌ /admin/subscription-tiers - Tier config 24. ❌ /admin/pricing - Pricing overrides 25. ❌ /admin/integrations - Integration management 26. ❌ /admin/infrastructure - Limits & metrics

**Analytics & Reporting** 27. ❌ /reports/analytics - Analytics dashboard 28. ❌ /reports/pipeline - Sales pipeline 29. ❌ /reports/conversion - Lead conversion funnel 30. ❌ /reports/usage - Usage analytics

**Cleaning Vertical** 31. ⚠️ Verify /cleaning/\* pages exist and are complete 32. ❌ /cleaning/checklist-templates - QA checklists

---

## Part 4: Services & Packages Audit

### Existing Packages

- ✅ packages/db - Shared Prisma client
- ✅ packages/auth-service - Auth utilities
- ✅ packages/stripe-service - Stripe integration
- ✅ packages/twilio-service - Twilio SMS (needs wiring to Communication model)
- ✅ packages/resend-service - Email service (needs wiring to Communication model)
- ✅ packages/queue - BullMQ job queue
- ✅ packages/wallet - Wallet balance management
- ✅ packages/kv - Redis/KV store utilities
- ✅ packages/ui - Shared UI components
- ✅ packages/ui-components - Component library
- ✅ packages/themes - Theme system
- ✅ packages/verticals - Vertical-specific logic
- ✅ packages/config - Shared configuration

### Missing Service Layers (10+ services)

1. ❌ **Communication Service** - Orchestrate Twilio/Resend, save to Communication table
2. ❌ **AI Usage Tracker** - Log AIUsageEvent on every AI call
3. ❌ **AI Budget Monitor** - Check budget, create AIAlert on threshold
4. ❌ **Lead Enrichment Service** - AI-powered lead data enrichment
5. ❌ **Lead Deduplication Service** - identityHash generation & matching
6. ❌ **Recurring Job Creator** - Cron job for RecurringService → Job
7. ❌ **Job Cost Calculator** - Calculate variance, profit margin for JobCost
8. ❌ **Import Mapper Service** - Map CSV columns to Prisma fields
9. ❌ **Analytics Aggregator** - Create AnalyticsSnapshot records
10. ❌ **Usage Meter Service** - Track TenantUsage for billing
11. ❌ **Upgrade Recommender** - Create UpgradeRecommendation based on usage
12. ❌ **Incident Escalator** - Auto-escalate critical incidents
13. ❌ **Referral Tracker** - Track and reward referrals

---

## Part 5: Test Coverage Audit

### Existing Tests

- ⚠️ Some E2E tests in tests/e2e-playwright/
- ⚠️ Some unit tests in tests/unit/
- ✅ Created tests/unit/api/v2/leads.test.ts (14 tests passing)

### Missing Test Coverage (50+ test files needed)

**Unit Tests (25 files)**

1. ❌ tests/unit/api/v2/opportunities.test.ts
2. ❌ tests/unit/api/v2/organizations.test.ts
3. ❌ tests/unit/api/v2/contacts.test.ts
4. ❌ tests/unit/services/communication-service.test.ts
5. ❌ tests/unit/services/ai-usage-tracker.test.ts
6. ❌ tests/unit/services/ai-budget-monitor.test.ts
7. ❌ tests/unit/services/lead-enrichment.test.ts
8. ❌ tests/unit/services/lead-deduplication.test.ts
9. ❌ tests/unit/services/recurring-job-creator.test.ts
10. ❌ tests/unit/services/job-cost-calculator.test.ts
11. ❌ tests/unit/api/communications.test.ts
12. ❌ tests/unit/api/time-tracking.test.ts
13. ❌ tests/unit/api/subcontractors.test.ts
14. ❌ tests/unit/api/recurring-services.test.ts
15. ❌ tests/unit/api/job-costing.test.ts
16. ❌ tests/unit/api/documents.test.ts
17. ❌ tests/unit/api/incidents.test.ts
18. ❌ tests/unit/api/rfps.test.ts
19. ❌ tests/unit/api/referrals.test.ts
20. ❌ tests/unit/api/import.test.ts
21. ❌ tests/unit/api/analytics.test.ts
22. ❌ tests/unit/api/feature-flags.test.ts
23. ❌ tests/unit/api/vertical-packs.test.ts
24. ❌ tests/unit/api/subscription-tiers.test.ts
25. ❌ tests/unit/api/pricing.test.ts

**E2E Tests (25 files)**

1. ❌ tests/e2e-playwright/crm/leads.spec.ts
2. ❌ tests/e2e-playwright/crm/opportunities.spec.ts
3. ❌ tests/e2e-playwright/crm/contacts.spec.ts
4. ❌ tests/e2e-playwright/crm/organizations.spec.ts
5. ❌ tests/e2e-playwright/communications/send-sms.spec.ts
6. ❌ tests/e2e-playwright/communications/send-email.spec.ts
7. ❌ tests/e2e-playwright/communications/threads.spec.ts
8. ❌ tests/e2e-playwright/time-tracking/clock-in-out.spec.ts
9. ❌ tests/e2e-playwright/time-tracking/gps-capture.spec.ts
10. ❌ tests/e2e-playwright/time-tracking/approval.spec.ts
11. ❌ tests/e2e-playwright/subcontractors/create.spec.ts
12. ❌ tests/e2e-playwright/subcontractors/documents.spec.ts
13. ❌ tests/e2e-playwright/recurring-services/create.spec.ts
14. ❌ tests/e2e-playwright/recurring-services/auto-jobs.spec.ts
15. ❌ tests/e2e-playwright/job-costing/track-costs.spec.ts
16. ❌ tests/e2e-playwright/job-costing/variance.spec.ts
17. ❌ tests/e2e-playwright/schedule/assign-jobs.spec.ts
18. ❌ tests/e2e-playwright/schedule/reschedule.spec.ts
19. ❌ tests/e2e-playwright/ai/budget-alerts.spec.ts
20. ❌ tests/e2e-playwright/ai/usage-tracking.spec.ts
21. ❌ tests/e2e-playwright/import/csv-upload.spec.ts
22. ❌ tests/e2e-playwright/import/field-mapping.spec.ts
23. ❌ tests/e2e-playwright/incidents/create.spec.ts
24. ❌ tests/e2e-playwright/rfps/analyze.spec.ts
25. ❌ tests/e2e-playwright/reports/analytics.spec.ts

---

## Part 6: Documentation & Trace Matrix

### Existing Docs

- ✅ Multiple planning docs (PLAN.md, IMPLEMENTATION_STATUS.md, etc.)
- ✅ COPILOT_OPERATING_PROCEDURE.md (this audit follows that process)
- ⚠️ No trace matrix yet

### Missing Documentation

1. ❌ /docs/trace-matrix.md - Comprehensive Model → Backend → Frontend → Tests mapping
2. ❌ /docs/api-reference.md - Complete API reference
3. ❌ /docs/service-architecture.md - Service layer documentation
4. ❌ /docs/integration-guide.md - Twilio/Resend/Stripe integration guide
5. ❌ /docs/vertical-packs.md - Vertical pack system documentation
6. ❌ /docs/testing-strategy.md - Test coverage requirements

---

## Phase 0.5: Prioritized Work Plan

### Priority 1: CRM Core (Critical Business Value)

**Models:** Lead, Opportunity, Organization, CustomerContact  
**Effort:** 2-3 weeks  
**Deliverables:**

- [ ] Backend: Implement /api/v2/leads with Prisma (deduplication, search, pagination)
- [ ] Backend: Implement /api/v2/opportunities with Prisma (stage tracking, value)
- [ ] Backend: Implement /api/v2/contacts
- [ ] Frontend: Create /leads page (list, filters, search)
- [ ] Frontend: Create /leads/[id] page (detail, timeline, convert action)
- [ ] Frontend: Create /leads/new page (create form with validation)
- [ ] Frontend: Create /opportunities page (kanban board, drag-drop)
- [ ] Frontend: Create /opportunities/[id] page (detail, value tracking)
- [ ] Frontend: Create /contacts page (list, CRUD)
- [ ] Services: Lead deduplication service (identityHash)
- [ ] Services: Lead enrichment service (AI-powered)
- [ ] Tests: 14 unit tests (leads, opportunities, contacts)
- [ ] Tests: 8 E2E tests (lead creation, opportunity conversion, contact management)

### Priority 2: Communications (Customer Engagement)

**Models:** Communication, CommunicationThread  
**Effort:** 1-2 weeks  
**Deliverables:**

- [ ] Service: Communication service (orchestrate Twilio/Resend)
- [ ] Backend: Replace /api/communications stub with real implementation
- [ ] Backend: Replace /api/communications/threads stub
- [ ] Backend: Save to Communication table on send
- [ ] Backend: Update status on webhooks
- [ ] Frontend: Create /communications page (thread view)
- [ ] Frontend: Add send SMS/email modals
- [ ] Frontend: Show delivery status
- [ ] Tests: 4 unit tests (send, receive, status update)
- [ ] Tests: 3 E2E tests (send SMS, send email, thread view)

### Priority 3: AI Budget & Usage (Cost Control)

**Models:** AIUsageEvent, AIBudget, AIAlert, AiMonthlySummary  
**Effort:** 1 week  
**Deliverables:**

- [ ] Service: AI usage tracker (log every AI call)
- [ ] Service: AI budget monitor (check threshold, create alerts)
- [ ] Backend: Replace /api/ai/usage stub
- [ ] Backend: Replace /api/ai/budget stub
- [ ] Backend: Replace /api/ai/alerts stub
- [ ] Backend: Add /api/ai/monthly-summaries
- [ ] Frontend: Wire /settings/ai-usage to real data
- [ ] Frontend: Add budget threshold controls
- [ ] Frontend: Add alert notifications
- [ ] Tests: 6 unit tests (logging, budget check, alerts)
- [ ] Tests: 2 E2E tests (budget exceeded, alert display)

### Priority 4: Time Tracking (Operations)

**Models:** TimeEntry  
**Effort:** 1 week  
**Deliverables:**

- [ ] Backend: Replace /api/time-tracking stub
- [ ] Backend: Add GPS capture endpoints
- [ ] Backend: Add approval workflow
- [ ] Frontend: Add clock in/out UI with GPS
- [ ] Frontend: Add manager approval interface
- [ ] Frontend: Add timesheet view
- [ ] Tests: 4 unit tests (clock in/out, GPS, approval)
- [ ] Tests: 3 E2E tests (full time tracking flow)

### Priority 5: Scheduling (Resource Management)

**Models:** Job (existing), User (existing)  
**Effort:** 1 week  
**Deliverables:**

- [ ] Backend: Replace /api/schedule/jobs stub
- [ ] Backend: Replace /api/schedule/technicians stub
- [ ] Backend: Real job assignment logic
- [ ] Frontend: Wire /schedule to real data
- [ ] Frontend: Add drag-drop job assignment
- [ ] Frontend: Add schedule conflict detection
- [ ] Tests: 4 unit tests (assign, reschedule, conflicts)
- [ ] Tests: 2 E2E tests (assign job, reschedule)

### Priority 6: Recurring Services (Revenue)

**Models:** RecurringService (existing but incomplete)  
**Effort:** 3-5 days  
**Deliverables:**

- [ ] Service: Recurring job creator (cron job)
- [ ] Backend: Complete /api/recurring-services (auto-job creation)
- [ ] Backend: Add renewal workflow
- [ ] Backend: Send customer confirmation emails
- [ ] Frontend: Add auto-job toggle
- [ ] Frontend: Add schedule preview
- [ ] Tests: 4 unit tests (create, auto-job, renewal)
- [ ] Tests: 2 E2E tests (create recurring, verify auto-job)

### Priority 7: Job Costing (Profitability)

**Models:** JobCost  
**Effort:** 3-5 days  
**Deliverables:**

- [ ] Service: Job cost calculator (variance, margin)
- [ ] Backend: Replace /api/job-costing stub
- [ ] Backend: Add auto-calculation on job completion
- [ ] Backend: Add budget threshold alerts
- [ ] Frontend: Wire /job-costing to real data
- [ ] Frontend: Add cost entry forms
- [ ] Frontend: Add variance/profit charts
- [ ] Tests: 4 unit tests (cost calc, variance, alerts)
- [ ] Tests: 2 E2E tests (enter costs, view variance)

### Priority 8: Subcontractors (Vendor Management)

**Models:** Subcontractor  
**Effort:** 3-5 days  
**Deliverables:**

- [ ] Backend: Replace /api/subcontractors stub
- [ ] Backend: Add insurance validation
- [ ] Backend: Add document upload (Vercel Blob)
- [ ] Frontend: Wire /subcontractors to real data
- [ ] Frontend: Add document upload UI
- [ ] Frontend: Add rating display
- [ ] Tests: 3 unit tests (CRUD, insurance check)
- [ ] Tests: 2 E2E tests (create, upload docs)

### Priority 9: Documents (Content Management)

**Models:** (No explicit model, uses Vercel Blob)  
**Effort:** 3-5 days  
**Deliverables:**

- [ ] Backend: Complete /api/documents implementation
- [ ] Backend: Add document search
- [ ] Backend: Add access control (org-scoped)
- [ ] Frontend: Wire /documents to real API
- [ ] Frontend: Add upload UI
- [ ] Frontend: Add search/filter
- [ ] Tests: 3 unit tests (upload, search, access)
- [ ] Tests: 2 E2E tests (upload, search)

### Priority 10: Reporting & Analytics (Insights)

**Models:** AnalyticsSnapshot, AiMonthlySummary  
**Effort:** 1 week  
**Deliverables:**

- [ ] Service: Analytics aggregator (daily snapshots)
- [ ] Backend: Replace /api/reports stub
- [ ] Backend: Add /api/analytics/snapshots
- [ ] Frontend: Create /reports/analytics page
- [ ] Frontend: Create /reports/pipeline page
- [ ] Frontend: Create /reports/conversion page
- [ ] Frontend: Add charts (revenue, pipeline, conversion)
- [ ] Tests: 4 unit tests (snapshot creation, queries)
- [ ] Tests: 3 E2E tests (view reports, filters)

---

## Phase 1 Scaffold Plan

Based on this audit, Phase 1 will create:

### Backend Scaffolding

- [ ] 25 new API route files with TODO placeholders
- [ ] 13 service layer files with typed interfaces
- [ ] Zod validation schemas for all inputs

### Frontend Scaffolding

- [ ] 30 new page files with basic layout
- [ ] 50 new component files with prop types
- [ ] Form schemas for all CRUD operations

### Testing Scaffolding

- [ ] 25 unit test files with test case placeholders
- [ ] 25 E2E test files with scenario placeholders

### Documentation

- [ ] /docs/trace-matrix.md (100% structural coverage)
- [ ] /docs/api-reference.md
- [ ] /docs/service-architecture.md

### Total Files to Create: ~170 files

---

## Next Steps

1. ✅ **Phase 0 Complete:** This audit document
2. **Phase 0.5:** User approval of prioritization
3. **Phase 1:** Execute scaffold plan (create all 170 files with TODOs)
4. **Phase 2:** Replace placeholders with real implementations (priority order)
5. **Phase 3:** Testing & validation

**Estimated Timeline:**

- Phase 1 Scaffolding: 1-2 weeks
- Phase 2 Implementation: 8-12 weeks (based on priorities)
- Phase 3 Testing: 2-3 weeks

**Total:** 11-17 weeks to complete all priorities

---

## Appendix: Model Counts

### Tenant Schema Models (90)

```
Activity, AddonPurchase, Agreement, AgreementTemplate, AiModelTest,
AiModelTestResult, AiMonthlySummary, AiUsageEvent, AIUsageLog, SMSLog,
CostAlert, AnalyticsSnapshot, AuditEvent, AuditLog, BillingLedger,
BreakglassActivationLog, CleaningChecklistTemplate, CleaningContract,
CleaningEstimate, CleaningInspection, CleaningLead, CleaningWorkOrder,
CleaningWorkOrderEvent, Coupon, Customer, CustomerContact, EmailTemplate,
FederationKey, GlobalMonetizationConfig, ImportError, ImportJob,
ImportMapping, Incident, InfrastructureLimit, InfrastructureMetric,
Invoice, InvoiceLine, InvoiceReminder, Job, JobPhoto, JobTimeline,
Lead, LeadInvoice, LeadInvoiceLine, Notification, OIDCConfig, Offer,
OnboardingInvite, Opportunity, Org, Payment, PlanPrice, PricePlan,
PricingPlan, ProviderConfig, ProviderIntegration, RbacPermission,
RbacRole, RbacRolePermission, RbacUserRole, RecoveryRequest,
RecurringInvoice, Referral, RefreshToken, Rfp, Subscription,
TenantPriceOverride, UpgradeRecommendation, UsageMeter, User,
UserBreakglassAccount, UserDeviceFingerprint, UserLoginHistory,
UserRecoveryCode, UserSecurityQuestion, FeatureFlag, FeatureModule,
AIBudget, AIAlert, Communication, CommunicationThread, SubscriptionTier,
VerticalTierConfig, TenantSubscription, TenantUsage, TimeEntry,
Subcontractor, RecurringService, JobCost, VerticalPack
```

### Provider Schema Models (76)

```
Org, User, UserRecoveryCode, UserSecurityQuestion, UserBreakglassAccount,
UserDeviceFingerprint, UserLoginHistory, BreakglassActivationLog,
RecoveryRequest, Lead, Customer, Opportunity, Invoice, Payment, Rfp,
Job, Referral, BillingLedger, LeadInvoice, LeadInvoiceLine, AuditLog,
RbacPermission, RbacRole, RbacRolePermission, RbacUserRole,
ProviderConfig, PricingPlan, AiUsageEvent, AiMonthlySummary,
InfrastructureMetric, InfrastructureLimit, UpgradeRecommendation,
Activity, Subscription, UsageMeter, AddonPurchase, FederationKey,
OIDCConfig, ProviderIntegration, AuditEvent, AnalyticsSnapshot,
Incident, InvoiceLine, Notification, PricePlan, PlanPrice, Offer,
Coupon, TenantPriceOverride, GlobalMonetizationConfig, OnboardingInvite,
FederatedClient, WebhookRegistration, EscalationTicket, FederationInvoice,
IdempotencyKey, DeveloperAPIKey, SecretsRotationPolicy,
SecretsRotationHistory, CustomFieldDefinition, CustomFieldValue,
ComplianceFramework, ComplianceAudit, ComplianceFinding,
DataRetentionPolicy, EncryptionConfig, VulnerabilityScan,
WebhookEndpoint, WebhookDelivery, DeveloperApiKey, ApiUsageMetric,
AiAssistantConversation, MarketingPricingPlan, MarketingPricingFeature,
MarketingPricingHistory
```

---

**End of Phase 0 Audit**
