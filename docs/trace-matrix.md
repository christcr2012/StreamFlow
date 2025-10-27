# Trace Matrix - Cortiware Monorepo

**Generated:** October 27, 2025  
**Purpose:** Map Prisma models → Backend → Frontend → Tests

---

## Format

```
Model.Field | Backend Handler | Frontend Component | Test Coverage | Status
```

**Status Codes:**

- ✅ Complete - Fully implemented and tested
- ⚠️ Partial - Stub or incomplete implementation
- ❌ Missing - Not implemented
- 🔄 In Progress - Currently being worked on

---

## HIGH PRIORITY - CRM Core (Phase 3A)

### Lead Model

| Field                      | Backend                             | Frontend                            | Tests                   | Status      |
| -------------------------- | ----------------------------------- | ----------------------------------- | ----------------------- | ----------- |
| Lead.id                    | /api/v2/leads (GET/POST/PUT/DELETE) | /leads (list), /leads/[id] (detail) | leads.spec.ts           | ❌ Missing  |
| Lead.email                 | /api/v2/leads validation            | LeadForm.tsx email input            | lead-validation.test.ts | ❌ Missing  |
| Lead.company               | /api/v2/leads validation            | LeadForm.tsx company input          | lead-validation.test.ts | ❌ Missing  |
| Lead.contactName           | /api/v2/leads                       | LeadDetail.tsx display              | -                       | ❌ Missing  |
| Lead.phoneE164             | /api/v2/leads validation            | LeadForm.tsx phone input            | -                       | ❌ Missing  |
| Lead.status                | /api/v2/leads filter                | LeadList.tsx status filter          | -                       | ❌ Missing  |
| Lead.sourceType            | /api/v2/leads filter                | LeadList.tsx source filter          | -                       | ❌ Missing  |
| Lead.aiScore               | /api/leads (existing)               | LeadList.tsx score display          | -                       | ✅ Complete |
| Lead.enrichmentJson        | /api/leads enrichment               | LeadDetail.tsx enrichment panel     | -                       | ⚠️ Partial  |
| Lead.identityHash          | /api/v2/leads deduplication         | - (backend only)                    | dedup.test.ts           | ❌ Missing  |
| Lead.convertedToCustomerId | /api/v2/leads convert action        | LeadDetail.tsx convert button       | conversion.test.ts      | ❌ Missing  |

### Customer Model

| Field                    | Backend                     | Frontend                         | Tests           | Status     |
| ------------------------ | --------------------------- | -------------------------------- | --------------- | ---------- |
| Customer.id              | /api/customers (existing)   | /contacts (list)                 | ❌ Missing page | ⚠️ Partial |
| Customer.publicId        | /api/customers              | ContactDetail.tsx                | -               | ⚠️ Partial |
| Customer.company         | /api/customers              | ContactList.tsx, ContactForm.tsx | -               | ⚠️ Partial |
| Customer.primaryEmail    | /api/customers              | ContactForm.tsx email            | -               | ⚠️ Partial |
| Customer.primaryPhone    | /api/customers              | ContactForm.tsx phone            | -               | ⚠️ Partial |
| Customer.billingSettings | /api/customers/[id]/billing | ContactDetail.tsx billing tab    | -               | ❌ Missing |
| Customer.tags            | /api/customers filter       | ContactList.tsx tag filter       | -               | ❌ Missing |

### Opportunity Model

| Field                      | Backend                                     | Frontend                            | Tests                    | Status     |
| -------------------------- | ------------------------------------------- | ----------------------------------- | ------------------------ | ---------- |
| Opportunity.id             | /api/v2/opportunities (GET/POST/PUT/DELETE) | /opportunities (kanban)             | opportunities.spec.ts    | ❌ Missing |
| Opportunity.customerId     | /api/v2/opportunities validation            | OpportunityForm.tsx customer select | -                        | ❌ Missing |
| Opportunity.estValue       | /api/v2/opportunities                       | OpportunityCard.tsx value display   | -                        | ❌ Missing |
| Opportunity.valueType      | /api/v2/opportunities                       | OpportunityForm.tsx type select     | -                        | ❌ Missing |
| Opportunity.stage          | /api/v2/opportunities filter                | OpportunityKanban.tsx columns       | stage-transition.test.ts | ❌ Missing |
| Opportunity.ownerId        | /api/v2/opportunities                       | OpportunityForm.tsx owner select    | -                        | ❌ Missing |
| Opportunity.classification | /api/v2/opportunities                       | OpportunityDetail.tsx metadata      | -                        | ❌ Missing |

### Org Model (Organizations)

| Field                   | Backend                         | Frontend                | Tests           | Status      |
| ----------------------- | ------------------------------- | ----------------------- | --------------- | ----------- |
| Org.id                  | /api/v2/organizations (partial) | /organizations (list)   | ❌ Missing page | ⚠️ Partial  |
| Org.name                | /api/orgs (existing)            | OrgList.tsx             | -               | ⚠️ Partial  |
| Org.metadata            | /api/orgs                       | OrgDetail.tsx settings  | -               | ⚠️ Partial  |
| Org.featureFlags        | /api/features                   | /settings/features      | -               | ⚠️ Stub     |
| Org.activeVerticalPacks | /api/vertical-packs             | /settings/vertical-pack | -               | ⚠️ Stub     |
| Org.brandConfig         | /api/orgs                       | OrgDetail.tsx branding  | -               | ⚠️ Partial  |
| Org.themeSettings       | /lib/themes                     | ThemeSwitcher.tsx       | -               | ✅ Complete |

---

## HIGH PRIORITY - AI & Communications (Phase 3A)

### AIUsageEvent Model

| Field                    | Backend                   | Frontend                        | Tests               | Status  |
| ------------------------ | ------------------------- | ------------------------------- | ------------------- | ------- |
| AIUsageEvent.id          | /api/ai/usage (POST)      | - (backend only)                | ai-tracking.test.ts | ⚠️ Stub |
| AIUsageEvent.orgId       | /api/ai/usage scoping     | -                               | -                   | ⚠️ Stub |
| AIUsageEvent.feature     | /api/ai/usage logging     | /settings/ai-usage breakdown    | -                   | ⚠️ Stub |
| AIUsageEvent.model       | /api/ai/usage logging     | /settings/ai-usage model filter | -                   | ⚠️ Stub |
| AIUsageEvent.tokensIn    | /api/ai/usage calculation | /settings/ai-usage metrics      | -                   | ⚠️ Stub |
| AIUsageEvent.tokensOut   | /api/ai/usage calculation | /settings/ai-usage metrics      | -                   | ⚠️ Stub |
| AIUsageEvent.costUsd     | /api/ai/usage calculation | /settings/ai-usage cost display | -                   | ⚠️ Stub |
| AIUsageEvent.creditsUsed | /api/ai/usage calculation | /settings/ai-usage credits      | -                   | ⚠️ Stub |

### AIBudget Model

| Field                   | Backend                       | Frontend                             | Tests          | Status     |
| ----------------------- | ----------------------------- | ------------------------------------ | -------------- | ---------- |
| AIBudget.monthlyBudget  | /api/ai/budget (GET/PUT)      | /settings/ai-usage budget config     | budget.test.ts | ❌ Missing |
| AIBudget.currentSpend   | /api/ai/usage (update on log) | /settings/ai-usage progress bar      | -              | ⚠️ Stub    |
| AIBudget.alertThreshold | /api/ai/budget                | /settings/ai-usage threshold slider  | -              | ❌ Missing |
| AIBudget.hardLimit      | /api/ai/budget                | /settings/ai-usage hard limit toggle | -              | ❌ Missing |

### AIAlert Model

| Field                | Backend                 | Frontend                       | Tests          | Status  |
| -------------------- | ----------------------- | ------------------------------ | -------------- | ------- |
| AIAlert.id           | /api/ai/alerts (GET)    | /settings/ai-usage alerts list | alerts.test.ts | ⚠️ Stub |
| AIAlert.alertType    | /api/ai/alerts creation | AlertCard.tsx type display     | -              | ⚠️ Stub |
| AIAlert.message      | /api/ai/alerts          | AlertCard.tsx message          | -              | ⚠️ Stub |
| AIAlert.acknowledged | /api/ai/alerts (PUT)    | AlertCard.tsx dismiss button   | -              | ⚠️ Stub |

### Communication Model

| Field                    | Backend                            | Frontend                        | Tests                  | Status     |
| ------------------------ | ---------------------------------- | ------------------------------- | ---------------------- | ---------- |
| Communication.id         | /api/communications/threads (POST) | /communications send form       | comms.spec.ts          | ⚠️ Partial |
| Communication.type       | /api/communications type detection | /communications type selector   | type-detection.test.ts | ⚠️ Stub    |
| Communication.direction  | /api/communications                | /communications message display | -                      | ⚠️ Partial |
| Communication.content    | /api/communications                | /communications message input   | -                      | ⚠️ Partial |
| Communication.status     | /api/communications/webhooks       | /communications delivery status | -                      | ⚠️ Stub    |
| Communication.externalId | Twilio/SendGrid integration        | - (backend only)                | integration.test.ts    | ❌ Missing |

### CommunicationThread Model

| Field                             | Backend                            | Frontend                    | Tests | Status     |
| --------------------------------- | ---------------------------------- | --------------------------- | ----- | ---------- |
| CommunicationThread.id            | /api/communications/threads        | /communications thread list | -     | ⚠️ Partial |
| CommunicationThread.lastMessageAt | /api/communications/threads sort   | /communications sorting     | -     | ⚠️ Partial |
| CommunicationThread.unreadCount   | /api/communications/threads        | /communications badge       | -     | ❌ Missing |
| CommunicationThread.status        | /api/communications/threads filter | /communications filter      | -     | ❌ Missing |

---

## HIGH PRIORITY - Operational Features (Phase 3B)

### TimeEntry Model

| Field                 | Backend                          | Frontend                        | Tests                 | Status     |
| --------------------- | -------------------------------- | ------------------------------- | --------------------- | ---------- |
| TimeEntry.id          | /api/time-tracking (CRUD)        | /time-tracking list             | time-tracking.spec.ts | ⚠️ Stub    |
| TimeEntry.clockIn     | /api/time-tracking/clock-in      | /time-tracking clock in button  | clock-in.test.ts      | ⚠️ Stub    |
| TimeEntry.clockOut    | /api/time-tracking/clock-out     | /time-tracking clock out button | clock-out.test.ts     | ⚠️ Stub    |
| TimeEntry.gpsClockIn  | /api/time-tracking/clock-in GPS  | GPS capture prompt              | gps.test.ts           | ❌ Missing |
| TimeEntry.gpsClockOut | /api/time-tracking/clock-out GPS | GPS capture prompt              | -                     | ❌ Missing |
| TimeEntry.totalHours  | /api/time-tracking calculation   | /time-tracking timesheet        | calculation.test.ts   | ⚠️ Stub    |
| TimeEntry.totalPay    | /api/time-tracking calculation   | /time-tracking timesheet        | -                     | ⚠️ Stub    |
| TimeEntry.status      | /api/time-tracking approval      | /time-tracking approval UI      | approval.test.ts      | ⚠️ Stub    |
| TimeEntry.approvedBy  | /api/time-tracking/approve       | /time-tracking approval badge   | -                     | ❌ Missing |

### Subcontractor Model

| Field                      | Backend                        | Frontend                           | Tests                  | Status     |
| -------------------------- | ------------------------------ | ---------------------------------- | ---------------------- | ---------- |
| Subcontractor.id           | /api/subcontractors (CRUD)     | /subcontractors list               | subcontractors.spec.ts | ⚠️ Stub    |
| Subcontractor.companyName  | /api/subcontractors            | SubcontractorForm.tsx              | -                      | ⚠️ Stub    |
| Subcontractor.specialties  | /api/subcontractors            | SubcontractorForm.tsx multi-select | -                      | ⚠️ Stub    |
| Subcontractor.rating       | /api/subcontractors            | SubcontractorCard.tsx stars        | -                      | ⚠️ Stub    |
| Subcontractor.insurance    | /api/subcontractors validation | SubcontractorDetail.tsx insurance  | insurance.test.ts      | ❌ Missing |
| Subcontractor.availability | /api/subcontractors            | SubcontractorList.tsx filter       | -                      | ⚠️ Stub    |

### RecurringService Model

| Field                            | Backend                             | Frontend                        | Tests             | Status     |
| -------------------------------- | ----------------------------------- | ------------------------------- | ----------------- | ---------- |
| RecurringService.id              | /api/recurring-services (CRUD)      | /recurring-services list        | recurring.spec.ts | ⚠️ Stub    |
| RecurringService.frequency       | /api/recurring-services             | RecurringServiceForm.tsx select | -                 | ⚠️ Stub    |
| RecurringService.nextServiceDate | /api/recurring-services calculation | /recurring-services calendar    | schedule.test.ts  | ⚠️ Stub    |
| RecurringService.autoRenew       | /api/recurring-services             | /recurring-services toggle      | -                 | ❌ Missing |
| RecurringService.status          | /api/recurring-services             | RecurringServiceCard.tsx badge  | -                 | ⚠️ Stub    |

### JobCost Model

| Field                 | Backend                      | Frontend                        | Tests               | Status  |
| --------------------- | ---------------------------- | ------------------------------- | ------------------- | ------- |
| JobCost.id            | /api/job-costing (CRUD)      | /job-costing list               | job-costing.spec.ts | ⚠️ Stub |
| JobCost.laborCost     | /api/job-costing             | JobCostForm.tsx labor input     | -                   | ⚠️ Stub |
| JobCost.materialsCost | /api/job-costing             | JobCostForm.tsx materials input | -                   | ⚠️ Stub |
| JobCost.totalCost     | /api/job-costing calculation | /job-costing summary            | calculation.test.ts | ⚠️ Stub |
| JobCost.variance      | /api/job-costing calculation | /job-costing variance display   | -                   | ⚠️ Stub |
| JobCost.profitMargin  | /api/job-costing calculation | /job-costing chart              | -                   | ⚠️ Stub |

---

## MEDIUM PRIORITY - Enhanced Features (Phase 3C)

### Notification Model

| Field                 | Backend                      | Frontend                        | Tests                 | Status     |
| --------------------- | ---------------------------- | ------------------------------- | --------------------- | ---------- |
| Notification.id       | /api/notifications (CRUD)    | /notifications list             | notifications.spec.ts | ⚠️ Stub    |
| Notification.type     | /api/notifications           | NotificationCard.tsx icon       | -                     | ⚠️ Stub    |
| Notification.title    | /api/notifications           | NotificationCard.tsx title      | -                     | ⚠️ Stub    |
| Notification.readAt   | /api/notifications/mark-read | NotificationCard.tsx read state | -                     | ❌ Missing |
| Notification.severity | /api/notifications filter    | /notifications severity filter  | -                     | ⚠️ Stub    |

### Document Model (implied)

| Field             | Backend                   | Frontend                  | Tests           | Status     |
| ----------------- | ------------------------- | ------------------------- | --------------- | ---------- |
| Document.id       | /api/documents (CRUD)     | /documents library        | ❌ Missing page | ❌ Missing |
| Document.fileName | /api/documents            | DocumentCard.tsx name     | -               | ❌ Missing |
| Document.fileUrl  | Vercel Blob upload        | DocumentCard.tsx download | upload.test.ts  | ❌ Missing |
| Document.fileSize | /api/documents            | DocumentCard.tsx size     | -               | ❌ Missing |
| Document.mimeType | /api/documents validation | -                         | -               | ❌ Missing |

### CleaningEstimate Model

| Field                           | Backend               | Frontend                         | Tests             | Status     |
| ------------------------------- | --------------------- | -------------------------------- | ----------------- | ---------- |
| CleaningEstimate.id             | /api/estimates (GET)  | /estimates list                  | estimates.spec.ts | ⚠️ Partial |
| CleaningEstimate.spaceType      | /api/estimates        | EstimateForm.tsx select          | -                 | ⚠️ Partial |
| CleaningEstimate.status         | /api/estimates        | EstimateCard.tsx badge           | -                 | ⚠️ Partial |
| CleaningEstimate.acceptedOption | /api/estimates/accept | EstimateDetail.tsx accept button | ❌ Missing page   | ❌ Missing |
| CleaningEstimate.signedAt       | /api/estimates/sign   | EstimateDetail.tsx signature     | -                 | ❌ Missing |

### FeatureFlag Model

| Field               | Backend                 | Frontend                        | Tests            | Status     |
| ------------------- | ----------------------- | ------------------------------- | ---------------- | ---------- |
| FeatureFlag.key     | /api/features (GET/PUT) | /settings/features list         | features.spec.ts | ⚠️ Stub    |
| FeatureFlag.enabled | /api/features           | /settings/features toggle       | -                | ⚠️ Stub    |
| FeatureFlag.global  | /api/features           | /settings/features badge        | -                | ❌ Missing |
| FeatureFlag.rules   | /api/features targeting | /settings/features rules editor | rules.test.ts    | ❌ Missing |

### VerticalPack Model

| Field                     | Backend                              | Frontend                             | Tests      | Status     |
| ------------------------- | ------------------------------------ | ------------------------------------ | ---------- | ---------- |
| VerticalPack.key          | /api/vertical-packs (GET)            | /settings/vertical-pack list         | ❌ Missing | ⚠️ Stub    |
| VerticalPack.name         | /api/vertical-packs                  | VerticalPackCard.tsx name            | -          | ⚠️ Stub    |
| VerticalPack.features     | /api/vertical-packs                  | VerticalPackDetail.tsx features list | -          | ⚠️ Stub    |
| VerticalPack.customFields | /api/vertical-packs schema extension | - (backend only)                     | ❌ Missing | ❌ Missing |
| VerticalPack.isActive     | Org.activeVerticalPacks              | /settings/vertical-pack activation   | -          | ⚠️ Stub    |

---

## MEDIUM PRIORITY - Subscription & Monetization (Phase 4)

### SubscriptionTier Model

| Field                      | Backend                  | Frontend                          | Tests      | Status     |
| -------------------------- | ------------------------ | --------------------------------- | ---------- | ---------- |
| SubscriptionTier.tierKey   | /api/subscriptions/tiers | /settings/subscription tier cards | ❌ Missing | ❌ Missing |
| SubscriptionTier.basePrice | /api/subscriptions/tiers | TierCard.tsx price display        | -          | ❌ Missing |
| SubscriptionTier.features  | /api/subscriptions/tiers | TierCard.tsx features list        | -          | ❌ Missing |

### TenantSubscription Model

| Field                                 | Backend                    | Frontend                              | Tests           | Status     |
| ------------------------------------- | -------------------------- | ------------------------------------- | --------------- | ---------- |
| TenantSubscription.status             | /api/subscriptions (GET)   | /settings/subscription status badge   | ⚠️ Stub         | ⚠️ Partial |
| TenantSubscription.currentPeriodEnd   | /api/subscriptions         | /settings/subscription renewal date   | -               | ⚠️ Partial |
| TenantSubscription.subscriptionTierId | /api/subscriptions/upgrade | /settings/subscription upgrade button | upgrade.test.ts | ❌ Missing |

### TenantUsage Model

| Field                     | Backend           | Frontend                             | Tests            | Status     |
| ------------------------- | ----------------- | ------------------------------------ | ---------------- | ---------- |
| TenantUsage.activeUsers   | Cron job metering | /settings/subscription usage display | metering.test.ts | ❌ Missing |
| TenantUsage.jobsCreated   | Cron job metering | /settings/subscription usage chart   | -                | ❌ Missing |
| TenantUsage.storageUsedGb | Cron job metering | /settings/subscription storage bar   | -                | ❌ Missing |

### Invoice Model

| Field                    | Backend                  | Frontend                     | Tests            | Status      |
| ------------------------ | ------------------------ | ---------------------------- | ---------------- | ----------- |
| Invoice.id               | /api/invoices (GET/POST) | /invoices list               | invoices.spec.ts | ✅ Complete |
| Invoice.status           | /api/invoices            | InvoiceCard.tsx badge        | -                | ✅ Complete |
| Invoice.paymentLinkToken | /api/pay/[token]         | /pay/[token] page            | payment.test.ts  | ⚠️ Partial  |
| Invoice.items            | /api/invoices            | InvoiceDetail.tsx line items | -                | ✅ Complete |

### Payment Model

| Field                         | Backend              | Frontend                     | Tests           | Status     |
| ----------------------------- | -------------------- | ---------------------------- | --------------- | ---------- |
| Payment.id                    | /api/payments (POST) | /pay/[token] Stripe Elements | stripe.spec.ts  | ❌ Missing |
| Payment.stripePaymentIntentId | Stripe webhook       | - (backend only)             | webhook.test.ts | ❌ Missing |
| Payment.status                | /api/payments        | /pay/[token] status display  | -               | ❌ Missing |

---

## LOW PRIORITY - Future Features

### Import System (Phase 5+)

| Model         | Backend                  | Frontend          | Tests      | Status     |
| ------------- | ------------------------ | ----------------- | ---------- | ---------- |
| ImportJob     | /api/imports (CRUD)      | ❌ Missing wizard | ❌ Missing | ❌ Missing |
| ImportMapping | /api/imports/mappings    | ❌ Missing        | ❌ Missing | ❌ Missing |
| ImportError   | /api/imports/[id]/errors | ❌ Missing        | ❌ Missing | ❌ Missing |

### Incident Management (Phase 5+)

| Model                        | Backend                 | Frontend   | Tests      | Status     |
| ---------------------------- | ----------------------- | ---------- | ---------- | ---------- |
| Incident                     | /api/incidents (CRUD)   | ❌ Missing | ❌ Missing | ❌ Missing |
| Incident.slaResponseDeadline | /api/incidents SLA calc | ❌ Missing | ❌ Missing | ❌ Missing |

### Referral System (Phase 5+)

| Model    | Backend               | Frontend   | Tests      | Status     |
| -------- | --------------------- | ---------- | ---------- | ---------- |
| Referral | /api/referrals (CRUD) | ❌ Missing | ❌ Missing | ❌ Missing |

### RFP System (Phase 5+)

| Model | Backend          | Frontend   | Tests      | Status     |
| ----- | ---------------- | ---------- | ---------- | ---------- |
| Rfp   | /api/rfps (CRUD) | ❌ Missing | ❌ Missing | ❌ Missing |

### Cleaning Workflow (Vertical-Specific)

| Model              | Backend                   | Frontend   | Tests      | Status     |
| ------------------ | ------------------------- | ---------- | ---------- | ---------- |
| CleaningLead       | /api/cleaning/leads       | ❌ Missing | ❌ Missing | ❌ Missing |
| CleaningContract   | /api/cleaning/contracts   | ❌ Missing | ❌ Missing | ❌ Missing |
| CleaningWorkOrder  | /api/cleaning/work-orders | ❌ Missing | ❌ Missing | ❌ Missing |
| CleaningInspection | /api/cleaning/inspections | ❌ Missing | ❌ Missing | ❌ Missing |

---

## Coverage Summary

### By Priority

- **HIGH (Phase 3A-B):** 8 models, ~60 fields, 15% complete, 45% partial, 40% missing
- **MEDIUM (Phase 3C-4):** 10 models, ~40 fields, 10% complete, 50% partial, 40% missing
- **LOW (Phase 5+):** 15+ models, ~80 fields, 0% complete, 0% partial, 100% missing

### By Layer

- **Backend:** 40% implemented, 35% stubs, 25% missing
- **Frontend:** 25% implemented, 30% stubs, 45% missing
- **Tests:** 15% coverage (mostly existing features)

### Critical Paths Requiring Full Implementation

1. **Lead → Opportunity → Customer Conversion** (CRM core)
2. **AI Usage → Budget → Alert** (Cost management)
3. **Communication → Thread → Delivery** (Customer engagement)
4. **TimeEntry → Approval → Payroll** (Operations)
5. **Invoice → Payment → Receipt** (Revenue)

---

**Last Updated:** October 27, 2025  
**Next Update:** After Phase 1 completion (scaffolding formalized)
