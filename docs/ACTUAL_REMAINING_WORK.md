# ACTUAL_REMAINING_WORK (auto-generated)

## Now
- #61 Deployment secrets (Option C) – complete required secrets for auth flows
- #60 M2 Phase 6 – Fix TypeScript build blockers for Vercel
- #53 Backlog migration tracker: convert docs + TODOs into GitHub Issues
- #51 Retire legacy federation env toggles and docs (standardize on FED_ENABLED/FED_OIDC_ENABLED)
- #47 Provider Portal UX: Make navigation and labels intuitive for first-time users

## Next
- #76 Tenant auth – RefreshToken model or logout refactor
- #75 Provider DB guardrail – verify Prisma migrate status in CI
- #74 Performance monitoring guardrails: thresholds, baseline capture policy, retention
- #73 Pricing Admin – Enforce super admin role check
- #72 Pricing Admin – History viewer UI
- #71 Pricing Admin – Plan editor UI (/provider/admin/pricing/new, /[id]/edit)
- #68 Import Wizard – verify deployment status, add smoke test and docs
- #67 SAM.gov integration – verify E2E; seed test tenant; smoke tests
- #66 _disabled endpoints inventory → per-route decisions and archiving
- #64 Enable Stripe webhook (basic) + smoke test
- #63 Standardize federation flags – retire legacy PROVIDER_FEDERATION_*; use FED_*
- #62 Decide which disabled features to enable next
- #57 Documentation cleanup + binder archival (mark reference-only, index active vs archived)
- #54 Theme follow-ups – WCAG AA tune + increase variety
- #52 Enable Stripe webhook (basic) via Vercel env + smoke test
- #50 Decide which disabled features to enable next
- #48 Deployment secrets (Option C): finalize required secrets via Vercel CLI

## Later
- #69 Agreement models – DB schema, API, UI per TODO_AGREEMENT_MODELS.md
- #65 Stripe Connect – enablement plan or keep disabled
- #56 Code TODOs sweep – security/federation/metrics
- #55 API v2 endpoints – design and implement (leads, opportunities, organizations)
- #43 Epic: Single-tenant Provider/Developer Portals (tenant-app)
- #42 Docs: Emergency Toolkit usage guide for single-tenant Provider/Developer portals
- #41 Tests: E2E flows for emergency Provider/Developer portals in tenant-app
- #40 Portals UX: Error states (403/429/SSO-down) and consistent loading patterns
- #39 Emergency Toolkit MVP (Developer): Webhooks configuration and logs (read-only)
- #38 Emergency Toolkit MVP (Developer): API keys (read-only)
- #37 Emergency Toolkit MVP (Provider): Audit trail (read-only)
- #36 Emergency Toolkit MVP (Provider): User lookup + MFA reset
- #35 Emergency Toolkit MVP (Provider): Tenant overview (read-only)
- #34 Portals: Define permissions/entitlements for single-tenant Provider/Developer areas
- #33 tenant-app: Build /developer area shell (layout, nav, banner, placeholder routes)
- #32 tenant-app: Build /provider area shell (layout, nav, banner, placeholder routes)
- #31 Portals IA: Information architecture and navigation for single-tenant Provider/Developer areas (tenant-app)
- #30 Epic: Option C Per-App Auth (Unified login per app + shared auth-service)
- #29 Phase 2: Implement refresh token model with short-lived app cookies
- #28 Phase 2: Replace in-memory nonce store with Redis/KV for replay protection
- #10 [Federation] Optional scheduled E2E smoke (staging)
- #9 [Federation] Extend .env.example + docs for OIDC configuration
- #8 [Federation] Update contracts + E2E after services return 200
- #7 [Federation] OIDC readiness & cutover (providers/dev)
- #6 [Federation] Audit logging persistence
- #5 [Federation] Entitlements model & enforcement (+403 coverage)
- #4 [Federation] Implement Durable Idempotency Store
- #3 [Federation] Implement Rate Limiter backend (KV/Redis/Upstash)
- #2 [Federation] Implement DeveloperFederationService (Diagnostics)
- #1 [Federation] Implement ProviderFederationService (Prisma)

## Blocked
