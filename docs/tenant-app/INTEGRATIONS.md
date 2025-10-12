# Integration Points

## Provider Portal APIs
- Prefer tenant-scoped APIs for clear boundaries; reuse domain logic via packages
- Reference patterns from Provider Portal for RBAC, custom fields, agreements

## Wallet Integration
- Payments create WalletTransaction via @cortiware/wallet; update balances and ledgers

## Agreements Engine
- Use @cortiware/agreements to merge templates + variables; return sign URL; webhook flips status

## Routing Engine (Field Optimization)
- Phase 3: submit day’s jobs (locations) → optimized route; mobile-first map/step order

## Notifications (Email/SMS)
- SendGrid templates for invoices, payments, job reminders
- Webhooks update timelines; errors surfaced to user

## Real-Time Updates
- SSE events propagate core changes to UI; single connection per tab

