# Feature Implementation Roadmap

## MVP (Phase 1: Core)
- Dashboard KPIs + activity
- Customers CRUD + search + tags
- Jobs CRUD + status workflow + assignments + basic photos
- Invoices CRUD + payments + receipts
- Wallet balance + transactions
- Agreements: templates list, generate agreement, sign URL
- SSE: job.updated, invoice.status, payment.received
- Settings: org profile, team list, vertical selection
- Auth/RBAC enforcement

Dependencies: Customers → Jobs/Invoices; Jobs → Invoices?; Templates → Agreements; Wallet → Payments.

Complexity (S/M/L): Customers(M), Jobs(L), Invoices&Payments(L), Wallet(M), Dashboard(M), Agreements(M), SSE(M), Settings(S)

Risks & Mitigations:
- Optimistic updates vs server truth → always revalidate post-mutation
- Mobile photo uploads → chunking/compression, progress UI
- Vertical variance → config-first forms + custom fields

## Phase 2: Enhanced
- Reporting suite (revenue trends, AR aging, CLV)
- Bulk operations (email, status updates)
- Advanced filtering/persistence
- Rich timeline and notifications

## Phase 3: Advanced
- Offline-first queues (jobs/photos)
- Route optimization integration
- Vendor collaboration features
- Agreement renewals automation

