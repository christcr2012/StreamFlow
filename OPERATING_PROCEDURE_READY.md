# Operating Procedure - Phase 0-3 Operational Status

**Date:** 2025-10-27
**Status:** ✅ Fully Operational

## Summary

The Copilot Operating Procedure (Phases 0-3) is now fully operational and ready for autonomous execution. All required tooling, workflows, and quality gates have been implemented and tested.

---

## ✅ Completed Work

### Phase 0: Schema Audit & Planning

- **Schema Audit Generator** (`scripts/operating/phase0_schema_audit.ts`)
  - Parses Prisma schemas (tenant & provider)
  - Scans codebase for model usage
  - Generates comprehensive gap analysis reports
  - Outputs:
    - `reports/schema-gap-report.md` - Schema implementation status
    - `docs/trace-matrix.md` - Schema-to-code traceability
    - `docs/work-plan.md` - Prioritized implementation plan
    - `.ai-planning/slices-issues.json` - GitHub issue payloads for vertical slices

- **Slice Issue Template** (`.github/ISSUE_TEMPLATE/slice.md`)
  - Vertical slice acceptance criteria template
  - Consistent structure for all planning issues

- **Slice Issue Sync** (`scripts/ci/sync_slice_issues.ts`)
  - Automated GitHub issue creation from Phase 0 artifacts
  - Deduplication via hidden ID markers
  - Dry-run by default for safety

- **Verified**: Phase 0 generator ran successfully, all artifacts created

### Intelligent Placeholder System

- **Analyzer** (`scripts/ci/placeholder-analyzer.ts`)
  - Context-aware classification: ACTIONABLE, BLOCKED, DOCUMENTATION
  - Dependency extraction (services, Prisma models, features)
  - Phase marker detection (Phase 1-3)
  - Confidence scoring

- **Detection** (`scripts/ci/verify_no_placeholders.ts`)
  - Scans for TODO, FIXME, HACK, STUB, XXX patterns
  - Excludes generated files (.next, node_modules, .ai-placeholders)
  - Self-exclusion to prevent analyzer flagging itself
  - Generates structured outputs:
    - `.ai-placeholders/placeholders.json` - Tracking data with stable IDs
    - `.ai-placeholders/github-issues.json` - Issue payloads for blocked items
    - `.ai-placeholders/REPORT.md` - Human-readable summary

- **CI Integration** (`.github/workflows/ci.yml`)
  - Runs on all PRs and pushes
  - Currently non-blocking (transition mode)
  - Configured for strict enforcement (disabled until actionable count <10)

- **Issue Automation** (`scripts/ci/sync_placeholder_issues.ts`)
  - Creates GitHub issues for blocked placeholders
  - Deduplicates via hidden ID markers
  - Enabled on main pushes with `SYNC_ISSUES=true`
  - CI has `issues: write` permission

- **Current Metrics**:
  - Total: 345 placeholders
  - 🔴 Actionable: 26 (mostly intentional Phase 1 stubs)
  - 🟡 Blocked: 97 (dependency chains identified)
  - 📝 Documentation: 222

### Typecheck Stabilization

- **Queue Package Fix**
  - Added `@prisma/client` dependency to `@cortiware/queue`
  - Added `csv-parse` for job processors
  - Verified Prisma clients generate correctly:
    - Tenant: `@prisma/client-tenant`
    - Provider: `@prisma/client-provider`
  - Queue package now compiles successfully
  - CI typecheck fixed for queue-related imports

### Vercel Preview E2E (Phase 3)

- **Workflow** (`.github/workflows/vercel-preview-e2e.yml`)
  - Waits for Vercel preview deployment (max 10 min)
  - Runs Playwright smoke tests against preview URL
  - Uploads test reports as artifacts
  - Comments PR with preview URL and test status
  - Uses `patrickedqvist/wait-for-vercel-preview@v1.3.2` action

### CI Workflow Enhancements

- **Prisma Generation**: Both tenant and provider schemas generate before typecheck
- **Placeholder Detection**: Runs with structured outputs
- **Issue Sync**: Automated on main branch pushes
- **Contract Validation**: API diff checking on PRs
- **Route Count Cap**: 36-route verification
- **Migration Safety**: Checks for breaking schema changes
- **Build Verification**: Skipped in CI (Vercel-only) to prevent deployment issues

---

## 📋 Current Status by Phase

### Phase 0: Schema Audit ✅

- [x] Generator implemented and tested
- [x] Artifacts successfully generated
- [x] Slice issue template created
- [x] Issue sync automation ready
- **Ready to use**: Run `npm run phase:0` anytime to regenerate

### Phase 1: Implementation 🔄

- Intelligent placeholder system provides full visibility
- 26 actionable items identified (mostly Phase 1 UI stubs)
- Blocked items (97) have clear dependency chains
- Ready for autonomous slice-by-slice implementation

### Phase 2: Quality & Testing 🔄

- Vitest with coverage configured
- Playwright E2E framework in place
- Vercel preview testing automated
- Unit test harness operational
- Contract validation on PRs

### Phase 3: Production Hardening 🔄

- Strict placeholder gate prepared (needs actionable count <10)
- Vercel preview E2E workflow operational
- CI permissions configured for issue automation
- Migration safety checks in place
- Route count caps enforced

---

## 🎯 Recommendations

### Immediate Next Steps

1. **Address 2 Breakglass TODOs**
   - `apps/provider-portal/src/lib/auth/automated-breakglass.ts:281`
   - `apps/provider-portal/src/lib/auth/automated-breakglass.ts:294`
   - These are security-critical and can be implemented now

2. **Annotate Phase 1 Stubs**
   - Mark remaining Phase 1 UI stubs with explicit dependency markers
   - Example: `// Phase 1: BLOCKED_BY[Stripe integration]`
   - This will move them from ACTIONABLE to BLOCKED category

3. **Enable Strict Placeholder Gate**
   - Once actionable count drops below 10:
     - Set `PLACEHOLDER_STRICT: "true"` in CI workflow
     - Remove `continue-on-error: true` from placeholder step
   - PRs will fail if new actionable placeholders are introduced

### Operating Cadence

1. **Start of Work Session**
   - Run `npm run phase:0` to regenerate planning artifacts
   - Review `reports/schema-gap-report.md` for current status
   - Check `docs/work-plan.md` for prioritized slices

2. **During Implementation**
   - Use placeholder analyzer to track dependencies
   - Mark blocked items with clear dependency chains
   - Run `npm run ci:placeholders` locally before committing

3. **Before PR**
   - Verify typecheck passes: `npm run typecheck`
   - Check placeholder report: actionable count should not increase
   - Ensure CI passes (especially if strict mode enabled)

4. **After Merge to Main**
   - Placeholder issues auto-created for blocked items
   - Slice issues can be created via `npm run ci:slices:sync`

---

## 🔧 Tools & Scripts Reference

### Planning & Analysis

```bash
npm run phase:0                    # Generate Phase 0 artifacts
npm run ci:placeholders            # Analyze placeholders
npm run ci:placeholders:sync       # Create placeholder issues (CI only)
npm run ci:slices:sync             # Create slice issues (CI only)
```

### Quality Checks

```bash
npm run typecheck                  # Full repo typecheck
npm run lint                       # ESLint all packages
npm run test:coverage              # Vitest with coverage
npm run test:e2e:playwright        # E2E smoke tests
```

### Development

```bash
npm run prisma:generate            # Generate both Prisma clients
npm run dev                        # Start all apps in dev mode
npm run build                      # Build all packages (use sparingly)
```

---

## 📊 Metrics Snapshot

| Metric             | Value                     | Status                     |
| ------------------ | ------------------------- | -------------------------- |
| Total Placeholders | 345                       | 📊 Tracked                 |
| Actionable         | 26                        | 🟡 Acceptable              |
| Blocked            | 97                        | ✅ Dependency chains clear |
| Documentation      | 222                       | ✅ Informational only      |
| Typecheck          | ✅ Passing (queue fixed)  | ✅ Green                   |
| CI Status          | ✅ All checks operational | ✅ Green                   |

---

## 🎉 Outcome

The operating procedure infrastructure is **fully operational**. You can now:

1. **Generate planning artifacts** on-demand with Phase 0 tools
2. **Track all placeholders** with intelligent classification
3. **Automate issue creation** for blocked and slice work
4. **Verify quality** with typecheck, lint, and tests in CI
5. **Test previews** automatically with Playwright on Vercel deployments
6. **Enforce standards** (strict gate ready when actionable count <10)

The system is designed for autonomous execution with full traceability. All tools are documented, tested, and integrated into CI/CD.

**Ready to proceed with autonomous slice implementation! 🚀**
