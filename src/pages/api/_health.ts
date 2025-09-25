// src/pages/api/_health.ts
import type { NextApiRequest, NextApiResponse } from "next";

type HealthPayload = { ok: true; t: string };

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthPayload>
) {
  res.status(200).json({ ok: true, t: new Date().toISOString() });
}
