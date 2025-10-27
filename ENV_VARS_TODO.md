# Environment Variables TODO (Dev/Preview/Production)

This document lists environment variables still needed in hosted environments (Vercel Production/Preview) and any gaps not covered by project files. The repo already contains development values in `.env` / `.env.local` for local use.

## Provider Portal (apps/provider-portal)

Required on Vercel:
- DATABASE_URL = PostgreSQL URL (Neon, pooled) — CRITICAL for build and runtime
- DIRECT_DATABASE_URL = PostgreSQL URL (Neon, direct/non-pooled) — used by Prisma Migrate
- NEXTAUTH_SECRET = random 32+ char secret (if NextAuth/session features enabled)
- NEXTAUTH_URL = https://provider.<your-domain> (if NextAuth is used)

Status:
- Local: DATABASE_URL present in repo `.env` (used by build helper)
- Vercel: Add DATABASE_URL and DIRECT_DATABASE_URL via CLI (see scripts below)

## Tenant App (apps/tenant-app)

Communications (SMS/Email):
- TWILIO_ACCOUNT_SID — required for SMS sending
- TWILIO_AUTH_TOKEN — required for SMS sending
- TWILIO_FROM_NUMBER — required for outbound SMS
- RESEND_API_KEY — required for outbound email
- RESEND_FROM_EMAIL — optional default from address (fallback: noreply@cortiware.com)

Auth (if applicable):
- NEXTAUTH_SECRET — required if using NextAuth
- NEXTAUTH_URL — e.g., https://app.<your-domain>

Status:
- Local: Twilio values are present in `.env.local`; set Resend key if not already.
- Vercel: Add Twilio + Resend keys for Production/Preview when enabling Communications in cloud.

## Marketing Sites (apps/marketing-*)

- STRIPE_SECRET_KEY (optional) — for live pricing; otherwise fallback pricing is used

## Shared/Services

- REDIS_URL (optional) — for BullMQ/queues if enabled
- OPENAI_API_KEY (if AI features call OpenAI from server)

## How to push env to Vercel (one-time link + scripted add)

1) Login and link project once:
   - npx vercel login
   - cd apps/provider-portal && npx vercel link

2) Push DB URLs from repo `.env` to Vercel (production + preview):
   - cd <repo-root>
   - npm run vercel:env:provider-db  # DATABASE_URL
   - vercel env add DIRECT_DATABASE_URL production
   - vercel env add DIRECT_DATABASE_URL preview

3) Add Communications keys (when ready to send from cloud):
   - vercel env add TWILIO_ACCOUNT_SID production
   - vercel env add TWILIO_AUTH_TOKEN production
   - vercel env add TWILIO_FROM_NUMBER production
   - vercel env add RESEND_API_KEY production
   - vercel env add RESEND_FROM_EMAIL production (optional)
   - repeat for preview

Notes:
- The helper script never prints secrets and reads from `.env`/`.env.local`.
- For dev/test, the database can be reset safely (already automated here).
