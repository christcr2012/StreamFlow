# StreamFlow — Master Plan: Integrated Architecture, Provisioning & Offline
_Generated: 2025-09-29 15:22_

This master document unifies and optimizes the three prior efforts:
1) **Architecture & RBAC/Space Tightening**
2) **Multi‑Tenant Onboarding & Provisioning**
3) **Offline‑First Capability (PWA + Sync)**

It provides a coherent rollout sequence, server‑side cost controls, client‑side performance practices, and a single actionable backlog.

---

## Part 1 — Master Guide (Big‑Picture, End‑to‑End)

### 1. Objectives (What “done” looks like)
- **Separation by Space**: CLIENT, PROVIDER, DEVELOPER, ACCOUNTING are *hard‑isolated* in routes, API, and data access.
- **Clean Tenant Provisioning**: A new customer signs up → a tenant is created, seeded from an industry template, and linked to the Provider Federation portal atomically (idempotent, retry‑safe).
- **Offline‑First where it matters**: Critical field workflows (Clock, Leads, Work Orders status) work without network, queueing changes for replay.
- **Efficient & Observable**: Low database and function overhead; actionable logs and audits; background tasks are retryable and idempotent.
- **Scalable UX**: Fast, low‑memory client behavior across a range of phones and networks.

---

### 2. Architecture Tightening (RBAC, Space, Tenant Isolation)
**Why first:** Everything else depends on strict separation to avoid data/UX leakage.

**Key decisions**
- **URL Namespacing**: `/client/*`, `/provider/*`, `/dev/*`, `/accounting/*`.
- **Server‑side guards** everywhere (pages + API): check `{ space, roles, orgId }` on each request.
- **Session Shape**: `/api/me` returns `{ user: { id, orgId, tenantId, space, roles } }`.
- **Navigation**: `AppNav` renders *only* the current space menu (no dynamic merges).
- **Prisma scope**: All queries filter by `orgId`. Updates assert `entity.orgId === session.orgId`.

**Cost & perf notes**
- Lightweight authorization helpers; avoid multiple round trips.
- Batch **AuditLog** writes per request (aggregate details, single insert).

---

### 3. Multi‑Tenant Onboarding & Provisioning
**Goal:** Single global login → per‑tenant experience; sign‑up triggers tenant creation with industry presets and federation link.

**Flow**
1. **Signup/Checkout** on your site → calls `POST /api/tenant/register` with `{ plan, industry, externalCustomerId }`.
2. **Orchestrator** (`createTenant`) runs:
   - Create `Org/Tenant` + base `FeatureModule` rows.
   - Seed roles/policies for *client* space.
   - Apply **industry template** (declarative JSON/TS).
   - Link to Provider Portal (signed when enabled).
   - Create initial OWNER/MANAGER user; queue welcome email.
3. **Login** at one URL → `usePostLoginRedirect` sends user to `/tenant/{tenantId}/{space}/dashboard`.

**Reliability & efficiency**
- **Idempotency** by `externalCustomerId` to avoid duplicates.
- Use a simple **Idempotency** table (key + timestamp). TTL prune old keys.
- Optional background **retry queue** (only for non‑transactional external steps).

---

### 4. Offline‑First Capability (PWA + Sync)
**Scope (Phase 1):** Worker Clock, Leads (create/edit), Work Orders (status only).

**Components**
- **PWA**: `next-pwa`, manifest, icons → app shell loads offline.
- **Local store**: **IndexedDB via Dexie** with tables: `leads`, `workOrders`, `timesheets`, `pending` (op queue).
- **Sync engine**:
  - If offline → write to Dexie + enqueue `{ route, method, payload, orgId, idemKey }`.
  - On reconnect → replay queue with `Idempotency-Key` header.
  - Minimal conflict handling: compare `updatedAt`; return 409 for merge UI when needed.

**Client perf practices**
- Initialize Dexie **lazily** only on pages that require it.
- Cache **only** necessary records (e.g., next 14 days of assignments).
- Keep queued payloads compact (omit server‑derivable fields).

**Server cost practices**
- Use `updatedAt` for conflicts; keep dedupe table minimal.
- Avoid heavy per‑op logging; aggregate per request into one audit record.

---

### 5. Federation & Break‑Glass
- **Federation signing (env‑toggled)**: require signed `{ ts, nonce, bodyHash }`; add replay protection; log succinctly.
- **Receiving‑side RBAC**: never trust remote role claims; map to local subject and check local policy.
- **Break‑glass (temporary elevation)**: time‑boxed scopes, re‑auth gate, full audit, automatic expiry and revocation.

---

### 6. Performance & Cost Optimization (Server and Client)

**Server‑side**
- Prefer **lean tables** for Idempotency (PK + createdAt). Prune with a daily job.
- Transactional provisioning where possible; external calls (email, federation) are retried with backoff.
- Use **SELECT columns** you need (avoid `select *`), and add tenant‑scoped composite indexes (e.g., `(orgId, publicId)`).
- Cache **read‑mostly configs** (industry templates, feature flags) in memory within function runtime or a small KV cache.
- Keep Vercel function cold‑starts low by consolidating small APIs where it makes sense (but don’t over‑monolith).

**Client‑side**
- Lazy‑load heavy components and offline libraries only on pages that need them.
- Paginate and virtualize long lists (leads, jobs).
- Avoid large in‑memory objects; rely on IndexedDB and read slices.
- Defer non‑critical sync (photos/uploads) until Wi‑Fi or when app regains focus.

---

### 7. Observability & QA
- **Audit**: denied policy attempts, provisioning milestones, federation handshakes, break‑glass start/stop.
- **Metrics**: queue size, replay success rate, 409 conflicts, average cold‑start time.
- **E2E Tests**: signup → tenant seeded → login redirect; offline create/edit → replay; cross‑space access denied.

---

### 8. Phased Rollout (Why this order)
1. **Phase 0 — Guardrails First**: RBAC/space separation + org scoping (prevents leakage while you iterate).
2. **Phase 1 — Provisioning**: Stable tenant creation with templates + idempotency (so new customers onboard cleanly).
3. **Phase 2 — Offline Core**: PWA + Dexie + queue on Clock/Leads (highest field impact).
4. **Phase 3 — Federation & Break‑Glass**: Harden cross‑instance trust and controlled elevation.
5. **Phase 4 — Expand Offline + Perf**: Work Orders statuses, background sync, encrypted caches, client perf polish.
6. **Phase 5 — Ops & Cost**: Pruning jobs, indexes, KV caches, CI tests & dashboards.

---

## Part 2 — Unified Task Backlog (Assignable, Non‑Redundant)

### Phase 0 — Architecture & Isolation
- [ ] **Augment `/api/me` to include `{ tenantId, space, roles, orgId }`**  
  **AC:** Client receives shape consistently; `useMe()` exposes all fields.
- [ ] **Page & API guards by space and role** (server‑side)  
  **AC:** Direct hits to wrong space are redirected/403; audit entry created.
- [ ] **Tenant scope helper for Prisma**  
  **AC:** All queries include `orgId`; updates assert `entity.orgId === session.orgId`.
- [ ] **AppNav renders only current space**  
  **AC:** No cross‑space links; hydration race cannot show wrong menu.
- [ ] **Audit consolidation**  
  **AC:** One audit record per request with structured details.

### Phase 1 — Tenant Provisioning
- [ ] **`POST /api/tenant/register` + `createTenant()` orchestrator**  
  **AC:** Given `{ plan, industry, externalCustomerId }`, a tenant is created, seeded, linked; welcome queued; idempotent by `externalCustomerId`.
- [ ] **Industry templates (declarative)**  
  **AC:** Selecting industry alters enabled features/forms without code duplication.
- [ ] **Provider portal link (signed when enabled)**  
  **AC:** New tenants appear in portal; failed handshake retries; audited.
- [ ] **Post‑login redirect hook**  
  **AC:** After login, user lands at `/tenant/{tenantId}/{space}/dashboard`.

### Phase 2 — Offline Core (Critical Workflows)
- [ ] **PWA enablement (next‑pwa + manifest + icons)**  
  **AC:** App shell loads offline; Lighthouse PWA checks pass.
- [ ] **Dexie schema & sync engine (`enqueueOp`, `replayQueue`)**  
  **AC:** Offline op queued and replays with `Idempotency-Key` on reconnect.
- [ ] **Wire Worker Clock to queue**  
  **AC:** Airplane mode clock in/out succeeds locally → syncs later.
- [ ] **Wire Leads (list cache + queued create/edit)**  
  **AC:** Offline shows cached leads; edits sync; 409 conflicts prompt UI only when needed.
- [ ] **Server idempotency table + updatedAt conflicts**  
  **AC:** Replays deduped; 409 returned when server is newer.

### Phase 3 — Federation & Break‑Glass
- [ ] **Enable federation signing + replay protection**  
  **AC:** Unsigned/bad requests rejected; caller identity logged.
- [ ] **Receiving‑side RBAC mapping**  
  **AC:** Remote claims ignored; local policy enforced.
- [ ] **Temporary elevation (time‑boxed)**  
  **AC:** `{ scopes, expiresAt }` stored; re‑auth required; auto‑revokes; audited.
- [ ] **Impersonation guardrails**  
  **AC:** Needs elevation + justification; sensitive fields masked; audited.

### Phase 4 — Expand Offline + Client Perf
- [ ] **Work Orders: cache assignments + queue status changes**  
  **AC:** Next 14 days cached; START/PAUSE/DONE works offline.
- [ ] **Background Sync (Workbox) for queued ops**  
  **AC:** Queue replays even if tab closed; metrics visible.
- [ ] **Client perf: lazy init, list virtualization, small payloads**  
  **AC:** No jank on mid‑range phones; memory stable during long sessions.
- [ ] **Encrypted IndexedDB for selected fields (optional)**  
  **AC:** Sensitive data either excluded or encrypted.

### Phase 5 — Ops, Cost & Quality
- [ ] **Prune Idempotency keys** (daily job)  
  **AC:** Table stays small; no impact on dedupe correctness.
- [ ] **Composite indexes (tenant‑scoped)**  
  **AC:** Fast queries at scale; measured by EXPLAIN.
- [ ] **KV or in‑memory cache for read‑mostly configs**  
  **AC:** Reduced DB hits for templates/flags.
- [ ] **E2E CI tests** (signup → seeded → login redirect; offline replay; cross‑space denial)  
  **AC:** Green pipeline; reproducible fixtures.
- [ ] **Observability dashboards** (queue size, conflicts, cold‑starts)  
  **AC:** Team can detect regressions quickly.

---

## Appendix — Implementation Notes

**Idempotency Table (minimal)**  
- Columns: `id (PK)`, `createdAt (timestamp)`  
- Keep rows for ~24‑72 hours; delete older nightly.

**Industry Templates**  
- Keep small and overridable (features, forms, default flows).  
- Load once per process and cache (don’t re‑hit DB every request).

**Conflict Strategy**  
- Timesheets: last‑write‑wins.  
- Leads/Work Orders: `updatedAt` compare → 409 with server entity; client UI resolves.

**Security**  
- Never cache payment secrets offline.  
- Tenant switch clears page caches and resets Dexie scope.

---

**End — Master Plan**
