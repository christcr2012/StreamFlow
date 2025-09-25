// src/pages/api/system/federation.status.ts
/**
 * Simple status endpoint so UI (and humans) can see federation configuration.
 * - Enabled flag: PROVIDER_FEDERATION_ENABLED
 * - Signature mode: h31 (default) or sha256 when PROVIDER_FEDERATION_SIG_SHA256=1
 * This does not leak secrets or keys.
 */
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const enabled = (process.env.PROVIDER_FEDERATION_ENABLED || "").trim() === "1";
    const mode = (process.env.PROVIDER_FEDERATION_SIG_SHA256 || "").trim() === "1" ? "sha256" : "h31";
    return res.status(200).json({ ok: true, enabled, mode });
  } catch (e: unknown) {
    return res.status(200).json({ ok: true, enabled: false, mode: "h31" as const });
  }
}
