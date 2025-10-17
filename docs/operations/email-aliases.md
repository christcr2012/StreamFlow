# Email Aliases: Catalog, Usage, and Routing (Robinson AI Systems)

Purpose: Provide a single source of truth for business email addresses so any engineer/agent can correctly wire forms, notifications, and contacts across products and sites.

Active domain: robinsonaisystems.com
Future domain: cortiware.com (mirror this catalog when provisioned)

## Core (RFC/industry-standard)
- postmaster@robinsonaisystems.com — deliverability contact; DMARC/RFC compliance
- abuse@robinsonaisystems.com — abuse, phishing, spam complaints
- webmaster@robinsonaisystems.com — website technical contact
- security@robinsonaisystems.com — vulnerability disclosure / security reports
- privacy@robinsonaisystems.com — privacy requests, DSR/DSAR

## Business operations
- hello@robinsonaisystems.com — general inquiries; default site “Contact”
- sales@robinsonaisystems.com — pricing, demos, enterprise inquiries
- support@robinsonaisystems.com — customer support
- billing@robinsonaisystems.com — invoices, AR/AP
- legal@robinsonaisystems.com — contracts, DPA/NDA
- partnerships@robinsonaisystems.com — alliances/integrations (alias: partners@ → partnerships@)
- press@robinsonaisystems.com — PR/media (alias: media@ → press@)
- careers@robinsonaisystems.com — recruiting (alias: jobs@ → careers@)

## Technical/transactional (create as needed)
- no-reply@robinsonaisystems.com — transactional outbound only; do not receive
- notifications@robinsonaisystems.com — system notifications
- developers@robinsonaisystems.com — developer relations/community
- compliance@robinsonaisystems.com — compliance & audit notices
- admin@robinsonaisystems.com — internal admin notices (restricted)

## Routing recommendations (Google Workspace)
- Prefer Google Groups for shared addresses (sales, support, privacy, security) → multiple owners, shared inbox
- Enable “Send mail as” for key roles (sales, support) for consistent outbound
- DMARC: rua/ruf to postmaster@ or a shared deliverability mailbox; rotate and monitor
- DKIM: one selector per domain; rotate yearly or per policy
- SPF: include current sending providers; avoid excessive includes; keep <10 DNS lookups

## Usage map by site/section (current state)
Robinson company site (apps/marketing-robinson):
- Global contact: hello@
- Sales/pricing/enterprise CTAs: sales@
- Support docs/links: support@
- Security & Compliance page: security@
- Privacy Policy page: privacy@
- Terms/Legal mentions: legal@
- Press/Media page or footer link: press@
- Careers page: careers@
- Footer technical contact: webmaster@, postmaster@ (not prominent; footer/legal area)

Cortiware product site (apps/marketing-cortiware):
- Until cortiware.com is live: avoid displaying domain-specific emails. Use forms that route to sales@/support@ on robinsonaisystems.com.
- Once cortiware.com is active, mirror this entire catalog on cortiware.com and update visible addresses accordingly.

## Developer guidance
- Centralize display strings in a config module per app (e.g., config/contacts.ts) to avoid hardcoding in components.
- Prefer forms over raw mailto: for analytics, spam control, and flexibility. Server actions should forward to the correct Group.
- Keep addresses in environment or config for easy swap when cortiware.com is provisioned.

## Change control
- Treat aliases and routing as infra: PR + approval for changes. Update this doc in the same PR.
- Document who receives each Group and escalation paths in an internal runbook if needed.

