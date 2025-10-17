# Email Aliases Directory (Robinson AI Systems)

Owner: robinsonaisystems.com (active). Note: cortiware.com to be set up later and will mirror this plan.

Purpose: Central, AI-friendly reference of which aliases exist (or will exist), how they’re used across the business and websites, and how they should route. Industry norms are prioritized to avoid confusion.

Status: Approved by owner. Creation of aliases will occur later; this file documents the plan and intended usage now.

---

## RFC/Infrastructure Recommended
- postmaster@robinsonaisystems.com
  - Purpose: Delivery/infra contact required by some providers; DMARC/SMTP issues
  - Routing: Ops/owner inbox or shared "Operations" group
- abuse@robinsonaisystems.com
  - Purpose: Abuse reports; required by some providers and spam authorities
  - Routing: Ops/owner inbox or shared "Operations" group
- webmaster@robinsonaisystems.com
  - Purpose: Website operational contact; downtime, broken pages
  - Routing: Web/ops group or owner inbox

## Privacy/Security
- security@robinsonaisystems.com
  - Purpose: Security disclosures, vulnerability reports (VDP)
  - Shown on: Company site Security page, footer; legal pages
  - Routing: Founders + ops group; ensure prompt triage
- privacy@robinsonaisystems.com
  - Purpose: Privacy inquiries, data subject requests (DSAR), DPA
  - Shown on: Privacy Policy page; footer
  - Routing: Legal/privacy group or owner inbox

## Business Operations
- hello@robinsonaisystems.com
  - Purpose: General inquiries (default "Contact" endpoint)
  - Shown on: Contact pages/site footers by default
  - Routing: Shared "General Inquiries" group
- sales@robinsonaisystems.com
  - Purpose: Sales/demo/pricing requests
  - Shown on: Pricing pages, enterprise CTAs
  - Routing: Sales group (can be owner initially)
- support@robinsonaisystems.com
  - Purpose: Customer support/help
  - Shown on: Support/help links; contact page
  - Routing: Support group (owner initially); can evolve to helpdesk
- billing@robinsonaisystems.com
  - Purpose: Invoices, AR/AP, receipts
  - Shown on: Billing/terms sections; footer
  - Routing: Finance/billing group
- legal@robinsonaisystems.com (optional now)
  - Purpose: Contracts, NDAs, legal notices
  - Routing: Legal group or owner inbox
- partnerships@robinsonaisystems.com (aka partners@)
  - Purpose: Alliances, partner ecosystem
  - Routing: Partnerships/BD group
- press@robinsonaisystems.com (aka media@)
  - Purpose: Press/PR inquiries
  - Routing: PR/owner inbox

## Technical/Transactional (create when needed)
- no-reply@robinsonaisystems.com
  - Purpose: Transactional sends only; not for inbound
  - Note: Prefer reply-capable addresses when possible
- notifications@robinsonaisystems.com
  - Purpose: System/notification emails
  - Routing: Typically out-bound only; monitor for bounces
- developers@ or devrel@robinsonaisystems.com
  - Purpose: Developer relations/API program (future)

---

## Website Usage Guidance

- Company site (Robinson):
  - Contact CTA → hello@ by default
  - Sales CTAs (pricing/enterprise) → sales@
  - Security page and footer → security@
  - Privacy Policy → privacy@
  - Legal/Terms footers → legal@ (optional) and/or privacy@
  - Website ops link → webmaster@

- Product site (Cortiware):
  - Will mirror above once @cortiware.com is live
  - Until then, link to robinsonaisystems.com equivalents (e.g., hello@robinsonaisystems.com)

## Routing & Admin Notes
- Use Google Groups for shared addresses (sales, support, privacy, security) so multiple team members can triage
- Configure "Send mail as" for key roles (sales, support) on relevant users
- DKIM/DMARC: ensure policy reports go to monitored address (postmaster@)
- Avoid using no-reply@ for customer-facing flows unless absolutely necessary

## Future: cortiware.com
- Mirror aliases: hello@, sales@, support@, billing@, privacy@, security@, webmaster@, postmaster@, abuse@
- Update app links when domain is live; keep this document as the source of truth

---

Change log
- 2025-10-17: Initial alias directory created (approved by owner; to be provisioned later)

