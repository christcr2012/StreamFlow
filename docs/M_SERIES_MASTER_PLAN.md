# M‑Series Master Plan (Plan‑of‑Record)

Purpose: Track all M‑milestones (M2–M7) in one place, link to executable checklists, and orchestrate sequencing without asking you to constantly choose. Codebase remains the source of truth.

Governance
- Source of truth for reality: codebase + you
- Planned work lives here and in machine‑readable m_series.plan.yml
- Each M includes: goal, scope, status, dependencies, decision hooks (auto‑prompts), and verification
- By default, proceed autonomously in order (M2 → M3 → …), only pausing for explicitly risky/irreversible choices

Status legend: proposed | in‑progress | blocked | done | deferred

Cross‑refs: docs/planning/ROADMAP.md, docs/planning/IMPLEMENTATION_CHECKLISTS.md, docs/PLANNED_WORK_BACKLOG.md

---

## M2 — Packs + Importers Hardened (Phase‑2)
Goal: Harden vertical packs and importers; create golden fixtures and smoke CLI.

Scope (see Implementation Checklists Phase‑2)
- packages/verticals: minimal packs for remaining verticals (stable export shape)
- importers: schema validation (headers, basic types)
- tests/fixtures/importers/**: golden fixtures + output comparisons
- docs: update PHASE1_RUN.md usage

Current execution status: in‑progress (UI M2 work uncovered TypeScript build blockers that must be cleared first)
Blocking precondition: TypeScript build blockers (see PLANNED_WORK_BACKLOG.md → M2 Phase 6 tasks)
Decision hooks (auto):
- When typecheck + Vercel builds are green, auto‑prompt: “Run importer golden fixtures and hardening now?” (default: proceed)
Verification:
- Local CLI smoke passes; golden fixtures match; typecheck/build green; tests for import validation passing

---

## M3 — Settlement Pipeline & Wallet Flows (Phase‑3)
Goal: Rule‑eval → charges.json → settle_charges; wallet‑first debit else 402 invoice artifacts.

Scope (Phase‑3)
- packages/agreements: rule‑eval module (pure fn)
- scripts/agreements: wire rule‑eval → charges.json → settle_charges.ts
- wallet module: read/update balance; record WalletTxn
- tests: unit (eval math) + integration (wallet vs 402 branch)

Status: proposed
Depends on: M2 done; contracts stable
Decision hooks (auto):
- If wallet tables/entities present but disabled, auto‑enable mocks; else synthesize local store (no paid services)
Verification: unit/integration tests green; 402 path returns artifacts

---

## M4 — Routing Optimization & Tools (Phase‑4)
Goal: Add optimizer knobs, landfill catalog tools; capacity simulation tests.

Scope (Phase‑4)
- packages/routing: detour coefficient setting; preferred landfill override tests
- property tests for capacity invariants; large input performance smoke
- landfill catalog scripts (search by accepts/materials)

Status: proposed
Depends on: M3 minimal wallet/agreements stability
Decision hooks (auto): enable only local tools (no new routes)
Verification: property tests pass; perf smoke under threshold

---

## M5 — UX Toggles & Smoke Flows (Phase‑5)
Goal: Wire UX toggles/alerts behind existing routes; reduce CI time.

Scope (Phase‑5)
- Banners/snackbars for states (402, 429) on existing pages
- Feature toggles from existing config tables (no new routes)
- e2e smoke (minimal/manual) to verify visibility/states

Status: proposed
Depends on: M2/M3 outputs visible in UI
Decision hooks (auto):
- After M3 artifacts exist, auto‑prompt to surface 402 banners and guards (default: proceed)
Verification: quick UX smoke checklists pass; CI ≤ 10 min goal considered

---

## M6 — Cost & Route‑Cap Guardrails (Phase‑6)
Goal: Cost dashboard (local), keep 36‑route check green, perf docs.

Scope (Phase‑6)
- Cost budgets doc + local dashboards
- CI job: route count check remains green
- Perf benchmarking docs

Status: proposed
Depends on: M5 UX signals present; CI stable
Decision hooks (auto): only local dashboards; no paid services without explicit approval
Verification: route cap job green; perf docs checked‑in; local cost dashboard runs

---

## M7 — Migration Templates & GTM (Phase‑7)
Goal: Migration templates, runbooks, signoff checklist.

Scope (Phase‑7)
- Migration template scripts for assets/landfills/customers
- Runbooks and rollback steps per migration

Status: proposed
Depends on: prior phases producing stable data models
Verification: dry‑run migrations pass; rollback tested locally

---

## Execution Rules (Autonomous)
- Proceed in milestone order unless a dependency or guardrail fails
- Only interrupt for: destructive migrations, paid services, or breaking contract changes
- Always keep PLANNED_WORK_BACKLOG.md and m_series.plan.yml updated (statuses, commits)
- At each “decision hook”, I will proactively suggest enabling specific features aligned with the current M (no menu dumps)

## Today’s Next Actions
- Clear M2 blockers: finish TypeScript fixes and verify Vercel builds
- Immediately resume M2 Phase‑2 hardening tasks (importers/packs/golden fixtures)
- Prepare M3 scaffolding (agreements rule‑eval API as pure fn + tests)

