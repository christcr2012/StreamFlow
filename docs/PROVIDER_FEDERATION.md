# Provider Federation (Cross-Instance Provider Portal)

## What is this?
A simple, opt-in way for a **central Provider Portal** to securely call APIs on many **client instances** of this app (e.g., preview billable leads, create invoice drafts, send Stripe invoices).

- Today: this app is **client-facing**; providers can manage billing per instance.
- Tomorrow: a separate **Provider Portal** aggregates data/actions across all client instances.

## Where is the code?
- **Provider Billing System**: `src/lib/provider-billing.ts` - Core provider revenue collection
- **Client Federation Shim**: `src/lib/providerFederation.ts` - Used by future Provider Portal
- **Request Verifier**: `src/lib/providerFederationVerify.ts` - Inside each client instance
- **Provider Billing APIs**:
  - `GET/POST /api/provider/billing/revenue` - Calculate and generate provider invoices
  - `GET/POST/PUT/DELETE /api/provider/billing/subscriptions` - Manage client subscriptions
  - `POST /api/webhooks/provider-stripe` - Handle provider Stripe webhook events
- **Client Billing APIs** (with federation support):
  - `POST /api/billing/invoices.create` - Client invoices their customers
  - `POST /api/integrations/stripe/create-hosted-invoice` - Client Stripe integration
  - `GET  /api/billing/list` - List client invoices
  - `GET  /api/billing/get` - Get specific client invoice
- **UI Components**:
  - `src/pages/provider/billing/index.tsx` - Provider billing dashboard
  - Federation status banner calls `/api/system/federation.status`

## 🏢 Dual Stripe Architecture

StreamFlow implements a sophisticated dual Stripe architecture to separate provider revenue from client revenue:

### **Provider Stripe Account (YOUR Revenue)**
- **Purpose**: Collect subscription fees from clients who use StreamFlow
- **Revenue Models**:
  - **BASE Plan**: Free tier (limited features)
  - **PRO Plan**: $97/month (standard features)
  - **ELITE Plan**: $297/month (premium features)
  - **Per-Lead Billing**: $100 per converted lead
  - **AI Usage**: Cost pass-through with monthly caps
- **Environment Variables**:
  ```bash
  PROVIDER_STRIPE_SECRET_KEY=sk_your_provider_stripe_key
  PROVIDER_STRIPE_PUBLISHABLE_KEY=pk_your_provider_stripe_key
  PROVIDER_STRIPE_WEBHOOK_SECRET=whsec_your_provider_webhook
  PROVIDER_STRIPE_BASE_PRICE_ID=price_your_base_plan
  PROVIDER_STRIPE_PRO_PRICE_ID=price_your_pro_plan
  PROVIDER_STRIPE_ELITE_PRICE_ID=price_your_elite_plan
  ```

### **Client Stripe Account (Client Revenue)**
- **Purpose**: Each client bills their own customers using their Stripe account
- **Use Cases**: Service invoices, project billing, customer payments
- **Environment Variables** (per client instance):
  ```bash
  STRIPE_SECRET_KEY=sk_client_stripe_key
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_client_stripe_key
  STRIPE_WEBHOOK_SECRET=whsec_client_webhook
  ```

### **Federation Integration**
- Provider Portal can aggregate billing data across all client instances
- Cross-instance revenue reporting and analytics
- Centralized subscription management for all clients
- Secure provider-to-provider API calls with signature verification

## Security model
Signed headers over `${METHOD} ${PATH+QUERY} ${TIMESTAMP}`.

**Signature algorithms (env toggle):**
- **Dev default:** `h31:<hex>` (portable hashing; no crypto dependency).
- **Production recommended:** `sha256:<hex>` (HMAC-SHA256).

> **IMPORTANT: Signature mode must match on both sides.**  
> If you enable SHA-256 on the **server** (`PROVIDER_FEDERATION_SIG_SHA256=1`), you must also set `PROVIDER_FEDERATION_SIG_SHA256=1` where the **Provider Portal** runs so the client shim sends `sha256:` signatures. (The UI banner shows the server mode; keep the portal in sync.)

## Enabling federation (client instance)
Add to environment:
