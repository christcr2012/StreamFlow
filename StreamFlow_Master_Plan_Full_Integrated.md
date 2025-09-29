# StreamFlow — Full Integrated Master Plan
_Generated: 2025-09-29 19:27_

This document is the **complete integrated strategy** for StreamFlow SaaS, ready to be committed into GitHub as project documentation.

---

## Overview
StreamFlow is a multi-tenant SaaS platform built with:
- **Frontend:** Next.js (App/Pages) on Vercel
- **Backend:** Prisma ORM + Neon Postgres
- **Auth:** Session-based RBAC with owner-configurable roles
- **Offline-first:** PWA shell with Dexie for field workers
- **AI Assist:** Token-based usage limits, prepaid packs, usage dashboard
- **Integrations:** SAM.gov + other RFP/bid databases with per-tenant API keys
- **Modules:** Estimating/drawing tool, scheduling/dispatch, auto-assign, contracts/bids, accounting-lite

All features are scoped to tenants (multi-tenant isolation).

---

## Architecture
- Each tenant has `TenantSettings` controlling industry profile, feature flags, and AI budget.
- Owner-configurable RBAC allows cloning/tweaking roles; enforced server-side via middleware.
- All data queries are scoped by `orgId`.
- Industry templates applied at provisioning time to pre-configure features and defaults.
- Offline-first: Dexie stores queued ops, synced with backend via idempotency keys.
- Federation: spaces for CLIENT, PROVIDER, DEV, ACCOUNTING with enforced boundaries.
- Break-glass: elevated access with audit logs.

---

## Schema (Prisma)
Tables include: `TenantSettings`, `LeadRules`, `GeoRegion`, `PricingRule`, `AiUsage`, `IntegrationCredential`, `Role`, `Permission`, `RolePermission`, `UserRole`.  
Indexes and composite keys ensure performance at scale. Secrets stored encrypted (AES-GCM/KMS).

---

## Core Modules

### 1. RFP Integrations
- Each tenant stores their own API key for SAM.gov and others.
- Queries use per-tenant credentials, avoiding global throttling.
- AI Assist translates natural language → structured filters (e.g., NAICS codes, region).
- Presets allow saving queries.

### 2. AI Usage & Billing
- Every AI call wrapped by middleware to meter tokens, enforce caps, and log usage.
- Free $50 worth of usage included per tenant; top-ups sold via Stripe as prepaid token packs.
- Dashboard shows usage bar and warnings when thresholds are near.

### 3. Estimating Module
- **Drawing Estimator:** Canvas (React Konva) to sketch layouts (fences, floors, etc.).
- **Pricebook:** Catalog of items, assemblies, formulas (e.g., posts per LF).
- **Quote Builder:** Generates branded PDF with e-sign option, stored in Documents.

### 4. Scheduling & Dispatch
- Calendar UI with drag/drop jobs, day/week views, conflict detection, travel hints.
- Auto-assign engine matches jobs to technicians by skills, location, and availability.
- Supports both manual drag/drop and AI-assisted assignment.

### 5. Contracts & Bids
- Tokenized templates with placeholders.
- Proposal → PDF → e-sign → stored contract.
- Bid pipeline with statuses (Draft, Sent, Viewed, Won/Lost) and reminders.

### 6. Accounting-lite
- Core models: `Account`, `JournalEntry`, `Invoice`, `Payment`.
- Posting rules enforce double-entry consistency.
- Reports: P&L, balances, CSV export.

### 7. EIN Lookup (Optional)
- Optional EIN input during setup.
- Prefills company info from public registries (where available).
- Always skippable, never requires SSN.

### 8. Onboarding Flow
- Signup: email + password → choose industry & role.
- Owner wizard: business name, hours, invite team, integrations (optional), modules (preselected by template).
- Guided tours: short, role-specific; checklist to first success (import lead or send quote).
- Free trial: no credit card required upfront; upgrade prompt later.

---

## Observability & QA
- Metrics: AI tokens, import rates, queue size, conflicts, latency, cold starts.
- Tests: tenant provisioning, RBAC denial, offline replay, AI caps, estimating math, posting rules, scheduling UI.
- Cost controls: prune idempotency keys, cache feature flags/templates, add composite indexes, lazy-load heavy modules.

---

## Rollout Sequence
- **Phase 0:** Verify guardrails (RBAC, federation, provisioning).
- **Phase 1:** Tenant settings, feature flags, integrations, AI budgets.
- **Phase 2:** RFP search + AI Assist.
- **Phase 3:** Estimating (drawing + pricebook + quotes).
- **Phase 4:** Scheduling & auto-assign.
- **Phase 5:** Contracts & bids.
- **Phase 6:** Accounting-lite.
- **Phase 7:** Federation hardening + break-glass.
- **Phase 8:** Perf/cost optimizations, QA automation, docs.

---

## API Routes (Examples)
- `/api/settings/*` — tenant settings, lead rules, geo, pricing, integrations
- `/api/leads/search` — RFP search (with AI Assist)
- `/api/ai/*` — AI operations with token metering
- `/api/estimate/*` — drawings, quotes
- `/api/schedule/*` — calendar, auto-assign
- `/api/accounting/*` — invoices, payments, reports
- `/api/onboarding/apply-template` — applies industry template

---

**End of Full Integrated Master Plan**
