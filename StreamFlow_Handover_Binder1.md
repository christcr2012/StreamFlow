# StreamFlow — Final Handover Binder (Master Build Plan)

**Repo:** https://github.com/christcr2012/StreamFlow  
**Deployed preview (as referenced in repo):** stream-flow-xi.vercel.app (see repo badge/README)  
**This document is the single source of truth for bringing the *existing, mostly nonfunctional* codebase to a secure, production-ready, multi-tenant SaaS with AI.**

---

## 0) Orientation & Reality Check

### What you’re inheriting (from the current repo)
- Next.js (TypeScript) app with App Router conventions, Tailwind, Prisma skeleton, various planning docs and audit/testing stubs.
- Several planning files (`STREAMFLOW-BUILD-PLAN.md`, `RECOVERY-ROADMAP.md`, `StreamFlow_Master_Plan_*`, `COMPREHENSIVE-SYSTEM-ANALYSIS.md`, `recoveredReplitChat.txt`) that capture intent and requirements but **the runtime internals are largely nonfunctional** or incomplete.
- Evidence of attempts at resilience/security test scripts (`authentication-resilience-test.js`, `production-readiness-validator.js`, etc.) that **do not yet gate CI** or connect to a complete backend.

### North Star
Deliver a **Professional Service Business Management Platform** with:
- Multi-tenant isolation (row-level), RBAC, audit logs, secret management.
- CRM-like core: Organizations, Contacts, Leads, Opportunities, Activities/Tasks.
- AI: assistant, enrichment, summarization, anomaly detection — **server-side only**, redaction, prompt-injection defenses.
- Observability, rate limits, and a hardened deployment posture.
- USA-first (EN-US) with a11y and responsive UX.

### Working constraints
- **Keep current stack** (Next.js/TS, Prisma, Postgres, Tailwind, Vercel) but finish it to production level.
- **Costs down:** prefer open-source LLM path (self-hostable) with OpenAI as fallback.
- **No scope creep:** this binder enumerates exactly what to build and how to verify “done.”

### Roles & Ownership
- **Architect:** owns system map, cut-lines, rollout plan, acceptance gates.
- **Backend:** owns route handlers, service layer, Prisma schemas/migrations, RBAC middleware, idempotency, rate limits.
- **Frontend:** owns button-by-button UX (labels, props/state), forms, error/loading states, accessibility & mobile responsiveness.
- **AI/ML:** owns assistant, enrichment pipelines, eval metrics, guardrails, cost controls.
- **Security:** owns secret rotation, audit, CI/CD gates, pentest coordination, compliance posture.
- **SRE/Infra:** owns Vercel + worker tier (jobs), Postgres backups/PITR, observability stack.
- **QA:** owns test harness, mappings, and coverage gates.

**Definition of Done (global):** All checklists in this binder pass; core flows run end-to-end on staging; security/observability enabled; migrations are reversible; tests & lint/type checks gate CI; playbooks exist for rollback and incident response.

---

## 1) System Map → target operating model

### 1.1 Components (target)
- **Web App (Next.js/TS)**: App Router pages in `src/app` with server actions. Tailwind for UI. Shared UI library in `src/components/ui`.
- **API (route handlers)**: `src/app/api/**` with typed request/response, zod validators, consistent error envelope.
- **Service Layer**: `src/server/services/**` encapsulating business logic; never call Prisma from UI or handlers directly.
- **ORM/DB (Prisma + Postgres)**: Multi-tenant schema; partitioned audit/events; seed & fixtures; PITR backups.
- **Job Workers**: Background queue (BullMQ/Redis or Temporal). Needed for CSV imports, AI enrichment, webhooks.
- **Observability**: Structured logs (requestId, tenantId), metrics (Prometheus/OpenTelemetry), error reporting (Sentry-compatible).
- **AI Layer**: Server-only LLM broker with providers (OpenAI + OSS Llama-class), redaction & safety interposer, per-tenant usage metering.

### 1.2 Environments & Secrets
- **Local dev**: `.env.local` (never committed). `pnpm dev` spins web + worker + Postgres via docker-compose.
- **Staging**: Preview deployments per PR; seeded canary tenant; feature flags default ON for QA.
- **Prod**: Vercel + managed Postgres; worker tier on Fly.io/Render/EC2; secrets in provider’s vault; automated rotation jobs.

### 1.3 Branching/Delivery
- Trunk-based: feature branches → PR → preview → gated checks → squash merge → deploy.
- PR template requires: migrations plan, risk notes, tests, security checklist, manual QA steps.

**Checklist — System Map**
- [ ] `/src/app/api/*` exists with route handlers only delegating to services.
- [ ] `/src/server/services/*` implemented with typed inputs/outputs.
- [ ] `/prisma/schema.prisma` matches models in this binder; seeds run.
- [ ] Worker tier runnable locally and in staging.
- [ ] Observability emits requestId/tenantId; dashboards exist.
- [ ] AI broker switches between OpenAI and OSS by ENV.

**Acceptance**
- Running `pnpm dev`+`pnpm worker` locally provides end-to-end flows on seeded data with logs/metrics visible.

---

## 2) UX — button-by-button, file-specific

> **Scope:** All core surfaces listed below. All buttons/inputs must have explicit labels, props/state, events, API calls, validations, error UX, and acceptance criteria. Use App Router file naming; create if missing.

### 2.1 Auth

#### 2.1.1 Login
- **File**: `src/app/(auth)/login/page.tsx`
- **Controls**
  - Input **“Email”**  
    - State: `email: string`, `errorEmail?: string`  
    - Validation: RFC5322; `aria-invalid` on fail.
  - Input **“Password”**  
    - State: `password: string`, `errorPassword?: string`  
    - Validation: min 8 chars; never auto-fill into state logs.
  - Button **“Sign in”**  
    - Disabled: while invalid or `loading`.
    - Event: `onClick -> login()`
    - API: `POST /api/auth/login` (headers: `X-Idempotency-Key` optional)
      - Request: `{ email, password }`
      - 200: `{ token (cookie), refreshToken, user:{id,tenantId,roles,name,email} }`
      - Errors: 400 (payload), 401 (creds), 423 (locked), 429 (Retry-After), 5xx (generic).
    - Error UX: toast + form hint; focus first invalid input.
  - LinkButton **“Forgot password?”** → `/(auth)/forgot-password`
  - LinkButton **“Create account”** → `/(auth)/register`
- **Acceptance**: Valid creds redirect to `/dashboard`; httpOnly cookie set; audit event recorded.

#### 2.1.2 Register
- **File**: `src/app/(auth)/register/page.tsx`
- Controls: Name, Email, Password, Confirm, Button **“Create account”**.
- API: `POST /api/auth/register`
  - 201: `{ userId }`; 409: email exists; 422: weak password/invalid email.
- Acceptance: Autologin optional; verify email join to tenant if invite code present.

#### 2.1.3 Forgot/Reset
- **Files**: `src/app/(auth)/forgot-password/page.tsx`, `.../reset/[token]/page.tsx`
- API: `POST /api/auth/password-reset` → `202`, neutral response to avoid user enumeration.
- Acceptance: Reset works end-to-end; rate limit enforced.

### 2.2 Dashboard
- **File**: `src/app/(app)/dashboard/page.tsx`
- Controls: Widgets (My Leads, Tasks Due, Pipeline), Button **“New Lead”**, **“Import CSV”**.
- Acceptance: Widgets load with skeletons; errors surface with retry CTA.

### 2.3 Leads (Index & Detail)

#### 2.3.1 Leads Index
- **File**: `src/app/(app)/leads/page.tsx`
- Controls:
  - Button **“New Lead”** → opens `LeadCreateModal` (`src/components/leads/LeadCreateModal.tsx`)
    - API (submit): `POST /api/leads`
      - Body: `{ name, company, email?, phone?, sourceId?, ownerId? }`
      - 201: `{ id }`; 409 dup email; 422 field errors; 401/403 RBAC.
    - UX: optimistic row insert with rollback on 409 (offer **“View existing lead”**).
  - Button **“Import CSV”** → `LeadImportDrawer`
    - API: `POST /api/leads/import` (multipart)
      - 202 `{ jobId }`; 413 (too large), 415 (unsupported), 422 (bad columns), 429 (frequency).
    - Job status: `GET /api/jobs/{jobId}` (SSE or poll).
  - Search **“Search leads”** + filter chips (Owner, Stage, Source).
    - API: `GET /api/leads?query=&owner=&stage=&page=&pageSize=`
- **Acceptance**: Pagination, sorting, filters, empty state; keyboard navigation.

#### 2.3.2 Lead Detail
- **File**: `src/app/(app)/leads/[id]/page.tsx`
- Controls:
  - Button **“Edit”** → editable form; `PUT /api/leads/:id`
  - Button **“Assign”** (manager/admin) → `PATCH /api/leads/:id { ownerId }`
  - Button **“Archive”** → `PATCH /api/leads/:id { archived:true }`
  - Notes textarea + Button **“Add note”** → `POST /api/leads/:id/notes`
  - AI Panel Button **“Summarize timeline”**, **“Next best action”**
- **Acceptance**: All actions persist; AI responses appear with fallback (raw notes) if AI unavailable.

### 2.4 Organizations / Contacts / Opportunities / Tasks
- Mirror the Leads section: Index page, Detail page with CRUD, assignment, activity logs, and AI helpers (summarize, suggest next steps). File names under `src/app/(app)/*` per entity, with modals in `src/components/*`.

### 2.5 Admin
- **Files**: `src/app/(admin)/admin/[section]/page.tsx`
- Sections: Tenants, Users & Roles, Audit Log, Webhooks, Feature Flags.
- Actions protected by RBAC; all admin actions double-confirm and are audited.

**Checklist — UX**
- [ ] Every button labeled exactly as above.
- [ ] Disabled/loading/aria states implemented.
- [ ] All forms wired to zod schemas with client & server errors.
- [ ] Skeletons for data loads; retries on failure.
- [ ] E2E tests exercise all buttons (see §7).

**Acceptance**
- Accessibility: axe-core passes with zero criticals. Mobile: all pages responsive at ≤375px width.

---

## 3) API Contracts (complete surface)

> **All endpoints return a standard envelope on error:**  
> `{ "error": "BadRequest|Unauthorized|Forbidden|Conflict|TooManyRequests|Internal", "message": "human readable", "details": { field?: [issues] } }`

### 3.1 Auth
- `POST /api/auth/login` — request `{ email, password }` → 200 `{ token(cached in cookie), refreshToken, user }`
  - Edge: 423 locked; rotate refresh token on each use; detect replay.
- `POST /api/auth/register` — request `{ name,email,password,tenantInvite? }` → 201 `{ userId }`
- `POST /api/auth/logout` — 204; invalidate refresh token family
- `POST /api/auth/password-reset` — 202 neutral; rate-limited
- `POST /api/auth/password-reset/confirm` — `{ token, newPassword }` → 200

### 3.2 Tenancy & RBAC
- `GET /api/me` — current user with roles & permissions.
- `GET /api/roles` (admin) — list roles; `PUT /api/users/:id/role` (admin).

### 3.3 CRM Entities (Leads/Orgs/Contacts/Opps/Tasks)
- `GET /api/leads` — query (tenant-scoped) with filters, pagination, search.
- `POST /api/leads` — create; idempotent via `X-Idempotency-Key` or dedupe by (`tenantId`,`email`).
- `GET /api/leads/:id`, `PUT /api/leads/:id`, `PATCH /api/leads/:id`, `DELETE /api/leads/:id`
- `POST /api/leads/import` — multipart; returns `{ jobId }`; status via `GET /api/jobs/:id` (SSE).

*(Repeat for Organizations, Contacts, Opportunities, Tasks with analogous endpoints.)*

### 3.4 Activities/Notes
- `POST /api/leads/:id/notes` — `{ body }` → 201; sanitizes HTML/markdown.

### 3.5 AI
- `POST /api/ai/assist` — `{ context, question }` → `{ answer, citations?, usage }`
- `POST /api/ai/enrich-lead` — `{ leadId }` → `{ fieldsUpdated, sources }`
- `POST /api/ai/summarize` — `{ entity:"lead|opportunity", id }` → `{ summary }`

### 3.6 Admin/Platform
- `GET /api/audit` — filter by actor, resource, time range; paginated
- `GET /api/webhooks` / `POST /api/webhooks` — signed secrets, replay defense (nonce + timestamp)

**Cross-cutting**
- **Idempotency**: All POST that mutate accept `X-Idempotency-Key`; server stores hash→result for 24h.
- **Rate limits**: Sensitive routes return `429` + `Retry-After`.
- **RBAC Matrix**: Implement per-route guards (e.g., `lead:create`, `lead:assign`, `admin:*`).

**Checklist — API**
- [ ] OpenAPI 3.1 doc committed under `/docs/openapi.yaml` and published.
- [ ] Error envelope consistent; `requestId` echoed in logs & responses.
- [ ] Idempotency + rate-limit headers implemented.
- [ ] RBAC unit tests cover allow/deny on all routes.

**Acceptance**
- Postman collection or contract tests pass for every endpoint, including negative cases.

---

## 4) Database & Migrations

### 4.1 Models (Prisma → Postgres)
- **Tenant**(id, name, createdAt)
- **User**(id, tenantId FK, name, email, passwordHash, status, createdAt, lastLoginAt)  
  - Unique: (tenantId, email)
- **Role**(id, name) + **UserRole**(userId, roleId)
- **Organization**(id, tenantId, name, domain?, addresses? JSONB)  
  - Unique: (tenantId, name)
- **Contact**(id, tenantId, organizationId?, name, email?, phone?)
- **LeadSource**(id, tenantId, key, name)  — Seed: website, upload, api, partner
- **Lead**(id, tenantId, organizationId?, ownerId?, name, company, email?, phone?, stage, archived, createdAt, updatedAt)
  - Unique: (tenantId, email) where email not null; partial index for non-null
  - Search: trigram GIN on (name, email, company)
- **Opportunity**(id, tenantId, organizationId?, ownerId?, title, amount, stage, closeDate?)
- **Activity**(id, tenantId, entityType, entityId, body, createdBy, createdAt)
- **Task**(id, tenantId, entityType, entityId, title, dueAt, status, assigneeId?)
- **AuditLog**(id, tenantId, actorId, action, resourceType, resourceId, ip, userAgent, meta JSONB, createdAt partition key)
- **Job**(id, tenantId, type, status, progress, meta JSONB, createdAt, updatedAt)
- **WebhookEvent**(id, tenantId, provider, eventType, payload JSONB, signature, createdAt)

### 4.2 Indexes & Partitioning
- Composite indexes for listings: `(tenantId, createdAt DESC)` on Leads/Activities/Audit.
- Search indexes: trigram on Leads; btree on foreign keys; partial unique on `(tenantId,email)`.
- Partition **AuditLog** and **WebhookEvent** monthly by `createdAt` for write throughput & pruning.

### 4.3 Migrations
- `001_core_auth_rbac` → Tenants/Users/Roles/UserRole/AuditLog (partitioned)
- `002_crm_entities` → Orgs/Contacts/Leads/Opportunities/Activities/Tasks (indexes, uniques)
- `003_jobs_webhooks_ai` → Job, WebhookEvent, LeadSource seed, AiUsage (optional)

### 4.4 Seed & Fixtures
- Roles: `admin, manager, user`
- LeadSource: website, upload, api, partner
- QA: seed “Canary Corp” tenant with realistic data for demos & tests.

### 4.5 Backups/Restore
- PITR enabled; nightly full backups; pre-migration snapshot; **Down** scripts tested in staging.
- Restore runbook: point-in-time to pre-release tag; verify via canary queries.

**Checklist — DB**
- [ ] `prisma migrate dev` (local) and `migrate deploy` (staging/prod) succeed.
- [ ] Partitioning active for Audit/WebhookEvent; pruning job runs nightly.
- [ ] Verification SQL checked in `/ops/sql/verification.sql`.

**Acceptance**
- Unique & FK constraints enforce integrity during CSV imports; rollback on failure leaves DB consistent.

---

## 5) AI Layer (server-only)

### 5.1 Capabilities
- **Assistant**: contextual Q&A tray per page; tool-free by default; can reference docs via RAG.
- **Enrichment**: lead/company info from external providers; LLM normalizes/cleans fields.
- **Summarization**: timeline/notes → short executive summaries; confidence + citations if available.
- **Anomaly Detection**: highlight abnormal activity or pipeline stalls using simple stats first, ML later.

### 5.2 Providers
- **Primary**: OpenAI (configurable models), **Alt**: OSS Llama-class via self-hosted inference (vLLM/text-generation-inference).
- Broker env: `LLM_PROVIDER=openai|oss`; apply token/cost caps per-tenant.

### 5.3 Guardrails
- Redaction (mask PII/tenant identifiers) before prompt.
- Prompt-injection filter; no system instruction overrides.
- Safety refusals when confidence low (fallback to rule-based output).

### 5.4 Metrics & Cost
- Track SR/CTR/CR/FR + token usage & $$ per tenant.
- A/B switch in feature flags; disable AI per-tenant if CR too high or cost threshold exceeded.

**Checklist — AI**
- [ ] `/src/server/ai/broker.ts` with provider interface + redaction.
- [ ] Feature flags for each AI feature.
- [ ] Usage metering persisted; surfaced in Admin → Billing.

**Acceptance**
- If AI fails or is disabled, the base UX still works and displays a plain fallback every time.

---

## 6) Security & Compliance

### 6.1 Controls
- RBAC middleware & Prisma tenant-scope injection.
- Rate limits per route; 2FA optional for admins.
- Secrets in platform vault; rotation jobs; no secrets in code or logs.
- CSP + HSTS; sanitization of Notes; CSRF where needed; SSRF protections on webhooks.
- Audit immutable trail; alert on bulk export or admin role changes.

### 6.2 CI/CD Gates
- Typecheck, ESLint (strict), Unit/Integration ≥80% coverage for changed files.
- SCA (Dependabot/Snyk) — no High/Critical; Secret scanner (gitleaks) — zero findings.
- DAST (ZAP) on preview; fail build on High issues.
- `prisma migrate diff` + `down` rehearsal; seed script run on preview env.

### 6.3 Compliance Notes
- **SOC 2**: access reviews quarterly; change management; incident runbooks; vendor risk for LLMs.
- **GDPR/CCPA**: export & erasure jobs per tenant; data processing addendum template.
- **HIPAA**: not in-scope; if required later, segregate infra + BAA + enhanced audit.

**Checklist — Security**
- [ ] Pen test playbook executed; criticals fixed.
- [ ] Access review and audit dashboards in Admin.
- [ ] Backup/restore drill completed.

**Acceptance**
- Independent security review signs off; no High/Critical vulns; least-privilege verified.

---

## 7) Testing Strategy & Harness

### 7.1 Harness
- `tests/utils/setupTenant.ts` — create tenant, users, tokens.
- `tests/utils/factory.ts` — build Org/Lead/Contact/etc.
- `tests/utils/auth.ts` — programmatic login; cookie jar.
- Playwright `e2e/fixtures/authenticated.ts` — signed-in browser context.

### 7.2 Mapping (examples)
- **Auth**: `auth.login.success.spec.ts`, `auth.login.rate-limit.spec.ts`, `auth.password-reset.flow.spec.ts`
- **Leads CRUD**: `leads.create.201.spec.ts`, `leads.create.409-dup.spec.ts`, `leads.update.200.spec.ts`, `leads.assign.rbac.spec.ts`
- **Import CSV**: `leads.import.202.spec.ts`, `jobs.status.sse.spec.ts`, `import.too-large.413.spec.ts`
- **Search**: `leads.search.trigram.spec.ts`, `leads.pagination.spec.ts`
- **AI**: `ai.assist.redaction.spec.ts`, `ai.summarize.fallback.spec.ts`
- **Admin/Audit**: `admin.roles.change.audit.spec.ts`, `audit.query.filtering.spec.ts`

### 7.3 Coverage Gates
- Unit ≥80% for changed files; Integration smoke for every new endpoint; E2E happy path green.
- Nightly E2E full sweep on staging; load test critical endpoints weekly.

**Checklist — QA**
- [ ] All mapped tests exist & run in CI.
- [ ] Contract tests validate OpenAPI vs implementation.
- [ ] Load tests keep SLOs (p95 < 300ms for GET lists; < 1.5s for POST create).

**Acceptance**
- A red build blocks merge; preview env runs smoke E2E before manual QA sign-off.

---

## 8) Competitor Feature Grid

| Competitor Feature | Current StreamFlow | Better StreamFlow (Target) |
|---|---|---|
| Visual pipeline/board | Basic lists | Drag-and-drop board + code view, SLA timers, WIP limits |
| Monitoring | Minimal | Live dashboards, alerts, anomaly detection |
| Scalability | Single node | Multi-tenant cluster, job queue, autoscale, quotas |
| AI | Prototyped | Assistant, enrichment, summarization, with guardrails |
| Multi-tenancy | Skeleton | Enforced tenant scope at ORM/middleware + tests |
| Security | JWT only | SOC 2-ready: RBAC, audit, rate limits, DAST, pentest |
| Extensibility | REST stubs | Full OpenAPI, signed webhooks, SDKs |
| Analytics | Sparse | Aggregated reports + AI insights, export |
| UX polish | Incomplete | Accessible, responsive, role-aware, error-strong |

---

## 9) Edge Cases, Risks & Mitigations (delta-only)

- **Login lockouts via shared IP** → progressive delays + CAPTCHA, not hard lock.  
- **Refresh token replay** → one-time-use token family; rotation & revocation list.  
- **Missed tenant filter** → Prisma middleware injects tenantId; cross-tenant tests.  
- **Cache bleed** → tenant-prefixed cache keys.  
- **Audit log growth** → monthly partitions + TTL archive.  
- **CSV dupes** → UPSERT + dedupe job; optimistic UI rollback.  
- **Webhook replay** → nonce + timestamp window; signature verification.  
- **Prompt injection** → redaction + instruction firewall; fallbacks.  
- **3P outages** → circuit breaker; cached last-good; degrade gracefully.  
- **Vercel connection limits** → PgBouncer; heavy jobs to worker tier.

**Checklist — Risk**
- [ ] Risk register kept current in repo.
- [ ] Each listed risk has a test or drill proving the mitigation.

**Acceptance**
- No open critical risks without a documented mitigation and owner.

---

## 10) Open Questions & Assumptions

### Assumptions
- Next.js/TS + Prisma/Postgres + Vercel remain the stack.
- Multi-tenant is row-level, not per-schema (can revisit for big tenants).
- AI open-source option required for cost control; OpenAI remains as fallback.
- US-first market; a11y and mobile responsive in scope; i18n later.

### Open Questions (assign owner)
1. Billing provider (Stripe?) and required subscription SKUs.  
2. Background job platform selection (BullMQ vs Temporal).  
3. Observability vendor (Datadog vs OSS stack).  
4. SSO (Google/Microsoft) roadmap and SCIM needs.  
5. Data residency constraints (EU tenants?).

**Checklist — Open Items**
- [ ] Each question has an owner & decision deadline.
- [ ] Decisions recorded in `/docs/ADR/*` (Architecture Decision Records).

**Acceptance**
- No ambiguous areas remain before Phase 2 exit.

---

## 11) Phase Plan & “Done” Definitions

### Phase 1 — **Foundations**
- Deliver auth/RBAC, base schema, seed data, minimal dashboards, CI/CD gates, observability bootstrap.
- **Done when:** Users can register, log in, view dashboard; RBAC enforced; migrations reversible; smoke E2E passes; logs/metrics visible.

### Phase 2 — **Core CRM**
- Leads/Orgs/Contacts/Opps/Tasks CRUD, search, import, notes, assignment; Admin basics; audit.
- **Done when:** All CRUD + import works; audit populated; rate limits present; partitioning live; coverage ≥80% on touched areas.

### Phase 3 — **AI Differentiators**
- Assistant, enrichment, summarization; metrics & cost capping; fallbacks wired.
- **Done when:** AI improves task completion (SR↑, CR↓) on A/B; cost within budget; fallbacks always safe.

### Phase 4 — **Enterprise Polish**
- Compliance hardening (SOC 2 controls mapped), SSO, webhooks, SDKs, dashboards, load & chaos tests.
- **Done when:** Security review passes; SLOs met under load; incident & rollback drills complete; customer-ready.

---

## 12) Runbooks & Commands (quickstart)

```bash
# 1) Install & bootstrap
pnpm i
cp .env.example .env.local   # fill in local secrets
pnpm prisma generate
pnpm prisma migrate dev
pnpm run seed

# 2) Start services
pnpm dev            # Next.js app
pnpm worker         # background jobs (configure in package.json)

# 3) Tests & quality gates
pnpm test           # unit + integration
pnpm test:e2e       # Playwright
pnpm lint && pnpm typecheck

# 4) Migrations (staging/prod)
pnpm prisma migrate deploy
```

**Where to start coding (if files missing):**
- `src/app/(auth)/*` pages; `src/app/(app)/*` pages.
- `src/app/api/*` route handlers (thin) → `src/server/services/*` (thick).
- `src/server/ai/*` broker + features.
- `src/components/*` (forms, tables, modals).
- `prisma/schema.prisma` + `/prisma/migrations/*`.

---

### Sign‑off

When every section’s **Checklist** and **Acceptance** items pass in **staging**, cut a release tag `v1.0.0` and deploy to production with blue/green or canary rollout.

**Owner sign‑offs required:** Architect, Backend Lead, Frontend Lead, Security Lead, QA Lead, Product.

