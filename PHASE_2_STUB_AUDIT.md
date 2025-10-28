# Phase 2 Stub API Audit

**Status:** Task 6 - IN PROGRESS  
**Date:** Current Session  
**Goal:** Identify all Phase 1 stub APIs for Phase 2 migration to real implementations

---

## Tenant App APIs (10 Stub Endpoints)

### High Priority (User-Facing Features)

#### 1. `/api/ai/usage` - AI Usage Tracking ⭐️
**File:** `apps/tenant-app/src/app/api/ai/usage/route.ts`  
**Status:** PHASE 1 STUB  
**Tables Needed:** `AIUsageEvent`, `AIBudget`

**Current State:**
- GET: Returns placeholder analytics (totalTokens, totalCost, dailyUsage)
- POST: Logs usage but doesn't save to database

**Migration Tasks:**
- [ ] Query AIUsageEvent table for real usage data
- [ ] Aggregate by date range (day/week/month)
- [ ] Calculate costs based on model token usage
- [ ] Save usage events to AIUsageEvent on POST
- [ ] Update AIBudget.currentSpend when tracking usage
- [ ] Check budget thresholds and create alerts

---

#### 2. `/api/ai/budget` - AI Budget Management ⭐️
**File:** `apps/tenant-app/src/app/api/ai/budget/route.ts`  
**Status:** PHASE 1 STUB  
**Tables Needed:** `AIBudget`, `AIAlert`

**Current State:**
- GET: Returns placeholder budget data
- PUT: Logs but doesn't save changes
- POST (reset): Console log only

**Migration Tasks:**
- [ ] Query AIBudget table for org's budget
- [ ] Update budget limits, thresholds via PUT
- [ ] Reset currentSpend monthly via POST
- [ ] Include related AIAlert records in response

---

#### 3. `/api/ai/alerts` - AI Alert Management ⭐️
**File:** `apps/tenant-app/src/app/api/ai/alerts/route.ts`  
**Status:** PHASE 1 STUB  
**Tables Needed:** `AIAlert`

**Current State:**
- GET: Returns placeholder alerts
- PUT: Logs acknowledge action
- POST (acknowledge all): Console log only

**Migration Tasks:**
- [ ] Query AIAlert table filtered by acknowledged flag
- [ ] Update acknowledged status via PUT
- [ ] Bulk acknowledge all unread alerts via POST
- [ ] Sort by severity and createdAt

---

#### 4. `/api/communications` - Communications Hub ⭐️⭐️
**File:** `apps/tenant-app/src/app/api/communications/route.ts`  
**Status:** PHASE 1 STUB  
**Tables Needed:** `Communication`, `Customer`, `User`  
**External Services:** Twilio (SMS), Resend (Email)

**Current State:**
- GET: Returns placeholder emails, SMS, calls
- POST: Logs but doesn't send or save

**Migration Tasks:**
- [ ] Query Communication table by contactId and type
- [ ] Send via Twilio for SMS
- [ ] Send via Resend for email
- [ ] Save sent communication to database
- [ ] Include attachments if applicable
- [ ] Update thread unreadCount

---

#### 5. `/api/communications/threads` - Thread Management ⭐️
**File:** `apps/tenant-app/src/app/api/communications/threads/route.ts`  
**Status:** PHASE 1 STUB  
**Tables Needed:** `CommunicationThread`, `Communication`

**Current State:**
- GET: Returns placeholder threads
- POST (mark read): Console log only

**Migration Tasks:**
- [ ] Query CommunicationThread table
- [ ] Include latest message preview
- [ ] Count unread messages per thread
- [ ] Update thread unreadCount via POST

---

### Medium Priority (Business Operations)

#### 6. `/api/subcontractors` - Subcontractor Management
**File:** `apps/tenant-app/src/app/api/subcontractors/route.ts`  
**Status:** Phase 1 stub data  
**Tables Needed:** `Subcontractor` (needs schema)

**Current State:**
- GET: Filters stub array by status/skills
- POST: Console log only

**Migration Tasks:**
- [ ] Define Subcontractor Prisma model
- [ ] Query from database with filters
- [ ] Save new subcontractors via POST
- [ ] Add org scoping

---

#### 7. `/api/time-tracking` - Time Entry Tracking
**File:** `apps/tenant-app/src/app/api/time-tracking/route.ts`  
**Status:** Phase 1 stub data  
**Tables Needed:** `TimeEntry`

**Current State:**
- GET: Filters stub time entries
- POST (clock-in/clock-out): Console logs

**Migration Tasks:**
- [ ] Query TimeEntry table by technician and date range
- [ ] Clock-in: Create TimeEntry with startTime
- [ ] Clock-out: Update TimeEntry with endTime
- [ ] GPS verification for location-based tracking
- [ ] Calculate total hours and pay

---

#### 8. `/api/recurring-services` - Recurring Service Setup
**File:** `apps/tenant-app/src/app/api/recurring-services/route.ts`  
**Status:** Phase 1 stub data  
**Tables Needed:** `RecurringService`

**Current State:**
- GET: Filters stub recurring services
- POST: Console log only

**Migration Tasks:**
- [ ] Query RecurringService table
- [ ] Save new recurring services via POST
- [ ] Set up automatic job creation schedule (cron/queue)
- [ ] Send customer confirmation email via Resend

---

#### 9. `/api/job-costing` - Job Cost Analytics
**File:** `apps/tenant-app/src/app/api/job-costing/route.ts`  
**Status:** Phase 1 stub data  
**Tables Needed:** `JobCost`, `CleaningWorkOrder`

**Current State:**
- GET: Returns stub job cost summaries

**Migration Tasks:**
- [ ] Query JobCost joined with CleaningWorkOrder
- [ ] Calculate labor, materials, overhead
- [ ] Aggregate profit margins
- [ ] Support filtering by date range

---

### Low Priority (Configuration)

#### 10. `/api/vertical-packs` - Vertical Pack Management
**File:** `apps/tenant-app/src/app/api/vertical-packs/route.ts`  
**Status:** Phase 1 stub data  
**Tables Needed:** `VerticalPack`, `ProviderConfig`

**Current State:**
- GET: Returns stub vertical packs
- POST (activate): Console log only

**Migration Tasks:**
- [ ] Query VerticalPack table
- [ ] Update ProviderConfig with activated packs
- [ ] Apply vertical-specific schema customizations
- [ ] May require database migrations

---

## Provider Portal APIs (3 Stub Endpoints)

#### 1. `/api/ai/usage` - Provider AI Usage (mirrors tenant-app)
**File:** `apps/provider-portal/src/app/api/ai/usage/route.ts`  
**Status:** PHASE 1 STUB

**Migration:** Similar to tenant-app, scoped to provider org

---

#### 2. `/api/ai/budget` - Provider AI Budget (mirrors tenant-app)
**File:** `apps/provider-portal/src/app/api/ai/budget/route.ts`  
**Status:** PHASE 1 STUB

**Migration:** Similar to tenant-app, scoped to provider org

---

#### 3. `/api/ai/alerts` - Provider AI Alerts (mirrors tenant-app)
**File:** `apps/provider-portal/src/app/api/ai/alerts/route.ts`  
**Status:** PHASE 1 STUB

**Migration:** Similar to tenant-app, scoped to provider org

---

## Additional TODOs Found (Not Full Stubs)

### Provider Portal

- `/api/v1/federation/billing/invoice` - TODO: Implement actual Stripe API call
- `/api/provider/secrets-rotation/rotate` - TODO: Implement API key and encryption key rotation
- `/api/provider/leads/dispute` - TODO: Send webhook to tenant app
- `/api/provider/leads/reclassify` - TODO: Send webhook to tenant app
- `/api/provider/leads/bulk-dispute` - TODO: Send webhooks to tenant apps
- `/api/provider/leads/bulk-reclassify` - TODO: Send webhooks to tenant apps
- `/api/provider/actions` - Uses placeholder review items
- `/api/admin/pricing/plans` - TODO: Add actual super admin role check

---

## Recommended Phase 2 Implementation Priority

### Sprint 1: AI Features (Highest User Value)
1. ✅ Drag-and-drop scheduling (COMPLETED)
2. ✅ Schedule assignment/reschedule APIs (COMPLETED)
3. **AI Usage Tracking** - Enables feature visibility and monitoring
4. **AI Budget Management** - Critical for cost control
5. **AI Alerts** - Proactive budget threshold notifications

### Sprint 2: Customer Communications (High Business Value)
6. **Communications API** - Core customer engagement feature
7. **Communication Threads** - Message history and threading

### Sprint 3: Operations & Workforce
8. **Time Tracking** - Payroll and job costing dependency
9. **Subcontractor Management** - Workforce expansion feature
10. **Recurring Services** - Revenue automation

### Sprint 4: Analytics & Configuration
11. **Job Costing** - Profitability insights
12. **Vertical Packs** - Industry-specific configurations

### Sprint 5: Provider Portal Enhancements
13. **Provider AI Features** - Mirror tenant-app AI capabilities
14. **Webhook Integrations** - Lead dispute/reclassify notifications
15. **Secrets Rotation** - Security automation

---

## Implementation Strategy

### For Each Stub Migration:

1. **Schema Review**
   - Verify Prisma model exists
   - Check field names and relations
   - Add missing models if needed

2. **Database Queries**
   - Replace stub data with real Prisma queries
   - Add proper org scoping (WHERE organizationId)
   - Include necessary relations (.include)

3. **External Integrations**
   - Set up Twilio for SMS
   - Set up Resend for email
   - Configure webhooks for federation

4. **Validation & Security**
   - Validate request bodies with Zod schemas
   - Check user permissions via auth-service
   - Sanitize inputs and outputs

5. **Testing**
   - Typecheck after changes
   - Test with realistic data
   - Verify error handling

6. **Documentation**
   - Update API reference
   - Note any breaking changes
   - Document environment variables needed

---

## Deployment Considerations

- **Environment Variables:** Twilio credentials, Resend API key, webhook URLs
- **Database Migrations:** May be needed for new models (Subcontractor, JobCost, etc.)
- **Feature Flags:** Consider gating new features behind flags
- **Monitoring:** Add logging for external service calls
- **Rate Limiting:** Implement for SMS/email APIs

---

## Next Steps

✅ **COMPLETED:**
- Drag-and-drop scheduling with assignment/reschedule
- Optimistic UI updates with rollback
- Tailwind theme integration

🔄 **IN PROGRESS:**
- Task 6: Document stub inventory (this file)

⏳ **UP NEXT:**
- Task 7: Implement AI Usage tracking (highest priority stub)
- Task 8: Implement Communications API (high business value)
- Task 9: Verify Vercel deployments
- Task 10: Phase 2 completion documentation

---

**Total Stub APIs:** 13 (10 tenant-app + 3 provider-portal)  
**Total TODOs:** 8+ additional tasks  
**Estimated Effort:** 2-3 days for priority stubs, 1-2 weeks for complete migration
