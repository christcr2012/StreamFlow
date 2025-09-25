// src/lib/providerFederation.ts
/**
 * Provider Federation — client shim
 * ---------------------------------
 * - Used by a future central Provider Portal to call each client system.
 * - Today unused by the client instance itself, but shipped so devs (and AI tooling)
 *   understand the contract and can adopt it when building the portal.
 *
 * Signature Mode (env toggle):
 *   PROVIDER_FEDERATION_SIG_SHA256=1  -> use HMAC-SHA256 "sha256:<hex>"
 *   (unset)                            -> use lightweight "h31:<hex>" (dev-friendly)
 */

export type FederationSite = {
  name: string;
  baseUrl: string;
  apiKeyId: string;
  apiKeySecret: string;
};

export type FederationRequest = {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
};

export type FederationResponse<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

const USE_SHA256 = (process.env.PROVIDER_FEDERATION_SIG_SHA256 || "").trim() === "1";

function h31(secret: string, payload: string): string {
  const enc = new TextEncoder().encode(payload + secret);
  let h = 0;
  for (let i = 0; i < enc.length; i++) h = (h * 31 + enc[i]) | 0;
  return `h31:${(h >>> 0).toString(16)}`;
}

// Node/Browser note: if you run this in Node 18+ with ESM, you can import('crypto').createHmac.
// For bundlers, ensure polyfill or call from a Node server context.
async function hmacSha256(secret: string, payload: string): Promise<string> {
  if (typeof window === "undefined") {
    // Node path
    const { createHmac } = await import("crypto");
    const mac = createHmac("sha256", secret).update(payload).digest("hex");
    return `sha256:${mac}`;
  } else if ("crypto" in window && "subtle" in window.crypto) {
    // Browser path using WebCrypto
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return `sha256:${hex}`;
  } else {
    // Fallback if WebCrypto not available
    return h31(secret, payload);
  }
}

export function buildFederationHeaders(site: FederationSite, req: FederationRequest) {
  const ts = new Date().toISOString();
  const payload = `${req.method || "GET"} ${req.path} ${ts}`;

  let signPromise: Promise<string> | string = h31(site.apiKeySecret, payload);
  if (USE_SHA256) {
    signPromise = hmacSha256(site.apiKeySecret, payload);
  }

  // NOTE: buildFederationHeaders can’t be async in most call sites, so if SHA-256 is enabled
  // and you’re in a browser, prefer to precompute headers in an async wrapper.
  const signature = (signPromise as any) instanceof Promise ? "sha256:pending" : (signPromise as string);

  return {
    "X-Provider-KeyId": site.apiKeyId,
    "X-Provider-Timestamp": ts,
    "X-Provider-Signature": signature,
    "Content-Type": "application/json",
  };
}

export async function fetchFromClient<T = unknown>(
  site: FederationSite,
  req: FederationRequest
): Promise<FederationResponse<T>> {
  const url = site.baseUrl.replace(/\/$/, "") + req.path;
  const ts = new Date().toISOString();
  const payload = `${req.method || "GET"} ${req.path} ${ts}`;
  const signature = USE_SHA256
    ? await hmacSha256(site.apiKeySecret, payload)
    : h31(site.apiKeySecret, payload);

  try {
    const r = await fetch(url, {
      method: req.method || "GET",
      headers: {
        "X-Provider-KeyId": site.apiKeyId,
        "X-Provider-Timestamp": ts,
        "X-Provider-Signature": signature,
        "Content-Type": "application/json",
      },
      body: req.body ? JSON.stringify(req.body) : undefined,
    });
    const data = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, data: data as T, error: (!r.ok && (data as any)?.error) || undefined };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || "Network error" };
  }
}
