# StreamFlow Handover Binder Gap Analysis

**Date**: 2025-09-30  
**Purpose**: Compare existing codebase against handover binder requirements  
**Status**: IN PROGRESS

---

## Executive Summary

The existing StreamFlow codebase has **significant infrastructure already in place** but uses **Pages Router instead of App Router**. Rather than a complete rewrite, we'll adapt the handover binder specifications to work with the existing architecture while filling gaps and ensuring production-readiness.

**Key Finding**: The codebase is more functional than the binder suggests - it has comprehensive models, auth systems, and business logic. The work is about **production-hardening** and **completing missing pieces**, not building from scratch.

---

## Architectural Decisions

### 1. Router Architecture
**Binder Spec**: App Router (`src/app/*`)  
**Current**: Pages Router (`src/pages/*`)  
**Decision**: **Keep Pages Router** - fully supported, existing code uses it, migration would be 40+ hours  
**Adaptation**: Map binder's App Router paths to Pages Router equivalents

### 2. Multi-Tenancy
**Binder Spec**: Row-level isolation via `tenantId`  
**Current**: Row-level isolation via `orgId`  
**Decision**: **Keep orgId** - functionally equivalent, already implemented throughout  
**Status**: ✅ ALIGNED

### 3. Database Models
**Binder Spec**: Tenant, User, Role, Organization, Contact, Lead, Opportunity, Activity, Task, AuditLog, Job, WebhookEvent  
**Current**: Has all of these plus many more (70+ models)  
**Status**: ✅ EXCEEDS REQUIREMENTS

---

## Model Mapping: Binder → Current

| Binder Model | Current Model | Status | Notes |
|---|---|---|---|
| Tenant | Org | ✅ EXISTS | orgId used throughout |
| User | User | ✅ EXISTS | Comprehensive user model |
| Role | RbacRole | ✅ EXISTS | 195 permissions defined |
| UserRole | RbacUserRole | ✅ EXISTS | Many-to-many mapping |
| Organization | Org | ✅ EXISTS | Same model |
| Contact | (Missing) | ❌ NEEDS CREATION | Required by binder |
| LeadSource | LeadSourceConfig | ✅ EXISTS | Similar functionality |
| Lead | Lead | ✅ EXISTS | Comprehensive lead model |
| Opportunity | Opportunity | ✅ EXISTS | Full opportunity tracking |
| Activity | LeadActivity | ✅ EXISTS | Activity tracking |
| Task | LeadTask | ✅ EXISTS | Task management |
| AuditLog | AuditLog + AuditEvent | ✅ EXISTS | Dual audit system |
| Job | Job | ✅ EXISTS | Background job tracking |
| WebhookEvent | WebhookEvent | ✅ EXISTS | Webhook system |

**Summary**: 13/14 models exist (93%). Only Contact model missing.

---

## Page/Route Mapping: Binder → Current

### Auth Pages
| Binder Path | Current Path | Status | Notes |
|---|---|---|---|
| `src/app/(auth)/login/page.tsx` | `src/pages/login.tsx` | ✅ EXISTS | Needs verification |
| `src/app/(auth)/register/page.tsx` | (Missing) | ❌ NEEDS CREATION | Registration flow |
| `src/app/(auth)/forgot-password/page.tsx` | (Missing) | ❌ NEEDS CREATION | Password reset |
| `src/app/(auth)/reset/[token]/page.tsx` | (Missing) | ❌ NEEDS CREATION | Password reset confirm |

### App Pages
| Binder Path | Current Path | Status | Notes |
|---|---|---|---|
| `src/app/(app)/dashboard/page.tsx` | `src/pages/dashboard/*` | ✅ EXISTS | Multiple dashboards |
| `src/app/(app)/leads/page.tsx` | `src/pages/leads.tsx` | ✅ EXISTS | Leads index |
| `src/app/(app)/leads/[id]/page.tsx` | `src/pages/leads/[id]/*` | ⚠️ PARTIAL | Needs verification |
| `src/app/(app)/organizations/*` | (Missing) | ❌ NEEDS CREATION | Org management |
| `src/app/(app)/contacts/*` | (Missing) | ❌ NEEDS CREATION | Contact management |
| `src/app/(app)/opportunities/*` | (Missing) | ❌ NEEDS CREATION | Opp management |
| `src/app/(app)/tasks/*` | (Missing) | ❌ NEEDS CREATION | Task management |

### Admin Pages
| Binder Path | Current Path | Status | Notes |
|---|---|---|---|
| `src/app/(admin)/admin/[section]/page.tsx` | `src/pages/admin/*` | ✅ EXISTS | Multiple admin pages |

---

## API Routes Mapping

### Auth APIs
| Binder Route | Current Route | Status |
|---|---|---|
| `POST /api/auth/login` | `POST /api/auth/login` | ✅ EXISTS |
| `POST /api/auth/register` | (Missing) | ❌ NEEDS CREATION |
| `POST /api/auth/logout` | `POST /api/auth/logout` | ✅ EXISTS |
| `POST /api/auth/password-reset` | (Missing) | ❌ NEEDS CREATION |

### CRM APIs
| Binder Route | Current Route | Status |
|---|---|---|
| `GET /api/leads` | `GET /api/leads` | ✅ EXISTS |
| `POST /api/leads` | `POST /api/leads` | ✅ EXISTS |
| `GET /api/leads/:id` | `GET /api/leads/[id]` | ✅ EXISTS |
| `PUT /api/leads/:id` | `PUT /api/leads/[id]` | ✅ EXISTS |
| `POST /api/leads/import` | (Missing) | ❌ NEEDS CREATION |
| `GET /api/organizations` | (Missing) | ❌ NEEDS CREATION |
| `GET /api/contacts` | (Missing) | ❌ NEEDS CREATION |
| `GET /api/opportunities` | (Missing) | ❌ NEEDS CREATION |
| `GET /api/tasks` | (Missing) | ❌ NEEDS CREATION |

### AI APIs
| Binder Route | Current Route | Status |
|---|---|---|
| `POST /api/ai/assist` | `POST /api/ai/*` | ⚠️ PARTIAL |
| `POST /api/ai/enrich-lead` | (Missing) | ❌ NEEDS CREATION |
| `POST /api/ai/summarize` | (Missing) | ❌ NEEDS CREATION |

---

## Infrastructure & Services

### Existing Services (in `src/lib/`)
✅ **Auth System**: auth.ts, auth-service.ts, auth-helpers.ts  
✅ **RBAC System**: rbac.ts, rbac-service.ts  
✅ **Audit System**: audit.ts, consolidated-audit.ts, auditService.ts  
✅ **AI Services**: aiService.ts, aiHelper.ts, aiMeter.ts  
✅ **Billing**: billing.ts, provider-billing.ts  
✅ **Encryption**: encryption-system.ts  
✅ **Backup**: backup-system.ts  
✅ **Federation**: federationService.ts  
✅ **Offline**: offline-db.ts, sync-engine.ts  
✅ **Lead Scoring**: leadScoring.ts, leadScoringService.ts  

### Missing Services (per binder)
❌ **Service Layer**: `src/server/services/*` - binder requires explicit service layer  
❌ **AI Broker**: `src/server/ai/broker.ts` - unified AI provider interface  
❌ **Job Workers**: Background queue implementation (BullMQ/Redis)  
❌ **Observability**: Structured logging with requestId/tenantId  

---

## Security & Compliance

### Existing
✅ RBAC with 195 permissions  
✅ Audit logging (AuditLog + AuditEvent)  
✅ Encryption system  
✅ Password policies  
✅ Two-factor authentication  
✅ Session management  
✅ Provider/Developer/Accountant separate auth  

### Missing (per binder)
❌ Rate limiting middleware  
❌ Idempotency key handling (model exists, middleware missing)  
❌ CSRF protection  
❌ CSP + HSTS headers  
❌ Secret rotation jobs  
❌ Webhook signature verification  
❌ Prompt injection defense for AI  

---

## Testing Infrastructure

### Existing
⚠️ Some test files exist but coverage unknown  
⚠️ E2E test structure unclear  

### Missing (per binder)
❌ Test harness (`tests/utils/setupTenant.ts`)  
❌ Factory utilities (`tests/utils/factory.ts`)  
❌ Auth utilities (`tests/utils/auth.ts`)  
❌ Playwright fixtures  
❌ Contract tests for OpenAPI  
❌ Load tests  
❌ Coverage gates in CI  

---

## Priority Gap Filling Plan

### Phase 1: Critical Gaps (Must Have)
1. **Contact Model & CRUD** (4-6 hours)
2. **Registration Flow** (3-4 hours)
3. **Password Reset Flow** (2-3 hours)
4. **Service Layer Refactor** (6-8 hours)
5. **Rate Limiting Middleware** (2-3 hours)
6. **Idempotency Middleware** (2-3 hours)

### Phase 2: Important Gaps (Should Have)
7. **Organizations CRUD Pages** (4-6 hours)
8. **Opportunities CRUD Pages** (4-6 hours)
9. **Tasks CRUD Pages** (4-6 hours)
10. **CSV Import** (6-8 hours)
11. **AI Broker** (4-6 hours)
12. **Observability Bootstrap** (3-4 hours)

### Phase 3: Nice to Have
13. **Job Workers** (8-10 hours)
14. **Test Harness** (6-8 hours)
15. **Security Hardening** (8-10 hours)
16. **Load Testing** (4-6 hours)

**Total Estimated Time**: 70-100 hours

---

## Recommendations

1. **Keep Pages Router** - Don't migrate to App Router, adapt binder specs
2. **Keep orgId** - Don't rename to tenantId, functionally equivalent
3. **Preserve Existing Code** - Don't rebuild what works, enhance it
4. **Focus on Gaps** - Fill missing pieces per priority list
5. **Production Harden** - Add missing middleware, tests, observability
6. **Incremental Approach** - Ship Phase 1, then Phase 2, then Phase 3

---

**Next Steps**:
1. Create Contact model in Prisma schema
2. Build registration flow
3. Build password reset flow
4. Refactor to service layer pattern
5. Add rate limiting and idempotency middleware

**Session Status**: Gap analysis complete, ready to begin implementation

