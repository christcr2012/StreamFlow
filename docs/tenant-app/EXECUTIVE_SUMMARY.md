# Executive Summary

We will transform the Tenant App from a minimal shell into a production-grade, mobile-first, multi-tenant SaaS for service contractors, supporting Tenant/Accountant/Vendor personas and 18 verticals. We leverage the monorepo (Turborepo), shared packages (@cortiware/*), and the Provider Portal’s mature backend primitives (auth, RBAC, wallet, agreements).

Key tenets:
- Ship Core MVP (Jobs, Customers, Invoices, Payments, Wallet, Agreements, Dashboard) rapidly
- Server-first architecture (RSC + Server Actions), SSE for real-time
- Configuration-driven vertical support (forms, workflows, templates) without code forks
- Strict TypeScript + Zod; WCAG 2.1 AA; mobile-first, field-friendly UX
- Holistic testing (unit/integration/E2E) and performance plan (code split, cache, stream)

Phases:
- Phase 1 (MVP): Dashboard, Customers, Jobs, Invoices/Payments, Wallet, Agreements, Settings, SSE
- Phase 2 (Enhanced): Reporting, bulk ops, advanced filtering, richer timeline/notifications
- Phase 3 (Advanced): Offline queues, route optimization, vendor collaboration, renewals automation

