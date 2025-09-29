---
type: "always_apply"
---

CRITICAL – System Separation: Enforce strict boundaries so that the Client, Provider, Developer, and Accountant systems are completely separate. The Client portal uses only OWNER/MANAGER/STAFF/EMPLOYEE roles. No PROVIDER or DEVELOPER role may appear in client code. Each portal must have its own UI layout and authentication.

CRITICAL – No Role Mixing: Never mix roles or business logic across systems. For example, client-side code should only reference OWNER, MANAGER, STAFF, EMPLOYEE (and if applicable an ACCOUNTANT role for client finances), and must not reference any provider or developer logic. Provider/developer/accountant code must not include client RBAC.

CRITICAL – Authentication Isolation: Each system uses its own auth mechanism. The Client portal uses a database-driven login tied to RBAC roles. The Provider, Developer, and Accountant portals use environment-based credentials (set via secure environment variables) and do not query the client user DB. For example, use PROVIDER_EMAIL/PROVIDER_PASSWORD for provider login and DEVELOPER_EMAIL/DEVELOPER_PASSWORD for the dev portal.

Data & Tenant Isolation: Implement multi-tenant data separation. Every record and query must include an orgId to isolate tenants. Each system should ideally have its own database or schema; do not allow direct cross-system DB access. Cross-system communication must go through secure API calls only.

Strict Client-Side RBAC: Enforce RBAC only in the client system. Client APIs and UI should enforce permissions for OWNER, MANAGER, STAFF, EMPLOYEE. Do not use PROVIDER/DEVELOPER roles in client-side logic. In provider/developer code, use only simple credential checks, not RBAC.

API Boundary Enforcement: Keep clear API boundaries. The Provider portal calls Client APIs only for needed data (analytics, billing reports); it never calls client user/account APIs. The Client portal never calls provider APIs except for submitting usage or billing info. Do not import code across system boundaries.

Provider-Only Features: All multi-tenant analytics, billing, and pricing features reside in the Provider portal. Do not put billing or cross-organization analytics in the Client UI. The Provider portal should include custom pricing management, invoices, and aggregated dashboards.

Webhook Security: Webhooks must use HMAC signatures. Verify signatures on all incoming webhooks and implement exponential backoff retries on failures.

Backup & Encryption: Encrypt all sensitive data at rest (AES-256-GCM) and manage keys per organization. Backups should be encrypted, sent to multiple storage destinations (local, S3/Azure/GCP), and include integrity checks. Automate backup schedules, retention, and restore tests.

AI Lead Scoring: Implement a hybrid AI scoring system. Classify leads (hot vs warm) with business rules and then apply an AI model for scoring. Enforce cost caps (e.g. a monthly budget) and track usage per org. Provide analytic dashboards for leads in both client (per-org view) and provider (multi-org view).

Secure Federation: Use HMAC-secured APIs for cross-tenant federation between client instances and the provider. Provide an impersonation feature in the Provider/Dev portals for support, with detailed audit logging.

Modular Code: Keep code modular and decoupled by system. Do not mix codebases. Share only utility or library code if truly common (e.g. shared models), but segregate system-specific modules clearly.

CRITICAL — Provider Auth Resilience (break-glass)

Maintain a single emergency Provider admin backed by environment variables (email, password hash, optional TOTP).

If the database is unreachable, the Provider portal automatically enters Recovery Mode and accepts only this emergency admin.

Recovery Mode must:

Be visibly indicated (banner + logs).

Restrict capabilities to operational tasks (no tenant data mutations).

Expire sessions quickly and force re-auth when DB returns.

CRITICAL — Primary vs Secondary secrets

Primary (mutable) Provider settings (emails, hashes, 2FA seeds, AI budgets, etc.) live in an encrypted DB table and are editable in the Provider UI (with audit logs).

Secondary (immutable at runtime) break-glass creds live in Vercel env vars and are not editable from the UI. Rotation is an ops process (redeploy).

Optional — External config mirror

Keep a read-only mirror of minimal Provider allow-list/flags in an independent store (encrypted JSON in object storage or KV). Load at boot for degraded mode awareness; update via ops scripts only.

Mandatory — Strong authentication

Provider passwords are bcrypt/argon2 hashes, never plaintext.

TOTP 2FA is required for break-glass logins.

All recovery-mode logins and actions are audited.

Why this works

No DB dependency to get back in: break-glass creds are available even if Neon is down.

No unsafe runtime env editing: you avoid trying to mutate Vercel env vars from inside the app.

Clear guardrails: recovery mode is locked down, auditable, and temporary.

Least privilege: normal operations stay DB-backed and fully auditable; the env path is only for emergencies.