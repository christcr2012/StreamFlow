// src/pages/api/system/federation.status.ts
/**
 * Simple status endpoint so UI (and humans) can see federation configuration.
 * - Enabled flag: FED_ENABLED
 * - Signature mode: h31 (default) or sha256 when FED_SIG_SHA256=true
 * This does not leak secrets or keys.
 */
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const enabled = ["1","true","yes","on","y","t"].includes((process.env.FED_ENABLED || "").trim().toLowerCase());
    const mode = ["1","true","yes","on","y","t"].includes((process.env.FED_SIG_SHA256 || "").trim().toLowerCase()) ? "sha256" : "h31";
    return res.status(200).json({ ok: true, enabled, mode });
  } catch (e: unknown) {
    return res.status(200).json({ ok: true, enabled: false, mode: "h31" as const });
  }
}
