# System Architecture

## Feature Breakdown (Client-Facing)
- Auth & Session: multi-persona (Tenant/Accountant/Vendor), RBAC route gating
- Dashboard: KPIs (pipeline, revenue, AR aging), activity, notifications
- Customers & Leads: directory, capture, convert-to-customer, tags/notes
- Jobs: CRUD, status workflow, assignments, photos, geo, notes, timeline
- Invoices & Payments: invoice builder, statuses, collections, receipts, reminders
- Wallet: balance, transactions, payouts, fee breakdown, reports
- Agreements: templates, builder, digital signature, renewals
- Reporting: revenue trends, job outcomes, CLV, exports
- Settings: org profile, team & roles, vertical config, notifications

## Database Schema Deltas (Illustrative)
- Customer: contacts[], tags[], billing settings
- Job: customerId, title, description, status, scheduledAt, location{lat,lng}, assignees[], photos[], timeline[]
- JobPhoto: jobId, url, metadata, takenAt, takenBy
- Lead: source, fields (custom), convertedToCustomerId
- Invoice/InvoiceLine: lines, taxes, discounts; status, dueDate, totals
- Payment: invoiceId, amount, method, status, receivedAt
- WalletTransaction: ensure orgId+createdAt, type indexes
- Agreement/AgreementTemplate: template linkage, mergeFields, renewalAt
- Activity/Audit: normalized timeline events per entity

Indexes: Job(orgId+status+scheduledAt), Invoice(orgId+status+dueDate), Payment(orgId+receivedAt), Customer(orgId+name), Agreement(orgId+status+renewalAt)

## API Specifications (Tenant-Scoped)
- GET /api/customers?query=&page=&tag= → {items, page, total}
- POST /api/customers {name, contacts, tags, billing} → {id}
- GET /api/jobs?status=&from=&to=&customerId= → {items, page, total}
- POST /api/jobs {title, customerId, scheduledAt, location, assignees} → {id}
- POST /api/jobs/[id]/status {status, note?} → {ok}
- POST /api/jobs/[id]/photos {file, takenAt, metadata} → {url}
- GET /api/invoices?status=&customerId= → {items, page, total}
- POST /api/invoices {customerId, lines[], taxes[], terms} → {id}
- POST /api/invoices/[id]/payments {amount, method} → {paymentId}
- GET /api/wallet/transactions?from=&to=&type= → {items, balance}
- GET /api/agreements?customerId= → {items}
- POST /api/agreements {templateId, customerId, variables} → {id, signUrl}
- GET /api/sse → event stream(job.updated, invoice.status, payment.received, agreement.renewal)

Validation: Zod schemas on all inputs/outputs; org- and role-scoped.

## State Management
- Server-first data via RSC
- Mutations via Server Actions; fallback POST handlers
- Client interactivity: SWR/TanStack where low-latency needed
- Revalidation via tags on mutation

## Real-Time (SSE)
- Single SSE connection per tab: /api/sse (org-scoped)
- Events: job.updated, job.photo.added, invoice.status, payment.received, agreement.renewal, notification.new
- Client hook manages subscribe/reconnect; optimistic UI + server revalidation

```mermaid
flowchart LR
  UI -->|fetch (RSC)| API
  UI <-->|SSE| Realtime
  API --> DB[(Prisma)]
  API --> Wallet((Wallet))
  API --> Agreements((Agreements))
  API --> Email((SendGrid))
```

