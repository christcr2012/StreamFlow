import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import crypto from "node:crypto";

function identityHash(input: { email?: string | null; phoneE164?: string | null; company?: string | null; name?: string | null }) {
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  const key = [norm(input.email), norm(input.phoneE164), norm(input.company), norm(input.name)]
    .filter(Boolean)
    .join("|");
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 24);
}

function isoDay(offset = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!(await assertPermission(req, res, PERMS.LEAD_CREATE))) return;
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "Method Not Allowed" }); }

    const apiKey = process.env.SAM_API_KEY;
    if (!apiKey) return res.status(200).json({ ok: true, imported: 0, skipped: 0, note: "Set SAM_API_KEY in env." });

    // Resolve org from current user cookie or fallback to first Org
    const wsEmail = (req.cookies?.ws_user ?? "").trim().toLowerCase() || null;
    let orgId: string | null = null;
    if (wsEmail) {
      const user = await db.user.findFirst({ where: { email: wsEmail }, select: { orgId: true } });
      if (user?.orgId) orgId = user.orgId;
    }
    if (!orgId) {
      const firstOrg = await db.org.findFirst({ select: { id: true } });
      if (!firstOrg) return res.status(400).json({ ok: false, error: "No Org found; create an Org first." });
      orgId = firstOrg.id;
    }

    // Request overrides: { postedFrom, postedTo, state, keywords, limit }
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const postedFrom = (body.postedFrom || isoDay(-30)).toString();  // narrower default to preserve quota
    const postedTo   = (body.postedTo   || isoDay(0)).toString();
    const state = (body.state ?? "").toString().trim().toUpperCase();
    const keywords: string[] = Array.isArray(body.keywords) ? body.keywords : [];
    const limit = String(Math.min(Math.max(Number(body.limit ?? 25), 1), 50)); // 1..50

    const params = new URLSearchParams({ api_key: apiKey, postedFrom, postedTo, limit });
    if (state) params.set("placeOfPerformance.state", state);
    if (keywords.length) params.set("q", keywords.map(k => `"${k}"`).join(" OR "));

    const url = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`;
    const r = await fetch(url);
    const text = await r.text();

    let json: Record<string, unknown> | undefined;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = undefined;
    }

    if (r.status === 429) {
      return res.status(200).json({
        ok: false,
        status: 429,
        imported: 0,
        skipped: 0,
        throttle: json?.nextAccessTime || "unknown",
        message: json?.message || json?.description || "Rate limited",
        url,
      });
    }

    // Extract opportunitiesData array safely
    const oppCandidate = (json as Record<string, unknown> | undefined)?.["opportunitiesData"];
    const notices: unknown[] = Array.isArray(oppCandidate) ? oppCandidate : [];
    let imported = 0;
    let skipped = 0;

    for (const nRaw of notices) {
      const n = nRaw as Record<string, unknown>;
      // Safely extract fields from the notice record
      const noticeIdVal = n["noticeId"] ?? n["solicitationNumber"] ?? n["_id"];
      const noticeId = typeof noticeIdVal === "string" ? noticeIdVal : null;
      const titleVal = n["title"] ?? n["subject"];
      const title: string | null = typeof titleVal === "string" ? titleVal : null;
      const agencyCandidates = [n["department"], n["office"], n["organizationName"], n["agency"]];
      let agency: string | null = null;
      for (const cand of agencyCandidates) {
        if (typeof cand === "string" && cand) { agency = cand; break; }
      }
      // placeOfPerformance may be nested
      let popCity: string | null = null;
      let popState: string | null = null;
      const popObj = n["placeOfPerformance"];
      if (popObj && typeof popObj === "object") {
        const po = popObj as Record<string, unknown>;
        const c = po["city"];
        const s = po["state"];
        if (typeof c === "string" && c) popCity = c;
        if (typeof s === "string" && s) popState = s;
      }
      if (!popCity && typeof n["city"] === "string") popCity = n["city"] as string;
      if (!popState && typeof n["state"] === "string") popState = n["state"] as string;

      const publicId = noticeId ? `SAM-${String(noticeId)}` : `SAM-${Math.random().toString(36).slice(2, 9)}`;
      const exists = await db.lead.findFirst({ where: { publicId } });
      if (exists) { skipped++; continue; }

      const ih = identityHash({ email: null, phoneE164: null, company: agency, name: title });

      await db.lead.create({
        data: {
          org: { connect: { id: orgId! } },
          identityHash: ih,
          publicId,
          sourceType: "RFP",
          sourceDetail: `sam:${noticeId ?? "unknown"}`,
          company: agency,
          contactName: title,
          email: null,
          phoneE164: null,
          serviceCode: null,
          postalCode: null,
          zip: null,
          addressLine1: popCity,
          addressLine2: null,
          city: popCity,
          state: popState,
          aiScore: 75,
          status: "NEW",
        },
      });
      imported++;
    }

    return res.status(200).json({
      ok: true,
      imported,
      skipped,
      receivedCount: notices.length,
      query: { postedFrom, postedTo, state: state || "(none)", keywords, limit },
      url,
      sample: notices.slice(0, 3),
    });
  } catch (err: unknown) {
    console.error("leads.import error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}