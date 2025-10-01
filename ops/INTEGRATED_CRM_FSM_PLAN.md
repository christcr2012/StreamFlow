# Integrated CRM + FSM Implementation Plan

**Date**: 2025-01-01  
**Status**: IN PROGRESS  
**Approach**: CRM as supplement to FSM, fully integrated with bridge systems

---

## 🎯 CRITICAL UNDERSTANDING

**DO NOT SILO CRM AND FSM**

CRM and FSM are **one integrated system**:
- Jobs link to CRM Orgs/Contacts via foreign keys
- Quotes/Estimates link to CRM Opportunities
- Leads convert to FSM Customers (Org + Contact)
- All mutations audited
- All AI routes cost-guarded
- Unified testing and CI/CD

---

## 📋 IMPLEMENTATION PHASES

### PHASE 1: Complete CRM Core Modules (60-80 hours)

#### 1.1 Opportunities (Complete) - 10-15 hours
- [ ] Opportunity Detail Page
- [ ] OpportunityCreateModal
- [ ] Edit/Archive functionality
- [ ] Link to Quotes/Estimates (FSM)
- [ ] AI scoring

#### 1.2 Contacts (Full) - 20-25 hours
- [ ] Contacts Index Page
- [ ] Contact Detail Page
- [ ] ContactCreateModal
- [ ] Link to Organizations
- [ ] Link to Jobs (FSM)
- [ ] AI enrichment

#### 1.3 Organizations (Full) - 20-25 hours
- [ ] Organizations Index Page
- [ ] Organization Detail Page
- [ ] OrganizationCreateModal
- [ ] List contacts at org
- [ ] List jobs at org (FSM)
- [ ] List opportunities at org
- [ ] AI company research

#### 1.4 API Endpoints - 30-40 hours
- [ ] `/api/tenant/crm/leads/*` (CRUD + import + notes)
- [ ] `/api/tenant/crm/opportunities/*` (CRUD + notes)
- [ ] `/api/tenant/crm/contacts/*` (CRUD + notes)
- [ ] `/api/tenant/crm/organizations/*` (CRUD + notes)
- [ ] All with: idempotency, error envelopes, RBAC, audit, cost guard

---

### PHASE 2: Bridge Systems (HIGHEST PRIORITY) - 40-50 hours

#### 2.1 Database Schema Updates - 5-10 hours
```prisma
model JobTicket {
  // ... existing fields
  
  // CRM Links
  organizationId String?
  organization   Organization? @relation(fields: [orgId, organizationId], references: [orgId, id])
  
  contactId      String?
  contact        Contact? @relation(fields: [orgId, contactId], references: [orgId, id])
  
  opportunityId  String?
  opportunity    Opportunity? @relation(fields: [orgId, opportunityId], references: [orgId, id])
}

model Lead {
  // ... existing fields
  
  // Conversion tracking
  convertedToCustomerId String?
  convertedAt           DateTime?
  conversionAuditId     String?
}

// Add indexes for performance
@@index([orgId, organizationId])
@@index([orgId, contactId])
@@index([orgId, opportunityId])
```

#### 2.2 Lead → Customer Conversion - 10-15 hours
- [ ] `POST /api/tenant/crm/leads/:id/convert`
  - Creates Organization (if not exists)
  - Creates Contact
  - Creates Customer record (FSM)
  - Links all together
  - Full audit trail
  - Idempotent (can call multiple times)

#### 2.3 Job → CRM Links - 10-15 hours
- [ ] Update Job creation to accept `organizationId`, `contactId`
- [ ] Update Job detail page to show CRM links
- [ ] Add "Create Job" button on Organization detail
- [ ] Add "Create Job" button on Contact detail
- [ ] Pre-fill job with org/contact data

#### 2.4 Quote/Estimate → Opportunity Links - 10-15 hours
- [ ] Link Quotes to Opportunities
- [ ] Update Quote creation to accept `opportunityId`
- [ ] Add "Create Quote" button on Opportunity detail
- [ ] When Quote accepted → update Opportunity stage
- [ ] When Quote rejected → update Opportunity stage

#### 2.5 Unified Dashboard - 5-10 hours
- [ ] Show both CRM and FSM metrics
- [ ] Lead → Customer conversion rate
- [ ] Opportunity → Job conversion rate
- [ ] Revenue by source (CRM vs FSM)

---

### PHASE 3: Apply Binder1 Guardrails to FSM - 30-40 hours

#### 3.1 Audit Logs on FSM Mutations - 10-15 hours
- [ ] Job creation/update/delete
- [ ] Work order creation/update/delete
- [ ] Crew assignment changes
- [ ] Job completion
- [ ] Customer portal actions
- [ ] Provider portal actions

#### 3.2 Cost Guard on FSM AI Routes - 10-15 hours
- [ ] `/api/ai/estimate` - AI estimate generation
- [ ] `/api/ai/draft` - AI draft generation
- [ ] `/api/ai/route-optimizer` - Route optimization
- [ ] `/api/ai/inbox` - Inbox agent
- [ ] `/api/ai/collections` - Collections agent
- [ ] `/api/ai/marketing` - Marketing agent
- [ ] `/api/ai/scheduling` - Scheduling agent
- [ ] `/api/ai/dispatch` - Dispatch agent

#### 3.3 Add Missing Tests for FSM - 10-15 hours
- [ ] Job ticket CRUD tests
- [ ] Work order tests
- [ ] Crew assignment tests
- [ ] Customer portal tests
- [ ] Provider portal tests
- [ ] AI agent tests

---

### PHASE 4: Security & RBAC - 20-30 hours

#### 4.1 Apply `withAudience` to All Routes - 10-15 hours
- [ ] All CRM routes: `/api/tenant/crm/*`
- [ ] All FSM routes: `/api/tenant/jobs/*`, `/api/tenant/orders/*`
- [ ] All AI routes: `/api/ai/*`
- [ ] All provider routes: `/api/provider/*`
- [ ] All customer routes: `/api/customer/*`

#### 4.2 Apply `withCostGuard` to Costed Actions - 10-15 hours
- [ ] All AI routes (CRM + FSM)
- [ ] Email sending
- [ ] SMS sending
- [ ] File storage operations
- [ ] External API calls

---

### PHASE 5: Testing & CI/CD - 40-50 hours

#### 5.1 Integration Tests for Bridge Systems - 20-25 hours
- [ ] Lead → Customer conversion flow
- [ ] Job → Contact/Org linking
- [ ] Quote → Opportunity linking
- [ ] Opportunity stage updates from Quote status
- [ ] Cross-system data integrity

#### 5.2 Extend Test Suite - 20-25 hours
- [ ] CRM CRUD tests (Leads, Opps, Contacts, Orgs)
- [ ] FSM CRUD tests (Jobs, Orders, Crew)
- [ ] Bridge system tests
- [ ] AI route tests (with cost guard)
- [ ] RBAC tests (all routes)
- [ ] Audit log tests

#### 5.3 CI/CD Gates - 5-10 hours
- [ ] TypeCheck (both CRM + FSM)
- [ ] ESLint strict
- [ ] Unit tests ≥80% coverage
- [ ] Integration tests pass
- [ ] E2E smoke tests
- [ ] Security scan (gitleaks)
- [ ] Dependency scan (Snyk)

---

## 🗂️ FILE ORGANIZATION

### CRM Code Location:
```
/src/app/(tenant)/crm/
  /leads/
  /opportunities/
  /contacts/
  /organizations/

/src/pages/api/tenant/crm/
  /leads/
  /opportunities/
  /contacts/
  /organizations/

/src/server/services/crm/
  leadService.ts
  opportunityService.ts
  contactService.ts
  organizationService.ts
  conversionService.ts  # Bridge logic
```

### FSM Code Location (Keep Intact):
```
/src/app/(tenant)/jobs/
/src/app/(tenant)/orders/
/src/pages/api/tenant/jobs/
/src/pages/api/tenant/orders/
/src/server/services/
  jobTicketService.ts
  workOrderService.ts
  customerPortalService.ts
```

### Bridge Code Location:
```
/src/server/services/bridge/
  conversionService.ts  # Lead → Customer
  linkingService.ts     # Job ↔ CRM links
  quoteOpportunityService.ts  # Quote ↔ Opportunity
```

---

## 🔗 BRIDGE SYSTEM DETAILS

### 1. Lead → Customer Conversion

**API**: `POST /api/tenant/crm/leads/:id/convert`

**Request**:
```json
{
  "createOrganization": true,  // or provide organizationId
  "organizationName": "Acme Corp",
  "createContact": true,
  "contactName": "John Doe",
  "contactEmail": "john@acme.com",
  "contactPhone": "+1-555-1234"
}
```

**Response**:
```json
{
  "customerId": "cus_123",
  "organizationId": "org_456",
  "contactId": "con_789",
  "auditId": "aud_abc"
}
```

**Logic**:
1. Check if lead already converted (idempotent)
2. Create/link Organization
3. Create Contact
4. Create Customer record (FSM)
5. Update Lead with conversion data
6. Create audit log entry
7. Return all IDs

---

### 2. Job → CRM Links

**Job Creation with CRM Links**:
```json
POST /api/tenant/jobs
{
  "serviceType": "HVAC Repair",
  "organizationId": "org_456",  // CRM link
  "contactId": "con_789",       // CRM link
  "opportunityId": "opp_012",   // CRM link (optional)
  // ... other job fields
}
```

**Job Detail Shows**:
- Organization name (clickable → org detail)
- Contact name (clickable → contact detail)
- Opportunity title (clickable → opp detail)

---

### 3. Quote → Opportunity Links

**Quote Creation with Opportunity Link**:
```json
POST /api/tenant/quotes
{
  "opportunityId": "opp_012",  // CRM link
  "items": [...],
  "total": 5000
}
```

**When Quote Status Changes**:
- Quote accepted → Opportunity stage = "closed_won"
- Quote rejected → Opportunity stage = "closed_lost"
- Quote sent → Opportunity stage = "proposal"

---

## ✅ STOP CONDITION

**CRM is NOT complete until**:
1. ✅ All CRM modules functional (Leads, Opps, Contacts, Orgs)
2. ✅ All API endpoints with error handling + idempotency
3. ✅ Bridge Systems functional:
   - Lead → Customer conversion
   - Job → CRM links
   - Quote → Opportunity links
4. ✅ FSM guardrails applied:
   - Audit logs on all FSM mutations
   - Cost guard on all FSM AI routes
   - Tests for FSM routes
5. ✅ Security applied:
   - `withAudience` on all routes
   - `withCostGuard` on all costed actions
6. ✅ Testing complete:
   - Integration tests for bridge systems
   - Extended test suite for CRM + FSM
   - CI/CD gates passing

---

## 📊 PROGRESS TRACKING

### Current Status:
- [x] Leads module (100%)
- [ ] Opportunities module (50%)
- [ ] Contacts module (0%)
- [ ] Organizations module (0%)
- [ ] Bridge Systems (0%)
- [ ] FSM Guardrails (0%)
- [ ] Security (20%)
- [ ] Testing (20%)

### Estimated Total Time: 190-250 hours

---

## 🚀 EXECUTION ORDER

1. **Complete CRM Core** (60-80 hours)
   - Finish Opportunities
   - Build Contacts
   - Build Organizations
   - Create all API endpoints

2. **Build Bridge Systems** (40-50 hours) ← HIGHEST PRIORITY
   - Update database schema
   - Lead → Customer conversion
   - Job → CRM links
   - Quote → Opportunity links
   - Unified dashboard

3. **Apply FSM Guardrails** (30-40 hours)
   - Audit logs
   - Cost guards
   - Tests

4. **Security & Testing** (60-80 hours)
   - Apply `withAudience` and `withCostGuard`
   - Integration tests
   - CI/CD gates

---

**READY TO EXECUTE**: Starting with completing Opportunities module, then Contacts, then Organizations, then Bridge Systems.

