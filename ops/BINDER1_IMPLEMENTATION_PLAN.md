# Binder1.md Implementation Plan

**Date**: 2025-01-01  
**Status**: IN PROGRESS  
**Approach**: Build on existing codebase, add missing pieces

---

## 🎯 EXECUTIVE SUMMARY

**Good News**: We already have 70%+ of what binder1.md requires!

**Current State**:
- ✅ Auth system (login, register, password reset)
- ✅ Multi-tenant (Org model with orgId isolation)
- ✅ RBAC (User roles: OWNER, MANAGER, STAFF, EMPLOYEE)
- ✅ Database models (Lead, Opportunity, Contact, Organization, Task, Activity, AuditLog)
- ✅ Service layer pattern (24 services)
- ✅ API routes (43 endpoints)
- ✅ Audit logging
- ✅ Rate limiting
- ✅ Idempotency

**What We Need to Add** (from binder1.md):
1. CRM-specific UI pages (Leads index/detail, Orgs, Contacts, Opps)
2. Comprehensive testing (unit, integration, E2E)
3. Security hardening (CI/CD gates, DAST, pentest)
4. AI layer (assistant, enrichment, summarization)
5. Observability (structured logs, metrics, dashboards)
6. Production readiness (load tests, chaos tests, runbooks)

---

## 📋 PHASE 1: FOUNDATIONS (Binder1.md §2, §4, §6)

### Status: 80% COMPLETE ✅

#### What We Have:
- ✅ Auth pages (login, register, password reset)
- ✅ Database schema with all required models
- ✅ Service layer with typed inputs/outputs
- ✅ API routes with error envelopes
- ✅ Multi-tenant isolation (orgId)
- ✅ RBAC enforcement
- ✅ Audit logging

#### What We Need:
- [ ] Update auth pages to match binder1.md UX specs (§2.1)
- [ ] Add comprehensive testing (§7)
- [ ] Add CI/CD gates (§6.2)
- [ ] Add observability (§1.1)

**Estimated Time**: 20-30 hours

---

## 📋 PHASE 2: CORE CRM (Binder1.md §2.3, §2.4, §3.3)

### Status: 60% COMPLETE 🔄

#### What We Have:
- ✅ Lead model with all fields
- ✅ Organization model
- ✅ Contact model
- ✅ Opportunity model
- ✅ Task model
- ✅ Activity model
- ✅ Services for all entities
- ✅ API endpoints for CRUD

#### What We Need:
- [ ] Leads Index page (§2.3.1)
  - Button "New Lead" → LeadCreateModal
  - Button "Import CSV" → LeadImportDrawer
  - Search + filters (Owner, Stage, Source)
  - Pagination, sorting, empty state

- [ ] Lead Detail page (§2.3.2)
  - Button "Edit" → editable form
  - Button "Assign" (manager/admin)
  - Button "Archive"
  - Notes textarea + "Add note"
  - AI Panel (Summarize, Next best action)

- [ ] Organizations Index + Detail (§2.4)
- [ ] Contacts Index + Detail (§2.4)
- [ ] Opportunities Index + Detail (§2.4)
- [ ] Tasks Index + Detail (§2.4)

**Estimated Time**: 40-50 hours

---

## 📋 PHASE 3: AI DIFFERENTIATORS (Binder1.md §5)

### Status: 40% COMPLETE 🔄

#### What We Have:
- ✅ AI task execution service
- ✅ 8 AI agents (Inbox, Estimate, Collections, etc.)
- ✅ AI power controls
- ✅ Credit system
- ✅ Usage metering

#### What We Need (per binder1.md):
- [ ] AI Assistant (contextual Q&A tray per page)
- [ ] AI Enrichment (lead/company info from external providers)
- [ ] AI Summarization (timeline/notes → executive summaries)
- [ ] AI Anomaly Detection (highlight abnormal activity)
- [ ] AI Broker (§5.2)
  - Primary: OpenAI
  - Alt: OSS Llama-class
  - Env: `LLM_PROVIDER=openai|oss`
- [ ] AI Guardrails (§5.3)
  - Redaction (mask PII)
  - Prompt-injection filter
  - Safety refusals
- [ ] AI Metrics (§5.4)
  - Track SR/CTR/CR/FR
  - Token usage & cost per tenant
  - A/B testing

**Estimated Time**: 30-40 hours

---

## 📋 PHASE 4: ENTERPRISE POLISH (Binder1.md §6, §7)

### Status: 20% COMPLETE 📝

#### What We Have:
- ✅ RBAC middleware
- ✅ Rate limits
- ✅ Audit logging
- ✅ Secret management (env vars)

#### What We Need:
- [ ] Security Hardening (§6.1)
  - 2FA for admins
  - CSP + HSTS
  - CSRF protection
  - SSRF protections
  - Sanitization of notes

- [ ] CI/CD Gates (§6.2)
  - Typecheck ✅ (already have)
  - ESLint strict
  - Unit/Integration ≥80% coverage
  - SCA (Dependabot/Snyk)
  - Secret scanner (gitleaks)
  - DAST (ZAP) on preview
  - Migration rehearsal

- [ ] Testing Strategy (§7)
  - Test harness (setupTenant, factory, auth)
  - Unit tests (≥80% coverage)
  - Integration tests (all endpoints)
  - E2E tests (Playwright)
  - Load tests (p95 < 300ms)

- [ ] Compliance (§6.3)
  - SOC 2 controls
  - GDPR/CCPA (export & erasure)
  - Access reviews
  - Incident runbooks

**Estimated Time**: 50-60 hours

---

## 📊 OVERALL PROGRESS

| Phase | Binder1.md Requirement | Current Status | Estimated Hours |
|-------|------------------------|----------------|-----------------|
| Phase 1 | Foundations | 80% Complete | 20-30 hours |
| Phase 2 | Core CRM | 60% Complete | 40-50 hours |
| Phase 3 | AI Differentiators | 40% Complete | 30-40 hours |
| Phase 4 | Enterprise Polish | 20% Complete | 50-60 hours |
| **TOTAL** | **All Phases** | **50% Complete** | **140-180 hours** |

---

## 🚀 IMPLEMENTATION STRATEGY

### Approach: Incremental Enhancement

**DO NOT rebuild from scratch.** Instead:
1. ✅ Keep existing codebase (95% complete field service platform)
2. ✅ Add CRM-specific UI pages (Leads, Orgs, Contacts, Opps)
3. ✅ Enhance AI layer per binder1.md specs
4. ✅ Add comprehensive testing
5. ✅ Add security hardening
6. ✅ Add observability

### Priority Order:
1. **Phase 2 (CRM UI)** - Most visible, highest user value
2. **Phase 3 (AI)** - Competitive differentiator
3. **Phase 4 (Testing/Security)** - Production readiness
4. **Phase 1 (Polish)** - Final touches

---

## 📋 IMMEDIATE NEXT STEPS

### Step 1: Create CRM UI Pages (Phase 2)

**Files to Create**:
1. `src/app/(app)/leads/page.tsx` - Leads Index
2. `src/app/(app)/leads/[id]/page.tsx` - Lead Detail
3. `src/components/leads/LeadCreateModal.tsx`
4. `src/components/leads/LeadImportDrawer.tsx`
5. `src/app/(app)/organizations/page.tsx` - Orgs Index
6. `src/app/(app)/organizations/[id]/page.tsx` - Org Detail
7. `src/app/(app)/contacts/page.tsx` - Contacts Index
8. `src/app/(app)/contacts/[id]/page.tsx` - Contact Detail
9. `src/app/(app)/opportunities/page.tsx` - Opps Index
10. `src/app/(app)/opportunities/[id]/page.tsx` - Opp Detail

**Estimated Time**: 30-40 hours

### Step 2: Enhance AI Layer (Phase 3)

**Files to Create/Update**:
1. `src/server/ai/broker.ts` - AI provider broker
2. `src/server/ai/assistant.ts` - Contextual Q&A
3. `src/server/ai/enrichment.ts` - Lead enrichment
4. `src/server/ai/summarization.ts` - Timeline summaries
5. `src/server/ai/guardrails.ts` - Redaction & safety

**Estimated Time**: 20-30 hours

### Step 3: Add Testing (Phase 4)

**Files to Create**:
1. `tests/utils/setupTenant.ts`
2. `tests/utils/factory.ts`
3. `tests/utils/auth.ts`
4. `tests/unit/**/*.spec.ts`
5. `tests/integration/**/*.spec.ts`
6. `e2e/**/*.spec.ts`

**Estimated Time**: 40-50 hours

---

## ✅ SUCCESS CRITERIA

### Phase 1 Complete When:
- [ ] All auth pages match binder1.md UX specs
- [ ] CI/CD gates implemented
- [ ] Observability emits requestId/tenantId
- [ ] Dashboards exist

### Phase 2 Complete When:
- [ ] All CRM pages exist (Leads, Orgs, Contacts, Opps)
- [ ] All CRUD operations work
- [ ] Search, filters, pagination work
- [ ] Import CSV works
- [ ] Audit populated

### Phase 3 Complete When:
- [ ] AI assistant works on all pages
- [ ] AI enrichment works for leads
- [ ] AI summarization works
- [ ] AI guardrails prevent injection
- [ ] Metrics track usage & cost

### Phase 4 Complete When:
- [ ] Security review passes
- [ ] Test coverage ≥80%
- [ ] Load tests pass (p95 < 300ms)
- [ ] All CI/CD gates pass
- [ ] Incident runbooks exist

---

## 🎯 FINAL DELIVERABLE

When all phases complete:
- ✅ Production-ready CRM system
- ✅ AI-powered features
- ✅ Comprehensive testing
- ✅ Security hardened
- ✅ Fully observable
- ✅ Enterprise-grade

**Estimated Total Time**: 140-180 hours

---

**STATUS**: Ready to begin Phase 2 (CRM UI pages)

