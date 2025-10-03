# Provider-Side Setup (Vercel + Neon)

1) Create a new Vercel project for **provider** UI/API using the same repo; set domain `provider.<rootdomain>`.
2) Tenant/Portal project uses wildcards: `*.tenant.<rootdomain>`, `*.portal.<rootdomain>`.
3) Environment:
   - `JWT_AUDIENCES=provider,tenant,portal`
   - `AUTH_ISSUER=<auth issuer>`
   - `DATABASE_URL=<neon connection>`
4) Middleware routes host → audience and enforces `aud` on JWTs.
5) Run migrations (ULAP, trials, audit_log, domains).
6) Smoke: `POST /provider/tenants` then visit generated subdomain.
7) Onboarding: optional custom domain with TXT verify then CNAME cutover.
