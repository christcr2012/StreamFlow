# StreamFlow • Augment Code Guidance (Read Me First)

**Purpose:** This file is the *source of truth* for Augment Code to plan, analyze, and implement changes in the **StreamFlow** codebase (multi-tenant SaaS on Vercel + Neon, with offline mode, RBAC, provider/client Stripe lanes, onboarding wizards, and industry packs).

**Agent**: You (Augment Code) must **follow the steps in order** and **log your work** into the repo as you go.  
**Human**: You can say “Go” and let it run; it will pause only at “HUMAN-DECISION” points.

---

## 0) Contract & Guardrails (Agent must obey)
- Never push to remote unless the file `ops/ALLOW_PUSH` exists (exact string `OK_TO_PUSH` in file).  
- All writes must be via safe edits (use diffs, TODOs for unfinished work).  
- Do not delete existing features without approval.  
- Create logs in `ops/journal.md` and audits in `ops/audits/*.md`.  

---

## 1) Repo Intake & Maps
1. Clone repo (https://github.com/christcr2012/StreamFlow).  
2. Generate file tree, routes map, models map → store in `ops/maps/`.  
3. Log outputs in `ops/journal.md`.  

---

## 2) Reference Files
Read-only (do not change):  
- `StreamFlow_Master_Plan_Integrated.md`  
- `Tightening_Up_Architecture.md`  
- `MultiTenant_Onboarding_Provisioning_Tightening.md`  
- `StreamFlow_Offline_Integration_Guide.md`  
- `StreamFlow_Issue_List.*`  

Summarize findings into `ops/audits/refactor-audit.md`.  

---

## 3) Architecture Audit
Checklist in `ops/audits/refactor-audit.md`:  
- Multi-tenant isolation  
- RBAC & federation  
- Offline-first (service worker, IndexedDB, sync queue)  
- Billing lanes (provider vs client)  
- Onboarding + industry packs  
- Observability & safety  

Mark each as ✅ PASS or ❌ FAIL with file-level patch plans.  

---

## 4) Planning & Design
Capture decisions in `docs/design/decisions-<date>.md`.  

### Team Invitation Flow
- Email via SendGrid (stub fallback if no key).  
- Invitation links (self-set password).  
- Roles: legacy + RBAC.  

### Module Selection
- Curated starter pack (AI Lead Scoring, Mobile App, API Access, Document AI, Email, SMS).  
- Pre-check based on industry.  

### Lead Offline Sync
- New + Edit pages (`/leads/new`, `/leads/[id]/edit`).  
- Support create + edit offline.  

### Provider Billing APIs
- `/api/provider/billing/stats` → revenue + subs + usage (30d default).  
- `/api/provider/billing/subscriptions` → detailed with usage snapshot.  

### Environment Variables
- Auto-generate AES-GCM key with `scripts/gen-key.ts`.  

---

## 5) Phases
- **Phase 1**: Role/tenant guards, RBAC helpers, break-glass.  
- **Phase 2**: Onboarding invites + module selection.  
- **Phase 3**: Offline leads.  
- **Phase 4**: Provider billing APIs.  
- **Phase 5**: Tenant-scoped secrets + integrations.  

---

## 6) File/Folder Adds
```
ops/{journal.md,audits,checkpoints,maps}
src/lib/auth/{roles.ts,policies.ts,breakGlass.ts}
src/lib/offline/{indexeddb.ts,syncQueue.ts}
src/server/email/sendgrid.ts
src/server/feature/packs.ts
src/lib/billing/usageMeter.ts
scripts/gen-key.ts
pages/invite/[token].tsx
pages/leads/{new.tsx,[id]/edit.tsx}
public/{manifest.json,service-worker.js}
```
---

## 7) API Contracts
### POST `/api/admin/invitations`  
Body: `{email, legacyRole, rbacRoles?}`  
Effect: create invitation + email link.  

### GET `/api/provider/billing/stats?range=30d|90d|all`  
Returns revenue + subs + usage.  

### GET `/api/provider/billing/subscriptions?range=30d|90d|all`  
Returns detailed tenant subscription data.  

---

## 8) Stripe Lanes
- **Provider lane**: SaaS billing.  
- **Client lane**: tenant’s customer billing.  
Keys kept separate.  

---

## 9) Offline Policy for Leads
- IndexedDB queue, last-write-wins conflicts.  
- Retry with exponential backoff.  

---

## 10) Environment & Keys
- Auto-gen key if missing.  
- Env placeholders: `SENDGRID_API_KEY`, `EMAIL_FROM`, per-tenant Stripe keys.  

---

## 11) CI/Commits
- ESLint/TS strict CI.  
- Conventional commit messages.  
- Push only with `ops/ALLOW_PUSH`.  

---

## 12) Done Criteria
- Each Phase has clear PASS criteria.  
- All work logged in `ops/journal.md`.  

---
**End of Guidance.**
