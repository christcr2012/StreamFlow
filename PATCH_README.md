# Mountain Vista — Patch 001 (Safe Extend on Existing Repo)

This patch **adds** code and **replaces** a few files to align your current repo with the full plan.
It keeps you on **Next.js Pages Router** for now (safer), with clear upgrade path to App Router later.

## What this patch does
- Upgrades **Prisma schema** to include Org/User/Lead/Customer/Opportunity/RFP/Invoice/Payment/Ledger/AuditLog, etc.
- Adds a **Prisma singleton** to avoid hot‑reload issues.
- Implements **/api/leads** (POST create with dedupe + simple AI score; GET list).
- Adds **/api/packs/purchase** (Stripe Checkout) and **/api/webhooks/stripe** (Stripe webhook).
- Updates **.env.example** and **package.json scripts** guidance.
- Provides a **seed script** for initial Org + feature flags (**LSA=false, Uplead=false**) and geo priority (**Sterling, Greeley**).

---

## Merge Steps (do these carefully, in order)

1) **Backup** your repo (optional but recommended).
   - Zip your current project folder before changes.

2) **Copy files from this patch** into your project (drag & drop, allow replace when noted):

```
prisma/schema.prisma                           (REPLACE)
src/lib/prisma.ts                               (NEW)
src/pages/api/leads.ts                          (REPLACE if exists)
src/pages/api/packs/purchase.ts                 (NEW)
src/pages/api/webhooks/stripe.ts                (NEW)
scripts/seed.ts                                 (NEW)
.env.example                                    (REPLACE)
PATCH_NOTES.md                                  (NEW, optional)
```

3) **Install deps** (from your project folder):
```
npm install stripe @prisma/client prisma zod
# (You already have most of these; npm will skip duplicates.)
```

4) **Set environment variables** (edit `.env` on your machine and in Vercel Project Settings → Environment Variables):
```
# Neon (use pooled/pgbouncer URL)
DATABASE_URL="postgresql://USER:PASS@HOST/db?sslmode=require&pgbouncer=true&connect_timeout=10"
# App
APP_URL="http://localhost:3000"   # change to your prod domain on Vercel later
# Stripe
STRIPE_SECRET_KEY="sk_live_or_test_key"
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_or_test_key"
```

5) **Generate client & run migrations/seed**:
```
npx prisma generate
npx prisma migrate dev --name init_mv  # In dev
node scripts/seed.ts
```

> On Vercel: prefer `prisma migrate deploy` during build. In `package.json` build script, use:
> `prisma migrate deploy && next build`

6) **Run locally**:
```
npm run dev
```

7) **Stripe webhook (local dev)**:
- In one terminal: `npm run dev`
- In another: 
```
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/webhooks/stripe
```
- Copy the printed `whsec_...` into your `.env` as `STRIPE_WEBHOOK_SECRET` and restart dev server.

8) **Test the flow**:
- Visit `/api/leads` (GET) to see an empty list.
- POST a lead with Postman or curl to `/api/leads` (JSON body in the file comments).
- Create a pack checkout session via `POST /api/packs/purchase` (see file comments) → you’ll get a Stripe URL.

If anything fails, open `PATCH_NOTES.md` and copy any error text; I’ll fix fast.

---

## FAQ
- **Why pages router now?** Your repo already uses it. This avoids a big migration today.
- **Can we move to App Router later?** Yes—incrementally (routes + layouts). Nothing here blocks that.
- **Why pooled Neon connection?** Serverless + Prisma works best with PgBouncer pooling.

