# Phase-1 Run Guide (Bundle v3.5)

## Prereqs
- Node 22.x (repo engines)
- Optional: Prisma dev DB for seed previews (not required)

## Importers
- Assets (CSV/XLSX):
  - node importers/excel/import_assets.mjs templates/assets.csv demo-fleet
  - Output: out/assets.import.json
  - Required columns: id, type (optional: size, idTag)
- Landfills (CSV/XLSX):
  - node importers/excel/import_landfills.mjs templates/landfills.csv
  - Output: out/landfills.import.json
  - Required columns: id, name, lat, lon, accepts
- Routeware intake:
  - node importers/routeware/routeware_to_corti.mjs
  - Input dir: importers/routeware/inbox
  - Output: out/routeware.*.json
- AllyPro intake:
  - node importers/allypro/allypro_to_corti.mjs
  - Input dir: importers/allypro/inbox
  - Output: out/allypro.*.json

## Routing Engine (unit tests)
- npm run test:unit (or pnpm test)
  - Includes tests/unit/routing.test.ts (4 tests)
  - Includes tests/unit/agreements_rolloff.test.ts (3 tests)
  - Includes tests/unit/importers.test.ts (3 tests with golden fixtures)

## Agreements
- Example JSON: AGREEMENTS_examples/rolloff_grace_30days.json
- Settlement glue:
  - tsx scripts/agreements/settle_charges.ts scripts/agreements/samples/charges.json
  - Output: out/charges.result.json
  - With wallet.balance_cents=0, returns 402-style invoice payload

## Seeds
- Dev dataset: SEEDS/assets_landfills.json
- If Prisma configured, add a loader under scripts/seeds/ (optional; not required for demo)

## Guardrails
- No new HTTP routes added; 36-route cap unchanged
- Wallet/HTTP 402 observed for costed actions (settlement glue)
- No paid services called by default

## Phase-2 Enhancements (Importers Hardening + Vertical Packs)
- **Schema validation**: Zod entity schemas (CUSTOMERS, JOBS, INVOICES) validate mapped records before rule-based checks
  - Location: `src/lib/import/schemas.ts`
  - Integration: batch processor validates against schema, logs structured errors with field pointers
  - Tests: `tests/unit/importers_schema.test.ts` (all passing)
- **Golden fixtures**: `tests/fixtures/importers/` contains reference inputs and expected outputs
- **Automated testing**: importer tests run as part of `npm run test:unit` (79/79 passing)
- **Vertical packs**: `packages/verticals/` exports stable registry and helpers for 18 service verticals
  - See `packages/verticals/README.md` for usage (getVerticalByKey, getVerticalsByCategory, etc.)
  - Concrete-lifting-and-leveling pack includes graceful fallback for missing assets

## Phase-3 Enhancements (Agreements Engine & Wallet)
- Rule evaluation: packages/agreements provides pure function rule-eval module
- Wallet module: packages/wallet with in-memory store for balance/transaction management
- Integrated pipeline: eval_and_settle.ts script connects rule-eval → charges → wallet/402
- Commands:
  - npx tsx scripts/agreements/eval_and_settle.ts AGREEMENTS_examples/rolloff_grace_30days.json scripts/agreements/samples/event_idle_35days.json
  - Output: out/eval_and_settle.result.json (wallet debit or 402 invoice)
- Tests: 10 new tests (5 for agreements.eval, 5 for wallet) - all passing

## Phase-4 Enhancements (Routing Optimization)
- Routing options: detourCoefficient and maxStops parameters
- Landfill search: tsx scripts/routing/search_landfills.ts <material> [landfills.json]
- Property tests: capacity invariants, performance smoke (1000 stops < 5s)
- Tests: 4 new tests - all passing

## Phase-5 Enhancements (UX Components)
- UI components: PaymentRequiredBanner, RateLimitBanner, FeatureToggle
- Feature flags: in-memory toggle system (can be replaced with DB)
- No new routes: components designed for existing pages
- Tests: 4 new tests - all passing

## Phase-6 Enhancements (Cost Controls & Verification)
- Cost budgets: docs/COST_BUDGETS.md (provider baseline ≤ $100/month)
- Cost dashboard: tsx scripts/cost/dashboard.ts (local, no external services)
- Route count check: tsx scripts/ci/verify_route_count.ts (enforces 36-route cap)
- Performance docs: docs/PERFORMANCE.md (benchmarks and optimization guidelines)

## Phase-7 Enhancements (Migration Helpers)
- Migration scripts: migrate_assets.ts, migrate_landfills.ts, migrate_customers.ts
- Migration runbook: docs/MIGRATION_RUNBOOK.md (step-by-step procedures)
- Rollback strategies: documented for each failure scenario
- Data quality checks: validation in all migration scripts

