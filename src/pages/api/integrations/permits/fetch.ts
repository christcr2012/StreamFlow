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

/** Extract useful info from different Colorado permit API formats */
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
    case "weld":
      // Weld County (Sterling, Greeley) - mock data structure
      return {
        permitNumber: getString("permit_number"),
        projectDescription: getString("project_description"),
        permitType: getString("permit_type"),
        contractorName: getString("contractor_name"),
        contractorPhone: getString("contractor_phone"),
        propertyAddress: getString("address"),
        city: getString("city"),
        state: getString("state") || "CO",
        zip: getString("zip"),
        permitValue: getNumber("permit_value"),
        issuedDate: getString("issued_date"),
        constructionType: getString("construction_type"),
        workDescription: getString("project_description")
      };
      
    case "fortcollins":
      // Fort Collins ArcGIS API format
      return {
        permitNumber: getString("PERMIT_NUM") || getString("permit_number"),
        projectDescription: getString("DESCRIPTION") || getString("PROJECT_DESC"),
        permitType: getString("PERMIT_TYPE"),
        contractorName: getString("CONTRACTOR") || getString("CONTRACTOR_NAME"),
        contractorPhone: getString("CONTRACTOR_PHONE"),
        propertyAddress: getString("ADDRESS") || getString("LOCATION"),
        city: getString("CITY") || "Fort Collins",
        state: getString("STATE") || "CO",
        zip: getString("ZIP"),
        permitValue: getNumber("VALUATION") || getNumber("PERMIT_VALUE"),
        issuedDate: getString("ISSUED_DATE") || getString("DATE_ISSUED"),
        constructionType: getString("WORK_TYPE") || getString("PERMIT_TYPE"),
        workDescription: getString("DESCRIPTION")
      };
      
    case "denver":
      // Denver Accela system - mock data structure
      return {
        permitNumber: getString("permit_number"),
        projectDescription: getString("project_description"),
        permitType: getString("permit_type"),
        contractorName: getString("contractor_name"),
        contractorPhone: getString("contractor_phone"),
        propertyAddress: getString("address"),
        city: getString("city") || "Denver",
        state: getString("state") || "CO",
        zip: getString("zip"),
        permitValue: getNumber("permit_value"),
        issuedDate: getString("issued_date"),
        constructionType: getString("construction_type"),
        workDescription: getString("project_description")
      };
      
    default:
      // Generic mapping for Colorado sources
      return {
        permitNumber: getString("permit_number") || getString("permit_id") || getString("id"),
        projectDescription: getString("description") || getString("project_description"),
        permitType: getString("permit_type") || getString("type"),
        contractorName: getString("contractor_name") || getString("contractor") || getString("applicant_name"),
        contractorPhone: getString("contractor_phone") || getString("phone"),
        propertyAddress: getString("address") || getString("location") || getString("property_address"),
        city: getString("city"),
        state: getString("state") || "CO",
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

async function fetchWeldCountyPermits(limit: number): Promise<unknown[]> {
  // Note: Weld County uses Accela system which may not have direct API access
  // For now, return mock data structure to demonstrate the pattern
  // In production, this would integrate with Weld County's permit system
  
  const mockPermits = [
    {
      permit_number: "2024-001234",
      project_description: "New Commercial Building - Office Complex", 
      permit_type: "COMMERCIAL",
      contractor_name: "Sterling Construction LLC",
      contractor_phone: "(970) 522-1234",
      address: "1234 Main St",
      city: "Sterling",
      state: "CO",
      zip: "80751",
      permit_value: 150000,
      issued_date: "2024-12-20",
      construction_type: "New Construction"
    },
    {
      permit_number: "2024-001235", 
      project_description: "Warehouse Expansion",
      permit_type: "COMMERCIAL",
      contractor_name: "Greeley Builders Inc",
      contractor_phone: "(970) 352-5678",
      address: "5678 Industrial Blvd",
      city: "Greeley", 
      state: "CO",
      zip: "80631",
      permit_value: 75000,
      issued_date: "2024-12-19",
      construction_type: "Addition"
    }
  ];
  
  return mockPermits.slice(0, limit);
}

async function fetchFortCollinsPermits(limit: number): Promise<unknown[]> {
  // Fort Collins ArcGIS Open Data API
  const url = "https://services.arcgis.com/YY1W1B93GvV1YFqy/arcgis/rest/services/Building_Permits/FeatureServer/0/query";
  const params = new URLSearchParams({
    "f": "json", 
    "where": "1=1",
    "outFields": "*",
    "orderByFields": "ISSUED_DATE DESC",
    "resultRecordCount": limit.toString()
  });
  
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Fort Collins API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { features: Array<{ attributes: unknown }> };
  return data.features.map(f => f.attributes);
}

async function fetchDenverPermits(limit: number): Promise<unknown[]> {
  // Note: Denver uses Accela system which requires specific integration
  // For now, return mock data for high-value contracts only
  
  const mockPermits = [
    {
      permit_number: "DEN-2024-5678",
      project_description: "High-Rise Office Development",
      permit_type: "COMMERCIAL",
      contractor_name: "Denver Commercial Construction",
      contractor_phone: "(303) 555-9876", 
      address: "1600 17th St",
      city: "Denver",
      state: "CO",
      zip: "80202",
      permit_value: 2500000, // High value only for Denver area
      issued_date: "2024-12-18",
      construction_type: "New Construction"
    }
  ];
  
  return mockPermits.slice(0, limit);
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
      source = "weld", 
      limit = 25,
      minValue = 25000, // Minimum project value for hot leads
      state = "CO"
    } = req.body;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ ok: false, error: "limit must be 1-100" });
    }

    let rawData: unknown[] = [];
    
    // Fetch from the selected Colorado permit source
    switch (source) {
      case "weld":
        rawData = await fetchWeldCountyPermits(limit);
        break;
      case "fortcollins":
        rawData = await fetchFortCollinsPermits(limit);
        break;
      case "denver":
        rawData = await fetchDenverPermits(limit);
        break;
      default:
        return res.status(400).json({ ok: false, error: "Invalid source. Use: weld, fortcollins, denver" });
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

      // Filter for valuable projects and Colorado geography
      const city = permit.city?.toLowerCase() || "";
      const isColoradoCity = ["sterling", "greeley", "evans", "fort collins", "loveland", 
                              "windsor", "denver", "arvada", "westminster", "thornton",
                              "longmont", "boulder", "lafayette", "brighton", "commerce city"].includes(city);
      
      if (!isColoradoCity) {
        items.push({
          permitNumber: permit.permitNumber,
          publicId: `PERMIT_${source.toUpperCase()}_${permit.permitNumber}`,
          created: false,
          unitPriceCents: 0,
          reason: `Location ${permit.city} outside Northern Colorado service area`
        });
        continue;
      }

      // Apply higher minimum for Denver area (only very high value)
      const effectiveMinValue = city === "denver" || city === "arvada" || 
                               city === "westminster" || city === "thornton" ? 
                               minValue * 3 : minValue; // 3x higher threshold for Denver area
      
      if (permit.permitValue && permit.permitValue < effectiveMinValue) {
        items.push({
          permitNumber: permit.permitNumber,
          publicId: `PERMIT_${source.toUpperCase()}_${permit.permitNumber}`,
          created: false,
          unitPriceCents: 0,
          reason: `Project value $${permit.permitValue} below minimum $${effectiveMinValue} for ${permit.city}`
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

      // Score the lead (construction permits are warm leads - they'll need cleaning but aren't actively seeking it)
      const score = await scoreLeadNormalized({
        sourceType: "SYSTEM",
        leadType: "warm", // Warm leads get 1.0x modifier (no boost)
        title: title,
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
          sourceType: LeadSource.SYSTEM,
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
      message: `Imported ${items.filter(it => it.created).length} warm construction leads from ${source}`
    });

  } catch (error) {
    console.error("Construction permits import error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}