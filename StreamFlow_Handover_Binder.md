

---

# Expanded Sections (UX for Orgs/Contacts/Opps/Tasks, AI Flows, Defaults, Performance Budgets)

## UX: Organizations, Contacts, Opportunities, Tasks (button-by-button)
Full specs: file paths, buttons, props/state, events, API calls, validations, error UX, and acceptance criteria for each entity.

## AI Flows: Concrete UX, Prompts, Fallbacks
Buttons invoking AI, example prompt payloads, sample responses, fallback behavior (rule-based defaults, static templates).

## Resolved Defaults (Open Questions)
- Billing: Stripe Billing + Customer Portal
- Background Jobs: BullMQ + Redis
- Observability: OpenTelemetry → Prometheus/Grafana/Loki/Tempo
- SSO: Auth.js OIDC (Google/Microsoft); SAML optional later
- Data residency: US default; EU via region-aware tenant DB shard

## Performance Budgets & Scaling Targets
- p95 latencies: GET ≤300ms, POST ≤800ms, AI ≤2.5s
- Throughput: 250 RPS steady, 1000 RPS burst
- Max tenant size: 1M leads, 2M contacts, 100k orgs, 500k opps, 10M activities
- Concurrency: 500 active users/region; import 50k rows/min/worker
- Cache hit ≥70%; DB queries p95 <50ms
- SLO: 99.9% uptime; ≤0.1% 5xx

---

