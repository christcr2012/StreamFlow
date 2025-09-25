// src/pages/api/integrations/permits/fetch.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { scoreLeadNormalized } from "@/lib/leadScoringAdapter";

// All leads are FREE - no billing charges
const DEFAULT_UNIT_PRICE_CENTS = 0; // $0.00 - Free hot lead generation

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

type PermitItem = {
  permitNumber?: string;
  projectDescription?: string;
  permitType?: string;
  contractorName?: string;
  contractorPhone?: string;
  propertyAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  permitValue?: number;
  issuedDate?: string;
  constructionType?: string;
  workDescription?: string;
};

/** Extract useful info from different permit API formats */
function normalizePermitItem(raw: unknown, source: string): PermitItem {
  const o = raw as Record<string, unknown> | null | undefined;
  
  // Helper to read a string property safely
  const getString = (prop: string): string | undefined => {
    const val = o?.[prop];
    return typeof val === "string" && val.trim() !== "" ? val : undefined;
  };
  
  // Helper to read a number property safely
  const getNumber = (prop: string): number | undefined => {
    const val = o?.[prop];
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const num = parseFloat(val.replace(/[$,]/g, ""));
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  };

  switch (source) {
    case "austin":
      return {
        permitNumber: getString("permit_number") || getString("permit_id"),
        projectDescription: getString("description") || getString("work_type"),
        permitType: getString("permit_type"),
        contractorName: getString("contractor_name") || getString("applicant_name"),
        contractorPhone: getString("contractor_phone"),
        propertyAddress: getString("address") || getString("original_address1"),
        city: getString("city") || "Austin",
        state: getString("state") || "TX",
        zip: getString("zip") || getString("original_zip"),
        permitValue: getNumber("total_fees") || getNumber("permit_value"),
        issuedDate: getString("issued_date") || getString("application_date"),
        constructionType: getString("permit_class") || getString("permit_type"),
        workDescription: getString("description")
      };
      
    case "louisville":
      return {
        permitNumber: getString("permit_num") || getString("permit_number"),
        projectDescription: getString("project_desc") || getString("description"),
        permitType: getString("permit_type"),
        contractorName: getString("contractor") || getString("contractor_name"),
        contractorPhone: getString("phone"),
        propertyAddress: getString("location") || getString("address"),
        city: getString("city") || "Louisville",
        state: getString("state") || "KY",
        zip: getString("zip"),
        permitValue: getNumber("value") || getNumber("permit_value"),
        issuedDate: getString("issue_date") || getString("issued_date"),
        constructionType: getString("work_type") || getString("permit_type"),
        workDescription: getString("project_desc")
      };
      
    case "montgomery":
      return {
        permitNumber: getString("applicationnumber") || getString("permit_number"),
        projectDescription: getString("workperformed") || getString("description"),
        permitType: getString("permittype"),
        contractorName: getString("contractorname") || getString("contractor"),
        contractorPhone: getString("contractorphone"),
        propertyAddress: getString("location") || getString("address"),
        city: getString("city") || "Rockville",
        state: getString("state") || "MD",
        zip: getString("zip"),
        permitValue: getNumber("totalvalue") || getNumber("permit_value"),
        issuedDate: getString("issueddate") || getString("issue_date"),
        constructionType: getString("permittype"),
        workDescription: getString("workperformed")
      };
      
    default:
      // Generic mapping for other sources
      return {
        permitNumber: getString("permit_number") || getString("permit_id") || getString("id"),
        projectDescription: getString("description") || getString("project_description"),
        permitType: getString("permit_type") || getString("type"),
        contractorName: getString("contractor_name") || getString("contractor") || getString("applicant_name"),
        contractorPhone: getString("contractor_phone") || getString("phone"),
        propertyAddress: getString("address") || getString("location") || getString("property_address"),
        city: getString("city"),
        state: getString("state"),
        zip: getString("zip") || getString("zipcode"),
        permitValue: getNumber("permit_value") || getNumber("value") || getNumber("total_fees"),
        issuedDate: getString("issued_date") || getString("issue_date") || getString("date_issued"),
        constructionType: getString("construction_type") || getString("permit_type"),
        workDescription: getString("work_description") || getString("description")
      };
  }
}

/** Build enrichmentJson.billing for imported permit leads */
function makeEnrichment(item: PermitItem, source: string) {
  return {
    billing: {
      sourceType: "CONSTRUCTION_PERMIT",
      unitPriceCents: DEFAULT_UNIT_PRICE_CENTS,
      billableEligible: false,     // FREE leads - no billing
      importedAt: new Date().toISOString(),
      rawData: { item, source }
    }
  };
}

async function fetchAustinPermits(limit: number): Promise<unknown[]> {
  const url = "https://data.austintexas.gov/resource/3syk-w9eu.json";
  const params = new URLSearchParams({
    "$limit": limit.toString(),
    "$order": "issued_date DESC",
    "$where": "permit_type LIKE '%COMMERCIAL%' OR permit_type LIKE '%BUILDING%'"
  });
  
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Austin API error: ${response.status} ${response.statusText}`);
  }
  return await response.json() as unknown[];
}

async function fetchLouisvillePermits(limit: number): Promise<unknown[]> {
  // Louisville ArcGIS REST API
  const url = "https://services1.arcgis.com/79kfd2K6fskCAkyg/arcgis/rest/services/active_construction_permits/FeatureServer/0/query";
  const params = new URLSearchParams({
    "f": "json",
    "where": "1=1",
    "outFields": "*",
    "orderByFields": "issue_date DESC",
    "resultRecordCount": limit.toString()
  });
  
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Louisville API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { features: Array<{ attributes: unknown }> };
  return data.features.map(f => f.attributes);
}

async function fetchMontgomeryPermits(limit: number): Promise<unknown[]> {
  const url = "https://data.montgomerycountymd.gov/resource/i26v-w6bd.json";
  const params = new URLSearchParams({
    "$limit": limit.toString(),
    "$order": "issueddate DESC",
    "$where": "permitstatus = 'Issued' AND totalvalue > 10000"
  });
  
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Montgomery API error: ${response.status} ${response.statusText}`);
  }
  return await response.json() as unknown[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const orgId = await getOrgIdFromReq(req);
    if (!orgId) {
      return res.status(401).json({ ok: false, error: "Organization not found" });
    }
    await assertPermission(req, res, PERMS.LEAD_CREATE);

    const { 
      source = "austin", 
      limit = 25,
      minValue = 25000, // Minimum project value for hot leads
      state = "TX"
    } = req.body;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ ok: false, error: "limit must be 1-100" });
    }

    let rawData: unknown[] = [];
    
    // Fetch from the selected permit source
    switch (source) {
      case "austin":
        rawData = await fetchAustinPermits(limit);
        break;
      case "louisville":
        rawData = await fetchLouisvillePermits(limit);
        break;
      case "montgomery":
        rawData = await fetchMontgomeryPermits(limit);
        break;
      default:
        return res.status(400).json({ ok: false, error: "Invalid source. Use: austin, louisville, montgomery" });
    }

    const items: Array<{
      permitNumber: string;
      publicId: string;
      created: boolean;
      unitPriceCents: number;
      reason?: string;
    }> = [];

    for (const raw of rawData) {
      const permit = normalizePermitItem(raw, source);
      
      if (!permit.permitNumber) {
        items.push({
          permitNumber: "UNKNOWN",
          publicId: "MISSING_ID",
          created: false,
          unitPriceCents: 0,
          reason: "Missing permit number"
        });
        continue;
      }

      // Filter for valuable projects (hot leads)
      if (permit.permitValue && permit.permitValue < minValue) {
        items.push({
          permitNumber: permit.permitNumber,
          publicId: `PERMIT_${source.toUpperCase()}_${permit.permitNumber}`,
          created: false,
          unitPriceCents: 0,
          reason: `Project value $${permit.permitValue} below minimum $${minValue}`
        });
        continue;
      }

      const publicId = `PERMIT_${source.toUpperCase()}_${permit.permitNumber}`;
      
      // Check if this permit already exists
      const existingLead = await db.lead.findFirst({
        where: { orgId, publicId }
      });

      if (existingLead) {
        items.push({
          permitNumber: permit.permitNumber,
          publicId,
          created: false,
          unitPriceCents: 0,
          reason: "Duplicate permit"
        });
        continue;
      }

      // Extract potential contact info
      const company = permit.contractorName || `${permit.city} Construction Project`;
      const name = permit.contractorName || "Project Contact";
      const phoneE164 = permit.contractorPhone;
      
      const identity = identityHash({ 
        email: null, 
        phoneE164, 
        company, 
        name 
      });

      const enrichment = makeEnrichment(permit, source);
      
      // Generate lead title based on permit info
      const title = permit.projectDescription 
        ? `Post-Construction Cleaning - ${permit.projectDescription}`
        : `Construction Cleaning Opportunity - ${permit.constructionType || 'Building Project'}`;

      // Score the lead (construction permits are hot leads)
      const score = await scoreLeadNormalized({
        sourceType: "CONSTRUCTION_PERMIT",
        name: title,
        company,
        serviceDescription: `Post-construction cleaning for ${permit.constructionType || 'construction project'}`,
        city: permit.city || "",
        state: permit.state || state
      });

      // Create the lead
      await db.lead.create({
        data: {
          orgId,
          publicId,
          identityHash: identity,
          contactName: name,
          company,
          email: null,
          phoneE164: phoneE164 || null,
          city: permit.city || "",
          state: permit.state || state,
          zip: permit.zip || "",
          address: permit.propertyAddress || "",
          aiScore: score.score,
          source: LeadSource.RFP,
          status: LeadStatus.NEW,
          enrichmentJson: enrichment,
        }
      });

      items.push({
        permitNumber: permit.permitNumber,
        publicId,
        created: true,
        unitPriceCents: 0
      });
    }

    const totalCents = items.filter(it => it.created).reduce((sum, it) => sum + (it.unitPriceCents || 0), 0);

    return res.status(200).json({
      ok: true,
      count: items.length,
      created: items.filter(it => it.created).length,
      skipped: items.filter(it => !it.created).length,
      totalCents,
      totalDollars: (totalCents / 100).toFixed(2),
      items,
      source,
      message: `Imported ${items.filter(it => it.created).length} hot construction leads from ${source}`
    });

  } catch (error) {
    console.error("Construction permits import error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}