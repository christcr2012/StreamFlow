// src/pages/api/integrations/sam/fetch.ts
// SAM.gov Federal RFP Integration - HOT Lead Generation

/*
=== ENTERPRISE ROADMAP: LEAD GENERATION & SOURCE INTEGRATION ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Basic SAM.gov API integration for government RFPs
- Manual keyword filtering and NAICS code selection
- Simple lead creation without advanced enrichment
- No automated bid tracking or deadline management

ENTERPRISE CRM COMPARISON (Salesforce, HubSpot, Pipedrive Lead Gen):
1. Multi-Source Lead Generation:
   - Integration with 20+ lead sources (LinkedIn, ZoomInfo, Apollo, etc.)
   - Real-time lead alerts and notifications
   - Cross-platform lead de-duplication and merge
   - Source attribution and ROI tracking

2. Advanced Lead Enrichment:
   - Automatic company and contact data enrichment
   - Social media profile matching and insights
   - Technographic and firmographic data overlay
   - Intent data integration for buying signals

3. Intelligent Lead Routing:
   - AI-powered lead scoring and prioritization
   - Automatic assignment based on territories and skills
   - Lead routing rules with escalation workflows
   - Real-time notifications and follow-up reminders

IMPLEMENTATION ROADMAP:

Phase 1: Enhanced Source Integration (3-4 weeks)
- Add multiple government databases (FBO, GSA, state/local portals)
- Implement real-time lead monitoring and alerts
- Add automated bid deadline tracking and calendar integration
- Create lead source performance analytics dashboard

Phase 2: Advanced Enrichment Platform (1-2 months)
- Integrate third-party enrichment services (Clearbit, ZoomInfo)
- Add company and contact data validation and normalization
- Implement social media profile matching and insights
- Create automated data quality scoring and improvement

Phase 3: Intelligent Lead Processing (2-3 months)
- Build AI-powered lead categorization and tagging
- Add automated lead routing and assignment engine
- Implement predictive lead scoring based on historical data
- Create automated follow-up sequences and reminders

Phase 4: Enterprise Integration Platform (1-2 months)
- Add webhook integrations for real-time data sync
- Create API for external CRM and marketing tool integration
- Implement enterprise-grade security and compliance features
- Add comprehensive analytics and reporting dashboard

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: Multi-source lead import configuration
export type LeadSourceConfig = {
  sourceId: string;
  name: string;
  type: 'api' | 'webhook' | 'email' | 'manual';
  enabled: boolean;
  settings: {
    endpoint?: string;
    credentials?: string;
    refreshInterval?: number;
    filters?: Record<string, unknown>;
    enrichment?: boolean;
    autoAssign?: boolean;
  };
  fieldMapping: Record<string, string>;
  qualityScore: number;          // Historical source quality
  conversionRate: number;        // Historical conversion rate
};

// ENTERPRISE FEATURE: Advanced lead enrichment request
export type LeadSourceEnrichment = {
  company?: {
    name: string;
    domain?: string;
    linkedin?: string;
    employees?: number;
    revenue?: number;
    industry?: string;
    location?: string;
  };
  contact?: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    verified?: boolean;
  };
  opportunity?: {
    estimatedValue?: number;
    timeline?: string;
    decisionMakers?: string[];
    competitors?: string[];
    requirements?: string[];
  };
};

// ENTERPRISE FEATURE: Lead routing and assignment rules
export type LeadRoutingRule = {
  id: string;
  name: string;
  priority: number;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
    value: unknown;
  }>;
  actions: Array<{
    type: 'assign' | 'tag' | 'score' | 'notify' | 'enrich';
    parameters: Record<string, unknown>;
  }>;
  enabled: boolean;
};

//
// PURPOSE:
// Imports active federal government RFPs (Request for Proposals) where agencies
// are actively seeking cleaning and janitorial services RIGHT NOW. These are
// HOT LEADS - pre-qualified buyers with defined budgets and timelines.
//
// LEAD CLASSIFICATION:
// - These are HOT leads (actively seeking services)
// - Get 1.5x scoring boost for maximum priority (scores via config.thresholds: hot≥70)
// - Require 2-hour response time for competitive advantage
// - Pre-configured with cleaning-specific NAICS and PSC codes
//
// CLEANING FOCUS:
// - NAICS codes: 561720 (Janitorial), 561740 (Carpet), 561790 (Building Services)
// - PSC codes: S201 (Custodial), S214 (Housekeeping), S299 (Misc Maintenance)
// - Server-side defaults ensure all searches target cleaning services
// - Keyword filtering for janitorial, custodial, housekeeping terms
//
// COMPETITIVE ADVANTAGE:
// - Government contracts have clear budgets and less price shopping
// - RFP process is structured and professional
// - Recurring contracts common for janitorial services
// - Payment terms more reliable than private sector

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { scoreLeadNormalized } from "@/lib/leadScoringAdapter";

const SAM_BASE = "https://api.sam.gov/opportunities/v2/search";

// All leads are FREE - core business model
const DEFAULT_UNIT_PRICE_CENTS = 0; // $0.00 - No per-lead costs

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

    // === REQUEST BODY PARSING AND CLEANING DEFAULTS ===
    // Ensure all searches focus on cleaning services even if UI parameters missing
    const body = (req.body ?? {}) as Record<string, unknown>;
    const keywords = String(body.keywords ?? "").trim(); // From admin UI
    const q = keywords || String(body.q ?? "janitorial custodial cleaning").trim();
    
    // CLEANING-SPECIFIC DEFAULTS - prevent drift to non-cleaning RFPs
    const cleaningNaics = ["561720", "561740", "561790"]; // Janitorial, Carpet, Building services
    const cleaningPsc = ["S201", "S214", "S299"]; // Custodial, Housekeeping, Misc
    
    // Use UI-provided codes or default to cleaning-specific codes
    const naics = typeof body.naics === "string" ? body.naics : 
                  Array.isArray(body.naics) ? body.naics.join(",") :
                  cleaningNaics.join(",");
    const psc = typeof body.psc === "string" ? body.psc : 
                Array.isArray(body.psc) ? body.psc.join(",") :
                cleaningPsc.join(",");
    
    // RATIONALE: Without defaults, generic searches return irrelevant RFPs
    // Cleaning focus ensures every imported lead is actually actionable
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

      // Compute AI score + details via adapter (HOT leads get priority boost)
      let aiScore = 0;
      let scoreFactors: Prisma.InputJsonValue = {};
      try {
        // === HOT LEAD SCORING - 1.5x Priority Boost ===
        // Federal RFPs are HOT leads: agencies actively seeking services with budgets
        const { score, details } = await scoreLeadNormalized({
          sourceType: "RFP", 
          leadType: "hot",     // CRITICAL: Triggers 1.5x scoring multiplier
          title: r.title ?? "",
          agency: company ?? "",
          naics: firstStr(r.naics) ?? "",
          psc: firstStr(r.psc) ?? "",
          serviceDescription: `Federal RFP: ${r.title ?? 'Cleaning services'}`,
          city: "",            // Federal contracts span regions
          state: "US"          // Federal level (gets no state bonus)
        });
        
        // SCORING EXPLANATION:
        // - HOT leadType gives 1.5x multiplier to total score
        // - RFP sourceType adds +12 points for government quality
        // - Service description matching adds keyword points
        // - No geographic bonus since federal contracts can be anywhere
        aiScore = typeof score === "number" ? score : 0;
        scoreFactors = asJson(details ?? {});
      } catch {
        aiScore = 0;
        scoreFactors = asJson({});
      }

      // === ENRICHMENT DATA - Full RFP Context for Sales Team ===
      // Store all RFP details for informed response preparation
      const enrichment = makeEnrichment(
        {
          source: "sam",
          leadType: "hot",    // Mark for sales workflow routing
          rfp: {
            noticeId,         // Unique government ID for tracking
            title: r.title ?? null,
            sol: r.sol ?? null,        // Solicitation number
            naics: r.naics ?? null,    // Industry classification
            psc: r.psc ?? null,        // Product/service code
            agency: company,           // Contracting agency
            responseDate: r.responseDate ?? null, // Bid deadline
            publishDate: r.publishDate ?? null,   // When posted
          },
        },
        makeBilling(unitPriceCents) // Always $0 - free model
      );
      
      // USAGE BY SALES TEAM:
      // - noticeId for SAM.gov lookup and tracking
      // - responseDate for deadline management
      // - agency for relationship building and past performance research
      // - NAICS/PSC for positioning and capability statements

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
