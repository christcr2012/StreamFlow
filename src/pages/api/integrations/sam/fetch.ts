// src/pages/api/integrations/sam/fetch.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { scoreLeadNormalized } from "@/lib/leadScoringAdapter";

const SAM_BASE = "https://api.sam.gov/opportunities/v2/search";

// All leads are now FREE - no billing charges
const DEFAULT_UNIT_PRICE_CENTS = 0; // $0.00 - Free lead generation

function sha256_24(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 24);
}

function identityHash(input: { email?: string | null; phoneE164?: string | null; company?: string | null; name?: string | null }) {
  const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();
  const key = [norm(input.email), norm(input.phoneE164), norm(input.company), norm(input.name)].filter(Boolean).join("|");
  return sha256_24(key);
}

function asJson(v: unknown): Prisma.InputJsonValue {
  return (v ?? {}) as Prisma.InputJsonValue;
}

type SamItem = {
  noticeId?: string;
  title?: string;
  sol?: string;
  naics?: string | string[] | null;
  psc?: string | string[] | null;
  agency?: string | null;
  responseDate?: string | null;
  publishDate?: string | null;
  organizationName?: string | null;
  department?: string | null;
};

/** Extract first string from string|string[]|null */
function firstStr(x: string | string[] | null | undefined): string | null {
  if (!x) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

/** Best-effort SAM response parsing */
function normalizeSamItem(raw: unknown): SamItem {
  const o = raw as Record<string, unknown> | null | undefined;
  // Helper to read a string property safely
  const getString = (prop: string): string | undefined => {
    const val = o?.[prop];
    return typeof val === "string" && val.trim() !== "" ? val : undefined;
  };
  // Helper to read an array or string property safely
  const getStringOrArray = (prop: string): string | string[] | null => {
    const val = o?.[prop];
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val as string[];
    return null;
  };
  return {
    noticeId: (getString("noticeId") ?? getString("_id") ?? "").trim() || undefined,
    title: getString("title") || getString("subject") || getString("description") || undefined,
    sol: getString("sol") || getString("solicitationNumber") || undefined,
    naics: getStringOrArray("naics") ?? getStringOrArray("naicsCodes"),
    psc: getStringOrArray("psc") ?? getStringOrArray("pscCodes"),
    agency: getString("agency") || getString("office") || getString("officeName") || null,
    responseDate: getString("responseDate") || getString("dueDate") || null,
    publishDate: getString("publishDate") || getString("postedDate") || null,
    organizationName: getString("organizationName") || null,
    department: getString("department") || null,
  };
}

/** Build enrichmentJson.billing for imported RFP leads */
function makeBilling(unitPriceCents: number) {
  return {
    billing: {
      billableEligible: false,     // flips to true upon conversion
      source: "sam",
      unitPriceCents,
      billedAt: null,
      invoiceId: null,
    },
  };
}

/** Combine enrichment facets */
function makeEnrichment(base: Record<string, unknown>, more?: Record<string, unknown>) {
  return asJson({ ...(base ?? {}), ...(more ?? {}) });
}

/** Get org-specific unit price (extend later to read PricingPlan) */
async function resolveUnitPriceCents(_orgId: string): Promise<number> {
  // If you later add PricingPlan: read prisma.pricingPlan.findUnique({ where: { orgId } })
  return DEFAULT_UNIT_PRICE_CENTS;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }

    if (!(await assertPermission(req, res, PERMS.LEAD_CREATE))) return;

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const apiKey = process.env.SAM_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: "Missing SAM_API_KEY" });
    }

    // Body can carry search inputs like { q, naics, psc, postedFrom, postedTo, state, city, limit }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const q = String(body.q ?? "").trim();
    const naics = typeof body.naics === "string" ? body.naics : undefined;
    const psc = typeof body.psc === "string" ? body.psc : undefined;
    const postedFrom = String(body.postedFrom ?? "");
    const postedTo = String(body.postedTo ?? "");
    const limit = Math.min(Math.max(parseInt(String(body.limit ?? "50"), 10) || 50, 1), 200);

    const params = new URLSearchParams();
    params.set("api_key", apiKey);
    if (q) params.set("q", q);
    if (naics) params.set("naics", naics);
    if (psc) params.set("psc", psc);
    if (postedFrom) params.set("postedFrom", postedFrom);
    if (postedTo) params.set("postedTo", postedTo);
    params.set("limit", String(limit));
    // You can add more SAM filters here if you were using them.

    const url = `${SAM_BASE}?${params.toString()}`;

    // Fetch SAM.gov opportunities
    const resp = await fetch(url, { method: "GET" });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(502).json({ ok: false, error: `SAM fetch failed (${resp.status}): ${text.slice(0, 500)}` });
    }
    const payload: unknown = await resp.json().catch(() => ({}));
    const pObj = payload as Record<string, unknown> | null | undefined;
    const opportunitiesData = pObj && Array.isArray(pObj["opportunitiesData"]) ? (pObj["opportunitiesData"] as unknown[]) : null;
    const dataArr = pObj && Array.isArray(pObj["data"]) ? (pObj["data"] as unknown[]) : null;
    const results: unknown[] = opportunitiesData ?? dataArr ?? [];

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(200).json({ ok: true, count: 0, items: [], totalCents: 0, totalDollars: "0.00" });
    }

    const unitPriceCents = await resolveUnitPriceCents(orgId);

    const items: Array<{
      leadId?: string;
      publicId?: string;
      company?: string | null;
      title?: string | null;
      sourceType: LeadSource;
      unitPriceCents: number;
      created?: boolean;
      skippedReason?: string;
    }> = [];

    // Insert (idempotent-ish): if a lead already exists for same noticeId/org, skip create
    for (const raw of results) {
      const r = normalizeSamItem(raw);
      const noticeId = r.noticeId;
      if (!noticeId) {
        items.push({ sourceType: LeadSource.RFP, unitPriceCents: unitPriceCents, created: false, skippedReason: "missing_noticeId" });
        continue;
      }

      const publicId = `RFP_${noticeId}`;
      const company = r.agency || r.organizationName || r.department || null;

      // check existing
      const existing = await db.lead.findFirst({
        where: { orgId, publicId, sourceType: LeadSource.RFP },
        select: { id: true, publicId: true },
      });

      if (existing) {
        items.push({
          leadId: existing.id,
          publicId: existing.publicId,
          company,
          title: r.title || null,
          sourceType: LeadSource.RFP,
          unitPriceCents: unitPriceCents,
          created: false,
          skippedReason: "exists",
        });
        continue;
      }

      // Compute AI score + details via adapter (no assumptions about scoreLead types)
      let aiScore = 0;
      let scoreFactors: Prisma.InputJsonValue = {};
      try {
        const { score, details } = await scoreLeadNormalized({
          // safely supply what your scorer needs; adapter shields type differences
          title: r.title ?? "",
          agency: company ?? "",
          naics: firstStr(r.naics) ?? "",
          psc: firstStr(r.psc) ?? "",
        });
        aiScore = typeof score === "number" ? score : 0;
        scoreFactors = asJson(details ?? {});
      } catch {
        aiScore = 0;
        scoreFactors = asJson({});
      }

      const enrichment = makeEnrichment(
        {
          source: "sam",
          rfp: {
            noticeId,
            title: r.title ?? null,
            sol: r.sol ?? null,
            naics: r.naics ?? null,
            psc: r.psc ?? null,
            agency: company,
            responseDate: r.responseDate ?? null,
            publishDate: r.publishDate ?? null,
          },
        },
        makeBilling(unitPriceCents)
      );

      // identityHash is more for person/company leads; here we hash noticeId + title/agency to be stable
      const ih = identityHash({ email: null, phoneE164: null, company, name: r.title ?? null }) || sha256_24(noticeId);

      const created = await db.lead.create({
        data: {
          orgId,
          publicId,
          sourceType: LeadSource.RFP,
          sourceDetail: `sam:${noticeId}`,
          systemGenerated: true,
          rfp: asJson({ noticeId, naics: r.naics ?? null, psc: r.psc ?? null }),
          company,
          contactName: null,
          email: null,
          phoneE164: null,
          website: null,
          serviceCode: null,
          address: null,
          addressLine1: null,
          addressLine2: null,
          city: null,
          state: null,
          zip: null,
          postalCode: null,
          country: "US",
          enrichmentJson: enrichment,
          aiScore,
          scoreFactors,
          notes: null,
          status: LeadStatus.NEW, // explicit
          identityHash: ih,
        },
        select: { id: true, publicId: true },
      });

      items.push({
        leadId: created.id,
        publicId: created.publicId,
        company,
        title: r.title ?? null,
        sourceType: LeadSource.RFP,
        unitPriceCents: unitPriceCents,
        created: true,
      });
    }

    const totalCents = items.filter(it => it.created).reduce((sum, it) => sum + (it.unitPriceCents || 0), 0);

    return res.status(200).json({
      ok: true,
      count: items.length,
      totalCents,
      totalDollars: (totalCents / 100).toFixed(2),
      items,
    });
  } catch (err: unknown) {
    console.error("/api/integrations/sam/fetch error:", err);
    const msg = (err as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
