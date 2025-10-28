# Implementation Checklist

Track progress on closing gaps identified in Prisma Schema Audit.

---

## 🔴 HIGH PRIORITY (Phase 3A - Critical Business Features)

### Backend Work

#### API v2 Endpoints (5 days)

- [ ] `GET /api/v2/leads` - List leads with pagination
- [ ] `POST /api/v2/leads` - Create lead
- [ ] `GET /api/v2/leads/:id` - Get lead detail
- [ ] `PUT /api/v2/leads/:id` - Update lead
- [ ] `DELETE /api/v2/leads/:id` - Delete lead
- [ ] Add lead deduplication logic (by email/phone)
- [ ] `GET /api/v2/opportunities` - List opportunities
- [ ] `POST /api/v2/opportunities` - Create opportunity
- [ ] `GET /api/v2/opportunities/:id` - Get opportunity detail
- [ ] `PUT /api/v2/opportunities/:id` - Update opportunity
- [ ] `DELETE /api/v2/opportunities/:id` - Delete opportunity
- [ ] `GET /api/v2/organizations` - Complete implementation
- [ ] `POST /api/v2/organizations` - Create organization
- [ ] `PUT /api/v2/organizations/:id` - Update organization
- [ ] Add pagination, filtering, sorting to all endpoints

#### AI Usage Tracking (2 days)

- [ ] Remove stub implementation in `/api/ai/usage`
- [ ] Log to `AIUsageEvent` table on each AI call
- [ ] Update `AIBudget.currentSpend` on each log
- [ ] Check budget thresholds after each update
- [ ] Create `AIAlert` records when thresholds hit
- [ ] Query real `AIUsageEvent` data for GET endpoint
- [ ] Add monthly rollup to `AiMonthlySummary`

#### Communication System (3 days)

- [ ] Integrate Twilio for SMS (use org's API key)
- [ ] Integrate SendGrid or AWS SES for email
- [ ] Implement type detection (SMS vs email based on customer preference)
- [ ] Add delivery status webhook handlers
- [ ] Update `Communication.status` on delivery/read
- [ ] Remove "Phase 1 stub" from communications page
- [ ] Enable actual message sending

### Frontend Work

#### 7 CRM Pages (7-10 days)

- [ ] `/leads` page
  - [ ] List view with filters (status, source, date range)
  - [ ] Detail view with lead info and activity timeline
  - [ ] Create/edit form with validation
  - [ ] Convert to customer action
  - [ ] AI score display
- [ ] `/contacts` page
  - [ ] List view with search and filters
  - [ ] Detail view with contact history
  - [ ] Create/edit form
  - [ ] Link to customer/organization
- [ ] `/opportunities` page
  - [ ] Kanban board by stage
  - [ ] List view with filters
  - [ ] Detail view with opportunity info
  - [ ] Create/edit form
  - [ ] Value tracking and stage progression
- [ ] `/organizations` page
  - [ ] List view with search
  - [ ] Detail view with org hierarchy
  - [ ] Create/edit form
  - [ ] Link to contacts and opportunities
- [ ] `/fleet` page
  - [ ] List view of vehicles/assets
  - [ ] Detail view with maintenance history
  - [ ] Create/edit form
  - [ ] Assignment tracking
- [ ] `/admin` page
  - [ ] User management (list, invite, roles)
  - [ ] Org settings
  - [ ] Billing information
  - [ ] Integration settings
- [ ] `/reports` page
  - [ ] Dashboard with key metrics
  - [ ] Sales pipeline visualization
  - [ ] Revenue charts
  - [ ] Lead conversion funnel
  - [ ] Export to CSV/PDF

---

## 🔴 HIGH PRIORITY (Phase 3B - Operational Features)

### Backend Work

#### Time Tracking (3 days)

- [ ] Implement `TimeEntry` CRUD operations with Prisma
- [ ] Add GPS coordinate capture endpoint
- [ ] Implement clock in endpoint (capture GPS)
- [ ] Implement clock out endpoint (calculate hours, pay)
- [ ] Add approval workflow (approve/reject endpoints)
- [ ] Calculate overtime based on hours
- [ ] Calculate total pay based on hourly rate

#### Recurring Services (2 days)

- [ ] Implement automatic job creation cron/queue
- [ ] Add renewal workflow logic
- [ ] Send customer confirmation emails on creation
- [ ] Add schedule preview calculation
- [ ] Update `nextServiceDate` on completion

#### Job Costing (2 days)

- [ ] Implement `JobCost` CRUD with Prisma
- [ ] Add budget threshold alert logic
- [ ] Auto-calculate variance on save (totalCost - estimatedCost)
- [ ] Auto-calculate profit margin ((revenue - totalCost) / revenue \* 100)
- [ ] Add cost breakdown by category (labor, materials, equipment, overhead)

#### Subcontractor Management (1 day)

- [ ] Wire `/api/subcontractors` to Prisma (remove stub)
- [ ] Add validation for insurance fields
- [ ] Add rating calculation logic
- [ ] Add availability status management

### Frontend Work

#### Wire Stub Pages (5 days)

- [ ] Time tracking page
  - [ ] Clock in/out buttons with real API calls
  - [ ] GPS permission prompt and capture
  - [ ] Manager approval interface
  - [ ] Timesheet display with calculations
  - [ ] Remove "Phase 1 stub" warning
- [ ] Job costing page
  - [ ] Cost entry form by category
  - [ ] Budget alert indicators
  - [ ] Variance display (positive/negative)
  - [ ] Profit margin charts
  - [ ] Remove "Phase 1 stub" warning
- [ ] Recurring services page
  - [ ] Auto job creation toggle
  - [ ] Schedule preview calendar
  - [ ] Renewal date display
  - [ ] Remove "Phase 1 stub" warning
- [ ] Subcontractors page
  - [ ] Document upload for certifications/insurance
  - [ ] Rating display and review system
  - [ ] Availability status toggle
  - [ ] Remove "Phase 1 stub" warning

---

## 🟡 MEDIUM PRIORITY (Phase 3C - Enhanced Features)

### Backend Work

#### Notifications (2 days)

- [ ] Implement WebSocket server for real-time notifications
- [ ] Add email notification delivery
- [ ] Add SMS notification delivery
- [ ] Add user notification preferences API
- [ ] Wire `/api/notifications` to Prisma (remove stub)

#### Reports & Analytics (3 days)

- [ ] Implement real-time analytics queries (Prisma aggregations)
- [ ] Add daily `AnalyticsSnapshot` cron job
- [ ] Add CSV export endpoint
- [ ] Add PDF export endpoint (using PDF library)
- [ ] Add date range filtering

#### Documents (2 days)

- [ ] Integrate Vercel Blob storage
- [ ] Add file upload endpoint (POST `/api/documents`)
- [ ] Add file download endpoint (GET `/api/documents/:id`)
- [ ] Add org-scoped access control
- [ ] Add file type validation (size limits, allowed extensions)

#### Feature Flags (1 day)

- [ ] Wire to database `FeatureFlag` queries
- [ ] Implement rules-based targeting (orgIds, verticals, tiers)
- [ ] Add tier restriction checks
- [ ] Add org override logic

#### Estimates (2 days)

- [ ] Add estimate detail endpoint (GET `/api/estimates/:id`)
- [ ] Add PDF generation (using PDF library)
- [ ] Add email sending logic (with PDF attachment)
- [ ] Add convert-to-invoice endpoint
- [ ] Add estimate versioning logic

### Frontend Work

#### Enhanced UIs (4 days)

- [ ] Notifications page
  - [ ] WebSocket real-time updates
  - [ ] Notification preferences UI
  - [ ] Mark as read/unread
  - [ ] Remove "Phase 1 stub" warning
- [ ] Reports page
  - [ ] Wire charts to real data
  - [ ] Add date range filters
  - [ ] Add export buttons (CSV/PDF)
  - [ ] Remove "Phase 1 stub" warning
- [ ] Documents page
  - [ ] Build document library UI
  - [ ] Add drag-drop upload
  - [ ] Add file preview
  - [ ] Add delete/rename actions
- [ ] Feature flags page
  - [ ] Add global vs org override indicators
  - [ ] Add targeting rules UI
  - [ ] Remove "Phase 1 stub" warning
- [ ] Estimates pages
  - [ ] Build estimate detail page
  - [ ] Build estimate creation form
  - [ ] Add action buttons (edit, send, convert)
  - [ ] Remove "Phase 1 stub" warnings

---

## 🟢 MEDIUM PRIORITY (Phase 4 - Production Hardening)

### Backend Work

#### Subscription System (3 days)

- [ ] Implement subscription upgrade endpoint
- [ ] Implement subscription downgrade endpoint
- [ ] Add Stripe subscription sync
- [ ] Add usage metering cron jobs (`TenantUsage`)
- [ ] Enforce tier limits (max users, max jobs, storage)
- [ ] Add proration calculations

#### RBAC Enforcement (2 days)

- [ ] Add permission check middleware for APIs
- [ ] Add audit logging for permission changes
- [ ] Implement role hierarchy logic
- [ ] Add role assignment validation

#### Payment Processing (2 days)

- [ ] Integrate Stripe Payment Intents
- [ ] Add webhook handler for payment.succeeded
- [ ] Update `Invoice.status` on payment
- [ ] Add payment retry logic for failures
- [ ] Add payment receipt email

### Frontend Work

#### Subscription & Payments (2 days)

- [ ] Wire upgrade/downgrade buttons to APIs
- [ ] Add tier comparison table
- [ ] Add usage indicators vs. limits
- [ ] Integrate Stripe Elements on payment page
- [ ] Add payment confirmation UI
- [ ] Remove "Phase 1 stub" from subscription page

#### RBAC UI (1 day)

- [ ] Build role creation/editing modal
- [ ] Add permission matrix view (checkboxes)
- [ ] Add role assignment interface
- [ ] Remove "Phase 1 stub" from permissions page

---

## 🟢 LOW PRIORITY (Future Phases)

### Database-Backed Stores

- [ ] Wire `PrismaWalletStore` to wallet service
- [ ] Replace in-memory feature flags with database queries
- [ ] Add environment variable for store selection

### Import/Export System

- [ ] Build CSV upload endpoint
- [ ] Add field mapping UI
- [ ] Add validation and dry-run mode
- [ ] Build import wizard pages
- [ ] Add error review and correction UI

### Incident Management

- [ ] Create `Incident` CRUD API
- [ ] Add SLA deadline calculations
- [ ] Add escalation logic
- [ ] Build incident dashboard page
- [ ] Add SLA timer indicators

### Referral System

- [ ] Create `Referral` CRUD API
- [ ] Add reward calculation logic
- [ ] Build referral dashboard page
- [ ] Add referral link generation

### Email Templates

- [ ] Implement template rendering engine
- [ ] Add variable substitution logic
- [ ] Create template CRUD API
- [ ] Build email template editor page
- [ ] Add template preview

### Recurring Invoices

- [ ] Implement recurring invoice generation cron
- [ ] Add invoice creation from template logic
- [ ] Create recurring invoice CRUD API
- [ ] Build recurring invoice management page
- [ ] Add schedule preview/editor

### Provider Integrations

- [ ] Implement health check cron jobs
- [ ] Add sync status tracking
- [ ] Add error recovery logic
- [ ] Build integration health dashboard
- [ ] Add sync history viewer

### Schedule Enhancements

- [ ] Enable drag-drop for schedule
- [ ] Add conflict detection
- [ ] Add technician assignment UI
- [ ] Wire to real job scheduling API

### OIDC/SSO

- [ ] Implement OIDC authentication flow
- [ ] Add provider configuration validation
- [ ] Add test connection endpoint
- [ ] Build SSO configuration page

### Vertical Packs

- [ ] Create 25+ `VerticalPack` seed data
- [ ] Implement custom field dynamic schema
- [ ] Add feature module activation logic
- [ ] Build vertical pack marketplace page
- [ ] Add pack preview/activation flow

### Cleaning Workflow (Vertical-Specific)

- [ ] Implement cleaning vertical APIs (7 models)
- [ ] Wire to vertical pack system
- [ ] Add AI estimate generation
- [ ] Build 7 cleaning workflow pages
- [ ] Add quality inspection UI

### RFP System

- [ ] Create `Rfp` CRUD API
- [ ] Add RFP-to-opportunity conversion
- [ ] Build RFP management page
- [ ] Add RFP submission form

### Infrastructure Monitoring

- [ ] Implement metric collection
- [ ] Add threshold alerting
- [ ] Build infrastructure dashboard
- [ ] Add metric visualization

### Upgrade Recommendations

- [ ] Build recommendation engine
- [ ] Add usage threshold monitoring
- [ ] Calculate ROI and cost projections
- [ ] Build upgrade recommendation dashboard

---

## Deployment Checklist

### Database

- [ ] Review `npx prisma migrate status`
- [ ] Create migration: `npx prisma migrate dev --name phase_3_implementation`
- [ ] Test migration on staging
- [ ] Apply to production: `npx prisma migrate deploy`

### Environment Variables

- [ ] Set `AUTH_TICKET_HMAC_SECRET`
- [ ] Set `TENANT_COOKIE_SECRET`
- [ ] Set `PROVIDER_ADMIN_PASSWORD_HASH`
- [ ] Set `DEVELOPER_ADMIN_PASSWORD_HASH`
- [ ] Set `TWILIO_ACCOUNT_SID`
- [ ] Set `TWILIO_AUTH_TOKEN`
- [ ] Set `SENDGRID_API_KEY` or `AWS_SES_*`
- [ ] Set `STRIPE_SECRET_KEY`
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Set `VERCEL_BLOB_READ_WRITE_TOKEN`

### Feature Flags

- [ ] Enable `client_portal_crm` globally
- [ ] Enable `ai_usage_tracking` globally
- [ ] Enable `communications_live` per-org (beta)
- [ ] Enable `time_tracking` globally
- [ ] Enable `recurring_services` globally
- [ ] Enable `job_costing` globally
- [ ] Enable `notifications_live` globally
- [ ] Enable `real_time_analytics` per-org
- [ ] Enable `document_management` globally

### Testing

- [ ] API v2 endpoints return real data
- [ ] AI usage tracking logs to database
- [ ] Communications send actual SMS/email
- [ ] 7 CRM pages CRUD operations work
- [ ] Time tracking clock in/out works
- [ ] Recurring services auto-create jobs
- [ ] Job costing calculates correctly
- [ ] Notifications deliver via WebSocket
- [ ] Documents upload to Vercel Blob
- [ ] Subscription upgrade/downgrade works
- [ ] Stripe payment flow completes

---

**Track completion by checking boxes as features are implemented and tested.**
