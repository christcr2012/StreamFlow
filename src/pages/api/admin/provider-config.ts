// src/pages/api/admin/provider-config.ts
// API endpoint for provider-level configuration.
// Only users with role PROVIDER may read or update the ProviderConfig. This stores
// system-wide secrets such as SAM API keys or Stripe secret keys for provider use.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getEmailFromReq } from "@/lib/rbac";

// Helper to ensure the caller is a provider using environment-based auth
async function ensureProvider(req: NextApiRequest, res: NextApiResponse): Promise<{ ok: false } | { ok: true; user: { role: string } }> {
  const providerEmail = process.env.PROVIDER_EMAIL;
  if (!providerEmail) {
    res.status(500).json({ ok: false, error: "Provider system not configured" });
    return { ok: false };
  }

  const email = getEmailFromReq(req);
  if (!email || email.toLowerCase() !== providerEmail.toLowerCase()) {
    res.status(403).json({ ok: false, error: "Provider access required" });
    return { ok: false };
  }

  return { ok: true, user: { role: "PROVIDER" } };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enforce that only provider role can access this API
  const auth = await ensureProvider(req, res);
  if (!("ok" in auth) || !auth.ok) return;

  if (req.method === "GET") {
    // Return the first provider config (or null if not set)
    const cfg = await db.providerConfig.findFirst();
    res.status(200).json({ ok: true, config: cfg ?? {} });
    return;
  }

  if (req.method === "POST" || req.method === "PUT") {
    const body = req.body || {};
    const { samApiKey, stripeSecretKey, otherConfig } = body;
    // Validate inputs: allow strings or undefined; otherConfig should be object
    const cfg = await db.providerConfig.findFirst();
    if (!cfg) {
      // create new row
      const created = await db.providerConfig.create({
        data: {
          samApiKey: samApiKey ?? null,
          stripeSecretKey: stripeSecretKey ?? null,
          otherConfig: otherConfig ?? {},
        },
      });
      res.status(200).json({ ok: true, config: created });
    } else {
      const updated = await db.providerConfig.update({
        where: { id: cfg.id },
        data: {
          samApiKey: samApiKey !== undefined ? samApiKey : cfg.samApiKey,
          stripeSecretKey: stripeSecretKey !== undefined ? stripeSecretKey : cfg.stripeSecretKey,
          otherConfig: otherConfig !== undefined ? otherConfig : cfg.otherConfig,
        },
      });
      res.status(200).json({ ok: true, config: updated });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST, PUT");
  res.status(405).json({ ok: false, error: "Method Not Allowed" });
}