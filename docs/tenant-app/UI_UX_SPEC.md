# UI/UX Specifications

## Navigation & Pages
- /login
- /dashboard
- /customers, /customers/[id]
- /leads, /leads/[id]
- /jobs, /jobs/new, /jobs/[id]
- /invoices, /invoices/new, /invoices/[id]
- /wallet (balance, transactions, payouts)
- /agreements, /agreements/new, /agreements/[id]
- /reports
- /settings (org, team, roles, vertical, notifications)

Left-nav groups: Work (Jobs, Customers), Money (Invoices, Wallet), Agreements, Reports, Settings.

## Component Library
- Tables: server-side pagination/sort/filter; row selection for bulk ops
- Form primitives: Text/Number/Date/Boolean/Select/Multi/FileUpload (react-hook-form + Zod)
- Modals/Drawers: confirm, edit, compose email, photo viewer
- Charts: dynamic import of lightweight charts (visx/chart.js)
- Timeline: vertical stepper with metadata
- Toasts/banners, skeletons, empty states

## Responsive & Mobile
- Mobile-first layouts, card lists instead of tables on small screens
- Touch targets ≥ 44px; sticky action bars; pull-to-refresh
- Offline-friendly job creation + queued photo upload

## Critical User Flows
- Job Creation: customer → schedule/assign → save → job detail
- Invoice Payment: open invoice → accept payment → method → confirm → receipt
- Lead Conversion: select lead → validate → create customer → optional job

## Accessibility (WCAG 2.1 AA)
- Semantic landmarks; labelled controls; aria-describedby for errors
- Keyboard navigation and focus management; skip links; visible focus
- Color contrast; no color-only cues
- Automated checks with Axe + ESLint a11y rules

