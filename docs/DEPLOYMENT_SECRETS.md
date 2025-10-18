# Deployment Secrets

Source of truth: Vercel project environment variables (Team: Robinson AI Systems)

Apps
- Tenant App (cortiware-tenant-app)
  - AUTH_TICKET_HMAC_SECRET 0B+ random
  - TENANT_COOKIE_SECRET 0B+ random
  - EMERGENCY_LOGIN_ENABLED true|false
  - PROVIDER_ADMIN_PASSWORD_HASH bcrypt hash (rounds=10)
  - DEVELOPER_ADMIN_PASSWORD_HASH bcrypt hash (rounds=10)
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY public
  - STRIPE_SECRET_KEY server key (if using provider-owned fallback)
- Provider Portal (cortiware-provider-portal)
  - AUTH_TICKET_HMAC_SECRET must match tenant app
  - (Provider billing keys if applicable)

Rotation runbook
1) Generate new values (PowerShell or Node) and rotate in Vercel via CLI
2) For password hashes: `node -e "const b=require('bcryptjs'); console.log(b.hashSync('<new>',10))" | vercel env add PROVIDER_ADMIN_PASSWORD_HASH <env>`
3) Repeat for DEVELOPER_ADMIN_PASSWORD_HASH; set across development/preview/production
4) For HMAC/cookie secrets: generate 64-byte random hex and set
5) Redeploy affected apps (Prod requires manual redeploy to pick up immediately)

Validation
- `vercel env ls` from each app directory
- Tenant emergency login smoke (only when enabled): /login  emergency path

