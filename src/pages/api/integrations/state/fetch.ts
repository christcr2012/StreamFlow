// src/pages/api/integrations/state/fetch.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { scoreLeadNormalized } from "@/lib/leadScoringAdapter";

const DEFAULT_UNIT_PRICE_CENTS = 6000; // $60.00 - state/local typically lower value

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

type StateItem = {
  id?: string;
  title?: string;
  agency?: string;
  state?: string;
  city?: string;
  description?: string;
  dueDate?: string;
  postedDate?: string;
  bidType?: string;
  estimatedValue?: string;
  contactInfo?: string;
};

const STATE_PROCUREMENT_SOURCES = {
  CO: {
    name: "Colorado VSS",
    url: "https://www.colorado.gov/pacific/osc/solicitations",
    description: "Colorado Vendor Self Service procurement portal"
  },
  UT: {
    name: "Utah U3P",
    url: "https://bids.sciquest.com/apps/Router/PublicEvent?CustomerOrg=StateOfUtah", 
    description: "Utah Public Procurement Place"
  },
  WY: {
    name: "Wyoming A&I",
    url: "https://ai.wyo.gov/divisions/general-services/purchasing/bid-opportunities",
    description: "Wyoming Administration & Information purchasing"
  }
};

function normalizeStateItem(raw: unknown, state: string): StateItem {
  const o = raw as Record<string, unknown> | null | undefined;
  const getString = (prop: string): string | undefined => {
    const val = o?.[prop];
    return typeof val === "string" && val.trim() !== "" ? val : undefined;
  };
  
  return {
    id: getString("id") || getString("solicitation_id") || getString("bid_id"),
    title: getString("title") || getString("project_name") || getString("description"),
    agency: getString("agency") || getString("department") || getString("organization"),
    state: state,
    city: getString("city") || getString("location"),
    description: getString("description") || getString("scope"),
    dueDate: getString("due_date") || getString("closing_date"),
    postedDate: getString("posted_date") || getString("publish_date"),
    bidType: getString("bid_type") || getString("procurement_type"),
    estimatedValue: getString("estimated_value") || getString("budget"),
    contactInfo: getString("contact") || getString("contact_info"),
  };
}

function makeBilling(unitPriceCents: number) {
  return {
    billing: {
      billableEligible: false,
      source: "state",
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

    const body = (req.body ?? {}) as Record<string, unknown>;
    const state = String(body.state ?? "CO").trim().toUpperCase();
    const keywords = String(body.keywords ?? "cleaning janitorial custodial").trim();
    const limit = Math.min(Math.max(parseInt(String(body.limit ?? "15"), 10) || 15, 1), 50);

    const source = STATE_PROCUREMENT_SOURCES[state as keyof typeof STATE_PROCUREMENT_SOURCES];
    if (!source) {
      return res.status(400).json({ ok: false, error: `State ${state} not supported. Available: CO, UT, WY` });
    }

    // Mock state procurement data - in real implementation, this would scrape or use APIs
    const mockResults: StateItem[] = [
      {
        id: `${state}-CLEAN-001`,
        title: "Custodial Services Contract",
        agency: `${state} Department of Administration`,
        state: state,
        city: state === "CO" ? "Denver" : state === "UT" ? "Salt Lake City" : "Cheyenne",
        description: "Comprehensive custodial services for state facilities including daily cleaning, floor maintenance, and supplies",
        dueDate: "2025-03-01",
        postedDate: "2025-01-20",
        bidType: "RFP",
        estimatedValue: "$150,000 annually",
        contactInfo: "procurement@state.gov"
      },
      {
        id: `${state}-CLEAN-002`,
        title: "University Campus Cleaning",
        agency: `${state} State University`,
        state: state,
        city: state === "CO" ? "Fort Collins" : state === "UT" ? "Logan" : "Laramie",
        description: "Janitorial services for multiple campus buildings including dormitories and academic facilities",
        dueDate: "2025-03-15",
        postedDate: "2025-01-25",
        bidType: "IFB",
        estimatedValue: "$200,000 annually",
        contactInfo: "facilities@university.edu"
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
      const r = normalizeStateItem(raw, state);
      const itemId = r.id;
      if (!itemId) {
        items.push({ sourceType: LeadSource.RFP, unitPriceCents, created: false, skippedReason: "missing_id" });
        continue;
      }

      const publicId = `STATE_${state}_${itemId}`;
      const company = r.agency || null;

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
          serviceCode: keywords,
          sourceType: "STATE_RFP",
          sourceDetail: `state:${state}:${itemId}`,
        });
        aiScore = typeof score === "number" ? score : 0;
        scoreFactors = asJson(details ?? {});
      } catch {
        aiScore = 0;
        scoreFactors = asJson({});
      }

      const enrichment = makeEnrichment(
        {
          source: "state",
          state_procurement: {
            itemId,
            state,
            source_name: source.name,
            source_url: source.url,
            title: r.title ?? null,
            agency: company,
            bidType: r.bidType ?? null,
            estimatedValue: r.estimatedValue ?? null,
            dueDate: r.dueDate ?? null,
            postedDate: r.postedDate ?? null,
            contactInfo: r.contactInfo ?? null,
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
          sourceDetail: `state:${state}:${itemId}`,
          systemGenerated: true,
          rfp: asJson({ itemId, state, bidType: r.bidType ?? null }),
          company,
          contactName: r.contactInfo || null,
          email: null,
          phoneE164: null,
          website: null,
          serviceCode: keywords,
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
      source: source.name,
      state,
    });
  } catch (err: unknown) {
    console.error("/api/integrations/state/fetch error:", err);
    const msg = (err as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}