# Implementation Checklists (Executable by Sonnet)

Cross-refs: ./ROADMAP.md, ./TEST_PLANS.md, ./ARCHITECTURE.md

## Phase-2: Packs Productionization & Importers Hardening
- [x] packages/verticals: add minimal packs for remaining verticals (placeholders are fine but export shape must be stable)
- [x] importers: add schema validation (headers present, basic type checks)
- [x] add golden fixtures under tests/fixtures/importers/** and compare outputs
- [ ] docs: update docs/PHASE1_RUN.md with extended usage (pending)

## Phase-3: Agreements Engine Settlement & Wallet Flows
- [ ] packages/agreements: add rule-eval module (pure function)
- [ ] scripts/agreements: wire rule-eval -> charges.json -> settle_charges.ts
- [ ] wallet module: read/update balance; record WalletTxn
- [ ] tests: unit for eval math; integration for wallet vs 402 branch

## Phase-4: Routing Optimization
- [ ] packages/routing: add detour coefficient setting; preferred landfill override (already supported) tests
- [ ] add property tests for capacity invariants; large input performance smoke
- [ ] landfill catalog tools (scripts) to search by accepts/materials

## Phase-5: UX Wiring (No New Routes)
- [ ] add banners/snackbars for 402, 429 states in existing pages
- [ ] add feature toggles driven from existing config tables (no new routes)
- [ ] e2e smoke (manual or minimal) to verify visibility/states

## Phase-6: Cost & Route-Cap Guardrails
- [ ] add cost budgets document and local dashboards
- [ ] CI: ensure route count check job remains green
- [ ] perf docs: locally reproducible benchmarks

## Phase-7: GTM & Migration Helpers
- [ ] migration template scripts for assets/landfills/customers
- [ ] runbooks and rollback steps per migration

## Global
- [ ] ensure no paid services used by default; document env gates
- [ ] re-run contracts:gen + contracts:diff; ensure no breaking removals

