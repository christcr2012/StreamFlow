# Stripe Webhook – Tenant App

Purpose
- Receive Stripe events for tenant-owned Stripe accounts
- Verify signatures using per-tenant webhook secret stored in the Org record (encrypted)

Endpoint
- Path: apps/tenant-app/src/app/api/webhooks/stripe/route.ts
- Runtime: Node.js (crypto required)
- Verification: Stripe.webhooks.constructEvent(rawBody, signature, decryptedSecret)

Config
- turbo.json declares STRIPE_WEBHOOK_SECRET as global env for caching, but this app resolves the secret per-tenant from DB
- Org table field: stripeWebhookSecret (encrypted); decrypted at runtime

How to test (Preview/Dev)
1) Deploy Preview build
2) Stripe CLI: `stripe listen --forward-to https://<preview>.vercel.app/api/webhooks/stripe`
   - Note: Use a test secret and set it on the tenant Org row
3) Trigger: `stripe trigger payment_intent.succeeded`

Local smoke (unit)
- tests/unit/stripe.webhook.verify.test.ts validates constructEvent and bad signature rejection

Operational Notes
- If signature mismatch: 400 with `Invalid signature`
- If orgId missing or mismatched after verification: 400
- Logging kept concise to avoid leaking sensitive payloads

