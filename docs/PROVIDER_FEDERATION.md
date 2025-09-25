# Provider Federation (Cross-Instance Provider Portal)

## What is this?
A simple, opt-in way for a **central Provider Portal** to securely call APIs on many **client instances** of this app (e.g., preview billable leads, create invoice drafts, send Stripe invoices).

- Today: this app is **client-facing**; providers can manage billing per instance.
- Tomorrow: a separate **Provider Portal** aggregates data/actions across all client instances.

## Where is the code?
- Client shim (used by future Provider Portal): `src/lib/providerFederation.ts`
- Request verifier (inside each client instance): `src/lib/providerFederationVerify.ts`
- APIs with federation support (when enabled):
  - `POST /api/billing/invoices.create`
  - `POST /api/integrations/stripe/create-hosted-invoice`
  - `GET  /api/billing/list`
  - `GET  /api/billing/get`
- UI status banner: `src/pages/provider/billing/index.tsx` calls `/api/system/federation.status`.

## Security model
Signed headers over `${METHOD} ${PATH+QUERY} ${TIMESTAMP}`.

**Signature algorithms (env toggle):**
- **Dev default:** `h31:<hex>` (portable hashing; no crypto dependency).
- **Production recommended:** `sha256:<hex>` (HMAC-SHA256).

> **IMPORTANT: Signature mode must match on both sides.**  
> If you enable SHA-256 on the **server** (`PROVIDER_FEDERATION_SIG_SHA256=1`), you must also set `PROVIDER_FEDERATION_SIG_SHA256=1` where the **Provider Portal** runs so the client shim sends `sha256:` signatures. (The UI banner shows the server mode; keep the portal in sync.)

## Enabling federation (client instance)
Add to environment:
