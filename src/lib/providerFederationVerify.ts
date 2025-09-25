// src/lib/providerFederationVerify.ts
/**
 * Provider Federation — Request Verifier (Feature-flagged, SHA-256 ready)
 * ----------------------------------------------------------------------
 * PURPOSE
 *  Allow a central "Provider Portal" to securely call APIs on many client
 *  instances. This verifier checks signed, time-bound, machine-to-machine
 *  requests and—when enabled—can optionally bypass interactive RBAC for
 *  provider-scoped calls.
 *
 * DEFAULTS & SAFETY
 *  - DISABLED by default. Normal RBAC applies until you explicitly enable.
 *  - If disabled, this returns { ok:false, reason:"disabled" } and your API
 *    continues with assertPermission(...) as usual.
 *
 * ENABLE VIA ENV
 *  - PROVIDER_FEDERATION_ENABLED=1
 *  - PROVIDER_KEYS_JSON={"key-1":"supersecret"}   // map keyId -> secret
 *  - PROVIDER_CLOCK_SKEW_SEC=300                  // optional, default 300s
 *
 * SIGNATURE ALGORITHMS (env toggle)
 *  - DEV-FRIENDLY (default):  h31:<hex>   (portable, uses no external crypto)
 *  - PRODUCTION (recommended): sha256:<hex> (HMAC-SHA256)
 *    Toggle with: PROVIDER_FEDERATION_SIG_SHA256=1
 *
 * HEADERS (sent by Provider Portal)
 *  - X-Provider-KeyId: <key-id>
 *  - X-Provider-Timestamp: <ISO-8601 UTC>
 *  - X-Provider-Signature: h31:<hex>  or  sha256:<hex> (see env toggle)
 *  - X-Provider-Scope: provider | read   (defaults to "provider")
 *  - X-Provider-Org: <optional org id hint> (for future multi-tenant routing)
 *
 * WHAT IS SIGNED?
 *  `${METHOD} ${PATH+QUERY} ${TIMESTAMP}`
 *  Example: "POST /api/billing/invoices.create?range=d30 2025-09-25T18:00:00.000Z"
 *
 * HOW TO USE IN AN API ROUTE
 *  import { verifyFederation, federationOverridesRBAC } from "@/lib/providerFederationVerify";
 *
 *  const fed = await verifyFederation(req);
 *  if (federationOverridesRBAC(fed)) {
 *    // Provider-level authority (machine-to-machine). Skip assertPermission(...).
 *  } else {
 *    // Normal path: enforce interactive RBAC, e.g. assertPermission(req,res,PERMS.BILLING_MANAGE)
 *  }
 */

export type FederationVerification = {
  ok: boolean;
  scope?: "provider" | "read";
  keyId?: string;
  orgHint?: string | null;
  reason?: string;
};

// ---------------------------- Environment toggles ----------------------------

/** Enable/disable federation entirely. If disabled, verifier returns ok:false. */
function isEnabled(): boolean {
  return (process.env.PROVIDER_FEDERATION_ENABLED || "").trim() === "1";
}

/** Use HMAC-SHA256 (recommended for production). Default is dev-friendly h31. */
const USE_SHA256 = (process.env.PROVIDER_FEDERATION_SIG_SHA256 || "").trim() === "1";

/** Allowed timestamp skew in seconds (default 300s = ±5 minutes). */
function getClockSkewSec(): number {
  const n = parseInt(process.env.PROVIDER_CLOCK_SKEW_SEC || "300", 10);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

/** Look up shared secret by keyId from env JSON. */
function loadKeySecret(keyId: string | undefined): string | null {
  if (!keyId) return null;
  try {
    const raw = process.env.PROVIDER_KEYS_JSON || "{}";
    const map = JSON.parse(raw) as Record<string, string>;
    const secret = map[keyId];
    return typeof secret === "string" && secret.length > 0 ? secret : null;
  } catch {
    return null;
  }
}

// ------------------------------ Signatures -----------------------------------

/**
 * h31 (portable dev hash)
 *  - Simple 31-based rolling hash over (payload + secret).
 *  - Use only for development/local and to avoid crypto deps.
 */
function sigH31(secret: string, payload: string): string {
  const enc = new TextEncoder().encode(payload + secret);
  let h = 0;
  for (let i = 0; i < enc.length; i++) h = (h * 31 + enc[i]) | 0;
  return `h31:${(h >>> 0).toString(16)}`;
}

/**
 * HMAC-SHA256 (recommended in production)
 *  - Requires Node crypto (API routes typically run in Node on Next.js).
 *  - If crypto import fails for any reason, we safely fall back to h31.
 */
function sigSha256OrFallback(secret: string, payload: string): string {
  try {
    // Lazy require to avoid issues in non-Node contexts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require("crypto") as typeof import("crypto");
    const mac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return `sha256:${mac}`;
  } catch {
    // Fallback keeps the system usable even if crypto is unavailable
    return sigH31(secret, payload);
  }
}

/** Compute expected signature based on env toggle. */
function computeExpectedSignature(secret: string, payload: string): string {
  return USE_SHA256 ? sigSha256OrFallback(secret, payload) : sigH31(secret, payload);
}

// ------------------------------- Verifier ------------------------------------

/**
 * Verify a request. Non-throwing:
 *  - returns { ok:false, reason: "..."} on any issue
 *  - returns { ok:true, scope, keyId, orgHint } when valid
 *
 * Notes:
 *  - req.url should contain the path + query as seen by the API route (Next.js provides this).
 *  - method is uppercased; timestamp must be ISO; we enforce a skew window.
 */
export async function verifyFederation(req: {
  method?: string;
  url?: string;
  headers?: Record<string, any>;
}): Promise<FederationVerification> {
  // 0) Feature flag: short-circuit when disabled (keeps normal RBAC flows untouched).
  if (!isEnabled()) return { ok: false, reason: "disabled" };

  try {
    const method = (req.method || "GET").toUpperCase();
    const url = String(req.url || ""); // e.g., /api/billing/preview?range=d30

    // 1) Pull headers (case-insensitive)
    const h = req.headers || {};
    const keyId = String(h["x-provider-keyid"] || h["X-Provider-KeyId"] || "");
    const ts = String(h["x-provider-timestamp"] || h["X-Provider-Timestamp"] || "");
    const sig = String(h["x-provider-signature"] || h["X-Provider-Signature"] || "");
    const scope = (String(h["x-provider-scope"] || h["X-Provider-Scope"] || "provider").toLowerCase() === "read")
      ? "read" as const
      : "provider" as const;
    const orgHint = String(h["x-provider-org"] || h["X-Provider-Org"] || "") || null;

    if (!keyId || !ts || !sig) return { ok: false, reason: "missing headers" };

    // 2) Timestamp check
    const sent = Date.parse(ts);
    if (!Number.isFinite(sent)) return { ok: false, reason: "bad timestamp" };
    const skew = Math.abs(Date.now() - sent) / 1000;
    if (skew > getClockSkewSec()) return { ok: false, reason: "timestamp expired" };

    // 3) Load secret for key
    const secret = loadKeySecret(keyId);
    if (!secret) return { ok: false, reason: "unknown key" };

    // 4) Recompute signature over `${METHOD} ${URL} ${TIMESTAMP}`
    const payload = `${method} ${url} ${ts}`;
    const expected = computeExpectedSignature(secret, payload);

    // 5) Compare exact string (scheme + hex)
    if (sig !== expected) return { ok: false, reason: "bad signature", keyId };

    // 6) Valid
    return { ok: true, scope, keyId, orgHint };
  } catch (e: unknown) {
    return { ok: false, reason: (e as any)?.message || "verify error" };
  }
}

/**
 * Helper: Should this federated call bypass interactive RBAC?
 *  - Provider-level scope → true (treat like a machine "provider" actor)
 *  - Read-only scope      → false (still require normal read permissions)
 */
export function federationOverridesRBAC(fed: FederationVerification): boolean {
  return !!(fed.ok && fed.scope === "provider");
}
