# Tenant App Planning & Design Docs

This folder contains the production-ready planning and design documentation for the Tenant App (client-facing multi-tenant SaaS for service contractors).

Documents:
- EXECUTIVE_SUMMARY.md — high-level overview and goals
- SYSTEM_ARCHITECTURE.md — features, DB schema deltas, API specs, state management, real-time
- UI_UX_SPEC.md — navigation, components, responsive/mobile, flows, accessibility
- FEATURE_ROADMAP.md — MVP scope, phases, dependencies, risks
- TECHNICAL_SPEC.md — file structure, data fetching, validation, testing, performance
- MULTI_VERTICAL_STRATEGY.md — configuration-driven vertical support (18 verticals)
- INTEGRATIONS.md — wallet, agreements, routing, notifications, Provider Portal API touchpoints

Conventions:
- Next.js App Router, server-first data, strict TypeScript
- Zod validation end-to-end; RBAC route gating
- Mobile-first, WCAG 2.1 AA
- Reuse @cortiware/* packages to the maximum extent

