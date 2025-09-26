// src/pages/api/integrations/permits/fetch.ts
// Construction Permits Integration - Northern Colorado WARM Lead Generation
//
// PURPOSE:
// Imports construction permits from Northern Colorado municipalities to identify
// WARM LEADS for post-construction cleaning services. These are properties that
// will need cleaning after construction completes, but owners aren't actively
// seeking cleaning services yet.
//
// GEOGRAPHIC FOCUS:
// - Sterling, CO (headquarters) - highest priority
// - Greeley area (Weld County) - primary market
// - Fort Collins/Loveland - secondary market  
// - Denver area - high-value projects only ($75k+ minimum)
//
// DATA SOURCES:
// - Weld County: Accela system (currently mock data, needs API integration)
// - Fort Collins: Live ArcGIS Open Data API
// - Denver: Accela system (currently mock data, needs API integration)
//
// LEAD CLASSIFICATION:
// - These are WARM leads (not actively seeking services, scores via config.thresholds: warm 40-69)
// - Need relationship building and education about post-construction cleaning
// - Geographic filtering ensures only Northern Colorado projects
// - Value filtering prevents low-value residential projects
//
// FUTURE INTEGRATIONS:
// - Real Weld County API integration (currently using mock data)
// - Real Denver API integration (currently using mock data)
// - Add Logan County permits (Sterling area)
// - Add permit status tracking (completion dates for follow-up timing)
// - Add contractor contact enrichment for warm introductions

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { scoreLeadNormalized } from "@/lib/leadScoringAdapter";

// All leads are FREE - no billing charges (core business model)
const DEFAULT_UNIT_PRICE_CENTS = 0; // $0.00 - 100% free lead generation

// Generate short, consistent hash for lead deduplication
function sha256_24(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 24);
}

// Create stable identity hash for lead deduplication across permit imports
// Uses available contact info to prevent duplicate leads for same project
function identityHash(input: { email?: string | null; phoneE164?: string | null; company?: string | null; name?: string | null }) {
  const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();
  const key = [norm(input.email), norm(input.phoneE164), norm(input.company), norm(input.name)].filter(Boolean).join("|");
  return sha256_24(key);
}

// Safe JSON conversion for Prisma enrichment fields
function asJson(v: unknown): Prisma.InputJsonValue {
  return (v ?? {}) as Prisma.InputJsonValue;
}

// Normalized permit data structure from various Colorado API sources
// This standardizes data from different municipal systems for consistent processing
type PermitItem = {
  permitNumber?: string;        // Unique permit ID for deduplication
  projectDescription?: string;  // Project details for lead title generation
  permitType?: string;         // COMMERCIAL, RESIDENTIAL, etc (filter for commercial)
  contractorName?: string;     // Primary contact for outreach
  contractorPhone?: string;    // Phone number for direct contact
  propertyAddress?: string;    // Project location
  city?: string;              // For geographic scoring (Sterling > Greeley > etc)
  state?: string;             // Should be "CO" for all Northern Colorado permits
  zip?: string;               // Additional geographic context
  permitValue?: number;       // Project value for filtering (minimum thresholds)
  issuedDate?: string;        // When permit was issued (for timing follow-up)
  constructionType?: string;  // New construction, renovation, etc
  workDescription?: string;   // Additional project details
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

// WELD COUNTY PERMITS - Greeley, Evans, Sterling area
// TODO: Integrate with real Weld County Accela API
// Current status: Using mock data to demonstrate structure
// API endpoint: https://aca-prod.accela.com/WELD/Default.aspx (needs authentication)
async function fetchWeldCountyPermits(limit: number): Promise<unknown[]> {
  // IMPLEMENTATION NOTES:
  // - Weld County uses Accela Citizen Access system
  // - May require API key or web scraping approach
  // - Focus on commercial permits over $25k
  // - Priority cities: Greeley, Evans, unincorporated Weld County
  // - Sterling is actually in Logan County (separate system needed)
  
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

// FORT COLLINS PERMITS - Live ArcGIS Open Data Integration
// This is the only fully-implemented live API integration
// Status: PRODUCTION READY - pulls real permit data
async function fetchFortCollinsPermits(limit: number): Promise<unknown[]> {
  // Fort Collins GIS Open Data - free, no API key required
  const url = "https://services.arcgis.com/YY1W1B93GvV1YFqy/arcgis/rest/services/Building_Permits/FeatureServer/0/query";
  const params = new URLSearchParams({
    "f": "json", 
    "where": "1=1",                    // TODO: Add filter for commercial permits only
    "outFields": "*",                 // Get all available fields
    "orderByFields": "ISSUED_DATE DESC", // Newest permits first
    "resultRecordCount": limit.toString()
  });
  
  // ENHANCEMENT OPPORTUNITIES:
  // - Add where clause: "PERMIT_TYPE LIKE '%COMMERCIAL%'"
  // - Add minimum valuation filter: "VALUATION > 25000"
  // - Add date range filter for recent permits only
  // - Add specific construction types that need cleaning
  
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Fort Collins API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { features: Array<{ attributes: unknown }> };
  return data.features.map(f => f.attributes);
}

// DENVER PERMITS - High-value commercial projects only
// TODO: Integrate with real Denver Accela API
// Current status: Using mock data for high-value projects only
// API endpoint: https://aca-prod.accela.com/DENVER/Default.aspx (needs authentication)
async function fetchDenverPermits(limit: number): Promise<unknown[]> {
  // BUSINESS LOGIC:
  // - Denver is 2+ hours drive from Sterling headquarters
  // - Only pursue high-value contracts ($75k+ minimum)
  // - Focus on downtown commercial and major developments
  // - Very competitive market - need strong value proposition
  //
  // IMPLEMENTATION NOTES:
  // - Denver uses Accela platform like Weld County
  // - May require different authentication approach
  // - Should filter for projects >$250k (3x normal minimum)
  // - Focus on multi-building developments for ongoing relationships
  
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

      // === GEOGRAPHIC FILTERING - Northern Colorado Service Area Only ===
      // Reject permits outside service area to avoid wasting sales time
      const city = permit.city?.toLowerCase() || "";
      const isColoradoCity = [
        // TIER 1: Sterling headquarters area
        "sterling", 
        // TIER 2: Primary service area (Weld County)
        "greeley", "evans",
        // TIER 3: Secondary service area 
        "fort collins", "loveland", "windsor",
        // TIER 4: Extended area (selective)
        "longmont", "boulder", "lafayette", "brighton", "commerce city",
        // TIER 5: Denver metro (high-value only)
        "denver", "arvada", "westminster", "thornton"
      ].includes(city);
      
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

      // === VALUE-BASED FILTERING - Ensure profitable project sizes ===
      // Denver area requires 3x higher minimum due to distance and competition
      const isDenverArea = ["denver", "arvada", "westminster", "thornton"].includes(city);
      const effectiveMinValue = isDenverArea ? minValue * 3 : minValue;
      
      // BUSINESS RATIONALE:
      // - Sterling area: $25k minimum (short drive, low competition)
      // - Greeley area: $25k minimum (primary market, established presence)
      // - Fort Collins: $25k minimum (competitive but manageable)
      // - Denver area: $75k minimum (long drive, high competition, need strong ROI)
      
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
      message: `Imported ${items.filter(it => it.created).length} WARM construction leads from ${source} (post-construction cleaning opportunities)`
    });

  } catch (error) {
    console.error("Construction permits import error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
}