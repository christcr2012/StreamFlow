---
type: "always_apply"
description: "Example description"
---

Here’s a battle-tested pattern that keeps Provider auth not dependent on the DB, while still letting you manage credentials from the app when everything’s healthy.

Recommended pattern: Dual-layer “break-glass” auth
1) Primary (normal mode) — encrypted config in DB

Provider creds & settings live in an encrypted ProviderSettings table (email(s), password hash, 2FA seed, etc.).

Editable from the Provider portal.

Every change is audited.

2) Secondary (resilience mode) — environment “break-glass” admin

Keep a single emergency admin account in Vercel env vars:

PROVIDER_ADMIN_EMAIL

PROVIDER_ADMIN_PASSWORD_HASH (bcrypt/argon2 — never plaintext)

PROVIDER_ADMIN_TOTP_SECRET (optional but strongly recommended)

Login flow logic:

Try normal DB-backed auth.

If DB is unavailable or errors, auto-switch to resilience mode and allow login only with the emergency env-backed credentials.

After login in resilience mode:

Show a big “RECOVERY MODE” banner.

Limit actions to ops tasks (DB health checks, rotate secrets, trigger maintenance, read logs from provider services, failover pointers).

Disable any actions that mutate tenant data (because DB isn’t healthy).

When DB recovers, prompt the Provider to sign back in via primary auth; resilience session auto-expires.

This gives you runtime access without the database, but keeps the blast radius small and auditable.

Optional upgrades (pick any that fit)
A) External config mirror (non-DB)

Maintain a read-only mirror of critical Provider settings in a second, independent store (choose one that’s easy for you):

A small encrypted JSON object on S3/Blob storage (fetched at boot, cached in memory).

A KV store (e.g., Upstash/Vercel KV/Redis) used only for minimal Provider control flags and whitelisted emails.

A secrets manager (AWS/GCP/Azure) for only the emergency account.

How to use it:
On startup, load the mirror; if DB is down, you still know which email(s) can log in and that the app is in recovery mode. Do not write to this mirror from the Provider UI; update it only via ops scripts to keep it stable.

B) “Recovery token” login

Issue a time-boxed, single-use recovery token (generated offline by you, signed with a server env key). If both DB and env creds are out of sync, this token lets the Provider access recovery mode and reconfigure.

C) Mandatory 2FA in recovery

Require TOTP (from PROVIDER_ADMIN_TOTP_SECRET) when logging in with break-glass creds. It meaningfully reduces risk if env vars ever leak.

Minimal implementation sketch

Env vars (Vercel):

PROVIDER_ADMIN_EMAIL=ops@yourdomain.com
PROVIDER_ADMIN_PASSWORD_HASH=$argon2id$...
PROVIDER_ADMIN_TOTP_SECRET=KZXW6...
MASTER_ENC_KEY=base64-32B   # for DB field encryption


Login pseudocode:

async function providerLogin(email, password, totpCode) {
  try {
    // Primary path: DB-backed settings
    const settings = await db.providerSettings.findUnique({ where: { email } });
    if (settings && verifyHash(password, settings.passwordHash) && verifyTOTP(totpCode, settings.totpSecret)) {
      return { mode: "normal", user: email };
    }
  } catch (e) {
    // DB unhealthy → fall through to resilience mode
  }

  // Resilience path: env-backed emergency admin
  const envEmail = process.env.PROVIDER_ADMIN_EMAIL;
  const envHash  = process.env.PROVIDER_ADMIN_PASSWORD_HASH;
  const envTotp  = process.env.PROVIDER_ADMIN_TOTP_SECRET;

  if (email === envEmail && verifyHash(password, envHash) && verifyTOTP(totpCode, envTotp)) {
    return { mode: "recovery", user: email };
  }

  throw new Error("Invalid credentials");
}


UI behavior:

If mode === "recovery":

Banner: “Recovery Mode — database unavailable; limited controls enabled.”

Show only: health checks, rotate keys, view logs, toggle read-only flags, trigger failover/redeploy.

Hide/disable: tenant data changes, billing runs, AI tasks that write, etc.