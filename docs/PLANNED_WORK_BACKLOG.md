# Planned Work Backlog (Plan-of-Record)

Purpose: Keep valid, recent plans accessible in one place while keeping the codebase as the source of truth.

Policy:
- Codebase + user are the only sources of truth for what exists today
- This backlog tracks planned work gathered from recent handoff/planning docs (last ~week)
- Each item includes provenance (source doc), and a confirmation flag
- Items move to "Confirmed" only after explicit user confirmation
- Implementers must re-verify code reality before starting any item

Status Keys:
- status: proposed | confirmed | in-progress | done | blocked
- needs-confirmation: true|false (true until you confirm)
- last-code-check: pass | fail | n/a (whether code currently matches the preconditions)

---

## A. High-Priority (awaiting confirmation)

1) M2 Phase 6 – Fix TypeScript build blockers for Vercel
- status: proposed
- priority: high
- needs-confirmation: true
- last-code-check: fail (TS errors present)
- source: docs/M2_CURRENT_STATUS_AND_PLAN.md
- tasks:
  - Modal "use client" directive (packages/ui/src/Modal.tsx)
  - Fix pagination Button import (apps/tenant-app/src/components/ui/pagination.tsx)
  - Remove Button inline style props (~8 files)
  - Update Input onChange handlers to (value: string) (~10+)
  - Fix event handler type errors and implicit anys
  - Re-run typecheck and monitor Vercel

2) Theme follow-ups – Tone down remaining bright themes and increase variety
- status: proposed
- priority: medium
- needs-confirmation: true
- last-code-check: n/a (two themes already toned down)
- source: docs/THEME_IMPROVEMENTS_TRACKER.md
- tasks:
  - Audit ~5–7 remaining bright themes for WCAG AA
  - Reduce saturation/brightness where needed
  - Optional: replace near-duplicates to increase variety

3) Deployment secrets (Option C) – Complete required secrets for auth flows
- status: proposed
- priority: medium
- needs-confirmation: true
- last-code-check: n/a (deployment work)
- source: docs/todos/option-c-todos.md
- tasks:
  - Add AUTH_TICKET_HMAC_SECRET to both apps in Vercel
  - Add TENANT_COOKIE_SECRET, PROVIDER_ADMIN_PASSWORD_HASH, DEVELOPER_ADMIN_PASSWORD_HASH to tenant-app in Vercel

4) Decide which disabled features to enable next
- status: proposed
- priority: medium
- needs-confirmation: true
- last-code-check: n/a (feature flags)
- source: docs/ACTUAL_REMAINING_WORK.md
- notes: src/_disabled/ contains features intentionally off; enable per your direction

5) v2 API endpoints – Design and implement
- status: proposed
- priority: medium
- needs-confirmation: true
- last-code-check: fail (routes missing)
- sources: verified via code scan; handoff docs over 2025-10-10 week
- scope:
  - /api/v2/leads, /api/v2/opportunities, /api/v2/organizations in both apps (as applicable)

6) Code TODOs (security/federation/metrics)
- status: proposed
- priority: low
- needs-confirmation: true
- last-code-check: n/a
- source: docs/_scans/code_todos.tsv
- items:
  - leadScoringConfig: track conversion rates by source
  - entitlements: swap to OIDC claims when FED_OIDC_ENABLED=true
  - federation-audit: persist to AuditLog table
  - oidc: implement JWT verification with IdP public keys

---

## B. Confirmed (none yet)
- Move items here after explicit confirmation

## C. In Progress (none yet)

## D. Done (rolling)
- Keep this short; link to PRs/commits where possible

---

Governance & Workflow:
- New plans discovered in recent docs must be added here with source links, but remain proposed until you confirm
- Before implementation: devs must verify code preconditions and update last-code-check
- After implementation: update status and link commit/PR

Index of recent planning/handoff documents (last ~week): see docs/_scans/recent_docs.tsv.

