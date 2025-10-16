# Go‑Live Cutover Runbook

Audience: Engineering, Ops, and AI Agents
Status: Living document (source of process truth for go‑live)

## Purpose
Clean cutover from a Staging database used during build/testing to a brand‑new Production database with identical schema and zero carryover of test data.

## TL;DR
- Keep building/testing against Staging DB(s)
- At go‑live, provision new Neon Prod DB(s)
- Apply Prisma migrations (no seeds unless explicitly required)
- Point Vercel Production env vars to the new DB(s)
- Redeploy, run smoke tests, keep Staging for grace period

See machine‑readable plan: docs/runbooks/go_live.runbook.yml

## Environments
- Production (Vercel env scope: Production)
- Staging (Vercel env scope: Preview/Development)
- Databases:
  - tenant: Neon (tenant schema)
  - provider: Neon (provider schema)

## Pre‑requisites
- Vercel projects exist for:
  - cortiware-tenant-app (root: apps/tenant-app)
  - cortiware-provider-portal (root: apps/provider-portal)
- Prisma migrations are committed and reflect current schema
- Separate DATABASE_URLs for tenant/provider
- Seeds (if any) are idempotent and disabled by default in Production

## Cutover Steps
1) Provision Production DB(s) in Neon
   - Create two DBs or branches:
     - neon-prod-tenant
     - neon-prod-provider
   - Capture connection strings (DATABASE_URLs)

2) Pre‑warm schema (optional but recommended)
   - Locally or via one‑off job, run against each new DB:
     - npx prisma migrate deploy
     - npx prisma generate

3) Configure Vercel Production env vars
   - Project: cortiware-tenant-app
     - DATABASE_URL = <neon-prod-tenant>
   - Project: cortiware-provider-portal
     - DATABASE_URL = <neon-prod-provider>
   - Do not change Preview/Development (keep pointing to Staging)

4) Redeploy (zero‑downtime)
   - Saving env vars triggers a Production deploy
   - Verify both deployments reach READY

5) Smoke Tests (minimum)
   - Tenant App:
     - Login works
     - Create customer/job/invoice succeeds
     - Theme settings GET/POST works
   - Provider Portal:
     - Login works
     - Provider config/theme GET/POST works

6) Post‑Cutover
   - Announce live status
   - Keep Staging DB(s) for a grace period (e.g., 7–14 days)
   - After grace, archive and drop Staging DB(s)

## Guardrails (Data Safety)
- Never run `prisma migrate reset` in Production
- Prefer additive migrations; if destructive changes are necessary, use a 2‑phase:
  1) Add new columns (nullable) → backfill → switch
  2) Drop old columns in a later release
- Seeds must not run implicitly on Production deploys
- Enable Neon PITR/backups; verify retention
- Ensure Production DATABASE_URLs point only to prod DBs/branches

## Rollback Plan
- Fast rollback: switch Production DATABASE_URL(s) back to previous DB(s), redeploy
- If a migration caused issues, roll forward with a hotfix migration; avoid down migrations unless absolutely required
- Vercel deployments are immutable; you can also promote the previous READY deployment

## Responsibilities
- Owner: Engineering lead
- Approver: Product/Founder
- Executor: On‑call engineer (or AI agent under supervision)

## Checklists
### Pre‑Cutover
- [ ] Prod Neon DBs created and reachable
- [ ] `prisma migrate deploy` succeeds on both DBs
- [ ] Seeds confirmed OFF for Production
- [ ] Backups/PITR enabled

### Cutover
- [ ] Vercel Production env vars updated (tenant + provider)
- [ ] Deployments READY
- [ ] Smoke tests pass (tenant + provider)

### Post‑Cutover
- [ ] Announcement posted
- [ ] Monitoring and error alerts clean
- [ ] Staging DB decommission plan scheduled

---

Appendix A — Notes for AI Agents
- Always prefer the machine‑readable runbook (YAML) to orchestrate steps
- Never mutate secrets without explicit user approval
- Never drop data; if a destructive migration is detected, halt and request approval
- After each step, record outcomes in PR/issue notes

