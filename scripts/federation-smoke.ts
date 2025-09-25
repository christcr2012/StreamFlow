/**
 * Federation Smoke Test
 * ---------------------
 * Node script that signs a request exactly like the future Provider Portal would.
 * Usage:
 *   TS_NODE_TRANSPILE_ONLY=1 ts-node scripts/federation-smoke.ts \
 *     --base https://your-client-instance.example.com \
 *     --path /api/billing/list \
 *     --keyid key-1 \
 *     --secret supersecret \
 *     --method GET
 *
 * Switch between h31 and sha256 by setting:
 *   PROVIDER_FEDERATION_SIG_SHA256=1   # to send sha256 signatures
 */

import https from "https";
import http from "http";
import { URL } from "url";
import { createHmac } from "crypto";

type Args = { [k: string]: string | boolean | number };

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (typeof v === "undefined") out[k] = true;
      else out[k] = v;
    }
  }
  return out;
}

function sigH31(secret: string, payload: string): string {
  const buf = Buffer.from(payload + secret, "utf8");
  let h = 0;
  for (let i = 0; i < buf.length; i++) h = (h * 31 + buf[i]) | 0;
  return `h31:${(h >>> 0).toString(16)}`;
}

function sigSha256(secret: string, payload: string): string {
  const mac = createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256:${mac}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const base = String(args.base || "");
  const path = String(args.path || "/api/billing/list");
  const method = String(args.method || "GET").toUpperCase();
  const keyId = String(args.keyid || "");
  const secret = String(args.secret || "");
  const useSha = (process.env.PROVIDER_FEDERATION_SIG_SHA256 || "").trim() === "1";

  if (!base || !keyId || !secret) {
    console.error("Missing --base, --keyid, or --secret");
    process.exit(1);
  }

  const ts = new Date().toISOString();
  const payload = `${method} ${path} ${ts}`;
  const signature = useSha ? sigSha256(secret, payload) : sigH31(secret, payload);

  const url = new URL(base.replace(/\/$/, "") + path);
  const lib = url.protocol === "https:" ? https : http;

  const options: https.RequestOptions = {
    method,
    headers: {
      "X-Provider-KeyId": keyId,
      "X-Provider-Timestamp": ts,
      "X-Provider-Signature": signature,
      "X-Provider-Scope": "provider",
      "Content-Type": "application/json",
    },
  };

  const req = lib.request(url, options, (res) => {
    let body = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", body);
    });
  });

  req.on("error", (e) => {
    console.error("Request error:", e);
  });

  if (method !== "GET" && method !== "HEAD") {
    req.write("{}", "utf8");
  }
  req.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
