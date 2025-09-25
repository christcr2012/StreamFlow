// src/pages/api/integrations/findrfp/fetch.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { scoreLeadNormalized } from "@/lib/leadScoringAdapter";

// Default pricing for Find RFP leads
const DEFAULT_UNIT_PRICE_CENTS = 8000; // $80.00 - lower than SAM.gov federal contracts

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

type FindRfpItem = {
  id?: string;
  title?: string;
  agency?: string;
  state?: string;
  city?: string;
  description?: string;
  dueDate?: string;
  postedDate?: string;
  bidType?: string;
  naicsCode?: string;
  keywords?: string[];
};

/** Parse Find RFP response data */
function normalizeFindrfpItem(raw: unknown): FindRfpItem {
  const o = raw as Record<string, unknown> | null | undefined;
  const getString = (prop: string): string | undefined => {
    const val = o?.[prop];
    return typeof val === "string" && val.trim() !== "" ? val : undefined;
  };
  
  return {
    id: getString("id") || getString("rfpId") || getString("noticeId"),
    title: getString("title") || getString("subject") || getString("description"),
    agency: getString("agency") || getString("organization") || getString("department"),
    state: getString("state"),
    city: getString("city") || getString("location"),
    description: getString("description") || getString("summary"),
    dueDate: getString("dueDate") || getString("responseDate"),
    postedDate: getString("postedDate") || getString("publishDate"),
    bidType: getString("bidType") || getString("type"),
    naicsCode: getString("naicsCode") || getString("naics"),
    keywords: Array.isArray(o?.keywords) ? (o.keywords as string[]) : [],
  };
}

/** Build enrichmentJson.billing for Find RFP leads */
function makeBilling(unitPriceCents: number) {
  return {
    billing: {
      billableEligible: false,
      source: "findrfp",
      unitPriceCents,
      billedAt: null,
      invoiceId: null,
    },
  };
}

function makeEnrichment(base: Record<string, unknown>, more?: Record<string, unknown>) {
  return asJson({ ...(base ?? {}), ...(more ?? {}) });
}

async function resolveUnitPriceCents(_orgId: string): Promise<number> {
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

    const apiKey = process.env.FINDRFP_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: "Missing FINDRFP_API_KEY. Please configure your Find RFP API credentials." });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const query = String(body.query ?? "cleaning janitorial custodial").trim();
    const state = String(body.state ?? "CO").trim().toUpperCase();
    const category = String(body.category ?? "").trim();
    const limit = Math.min(Math.max(parseInt(String(body.limit ?? "25"), 10) || 25, 1), 100);

    // Mock Find RFP API call - replace with actual API endpoint when available
    // In real implementation, this would be something like:
    // const url = `https://api.findrfp.com/opportunities?api_key=${apiKey}&q=${query}&state=${state}&limit=${limit}`;
    
    // For demonstration, creating sample data structure
    const mockResults: FindRfpItem[] = [
      {
        id: "CO-CLEAN-001",
        title: "Janitorial Services for State Building",
        agency: "Colorado Department of General Services",
        state: "CO",
        city: "Denver",
        description: "Comprehensive janitorial services including daily cleaning, floor care, and window cleaning",
        dueDate: "2025-02-15",
        postedDate: "2025-01-15",
        bidType: "RFP",
        naicsCode: "561720",
        keywords: ["janitorial", "cleaning", "maintenance"]
      },
      {
        id: "CO-CLEAN-002", 
        title: "School District Cleaning Contract",
        agency: "Greeley-Evans School District",
        state: "CO",
        city: "Greeley",
        description: "Daily custodial services for multiple school facilities",
        dueDate: "2025-02-20",
        postedDate: "2025-01-10",
        bidType: "IFB",
        naicsCode: "561720",
        keywords: ["custodial", "school", "facilities"]
      }
    ];

    if (mockResults.length === 0) {
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

    for (const raw of mockResults) {
      const r = normalizeFindrfpItem(raw);
      const itemId = r.id;
      if (!itemId) {
        items.push({ sourceType: LeadSource.RFP, unitPriceCents, created: false, skippedReason: "missing_id" });
        continue;
      }

      const publicId = `FINDRFP_${itemId}`;
      const company = r.agency || null;

      // Check for existing lead
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
          unitPriceCents,
          created: false,
          skippedReason: "exists",
        });
        continue;
      }

      // AI scoring
      let aiScore = 0;
      let scoreFactors: Prisma.InputJsonValue = {};
      try {
        const { score, details } = await scoreLeadNormalized({
          city: r.city,
          state: r.state,
          serviceCode: r.keywords?.join(" ") || "",
          sourceType: "FINDRFP",
          sourceDetail: `findrfp:${itemId}`,
        });
        aiScore = typeof score === "number" ? score : 0;
        scoreFactors = asJson(details ?? {});
      } catch {
        aiScore = 0;
        scoreFactors = asJson({});
      }

      const enrichment = makeEnrichment(
        {
          source: "findrfp",
          rfp: {
            itemId,
            title: r.title ?? null,
            agency: company,
            bidType: r.bidType ?? null,
            naicsCode: r.naicsCode ?? null,
            dueDate: r.dueDate ?? null,
            postedDate: r.postedDate ?? null,
            keywords: r.keywords ?? [],
          },
        },
        makeBilling(unitPriceCents)
      );

      const ih = identityHash({ email: null, phoneE164: null, company, name: r.title ?? null }) || sha256_24(itemId);

      const created = await db.lead.create({
        data: {
          orgId,
          publicId,
          sourceType: LeadSource.RFP,
          sourceDetail: `findrfp:${itemId}`,
          systemGenerated: true,
          rfp: asJson({ itemId, naicsCode: r.naicsCode ?? null, bidType: r.bidType ?? null }),
          company,
          contactName: null,
          email: null,
          phoneE164: null,
          website: null,
          serviceCode: r.keywords?.join(" ") || null,
          address: null,
          addressLine1: null,
          addressLine2: null,
          city: r.city || null,
          state: r.state || null,
          zip: null,
          postalCode: null,
          country: "US",
          enrichmentJson: enrichment,
          aiScore,
          scoreFactors,
          notes: r.description || null,
          status: LeadStatus.NEW,
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
        unitPriceCents,
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
    console.error("/api/integrations/findrfp/fetch error:", err);
    const msg = (err as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}