# Archive Idea Harvest (Recovered Chat + Federation Emphasis)

This document distills monetization logic, UX reasoning, federation controls, and rollout philosophy captured from your recovered chats and federation notes, and maps each item to concrete implementation specs inside this binder.

## Monetization Principles
- **Client‑Pays‑First**: Any action that incurs provider cost is gated by prepaid credits or a card on file. API returns `402 PAYMENT_REQUIRED` with a prepay link and price breakdown when insufficient.
- **Selective AI Monetization**: Baseline AI tasks are included; heavy or margin-driving tasks are monetized via work-unit pricing and/or packs.
- **Adoption Discounts (Universal-License Services)**: System-wide price drop of 10% per +10 adopters, capped at 70%; recomputed nightly with tenant notices.
- **Referral = Credits**: Referral rewards are credits usable on metered services; never cash payouts.
- **Grace Minutes**: Optional per-tenant grace window (0–60 minutes) to prevent mid-flow interruptions; audited and billed next cycle.

## Federation & Trials
- Separated **audiences** (`provider`, `tenant`, `portal`) via host routing and JWT `aud` claims.
- **Trial Types**: Marketing vs Operational trials with AI credit packs; provider can pause/extend/convert.
- **Infra Migration Buttons**: Per-tenant upgrade/downgrade with health checks and rollback.
- **Provider Notices**: System-wide announcements surfaced in tenants with read receipts.
- **Accountant Scope & Dual Approval**: Optional provider approval for accountant invites on sensitive tenants.

## UX & Concierge
- **Onboarding Power Strip**: Toggle high-value features with cost preview and owner approval.
- **Guided Journeys**: Contextual, non-blocking tutorials; never prevent work.
- **Eco‑First**: Cheap drafts by default with “Upgrade to Full/Max” options and cost previews.

## Cross-References
- ULAP spec → `20_MODULES/Billing/ULAP_SPEC.md`
- AI Monetization & Agents → `20_MODULES/AI_Monetization/Agents_and_WorkUnits.md`
- AI Power Controls → `20_MODULES/AI_Monetization/AI_PowerControls.md`
- Federation Setup & Trials → `20_MODULES/Federation/SETUP_PROVIDER.md`, `20_MODULES/Federation/Trial_Controls.md`
- Work Orders & Job Tickets → `20_MODULES/WorkOrders_JobTickets.md`
