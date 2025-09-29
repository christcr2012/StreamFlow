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