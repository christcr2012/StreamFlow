// src/pages/api/leads/create.ts
// Enhanced Lead Creation API with Multi-Industry Support
// Handles industry-specific custom fields and scoring

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import crypto from "node:crypto";

// Generate unique lead public ID
function generateLeadPublicId(): string {
  return `LEAD_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

// Create identity hash for deduplication
function createIdentityHash(data: {
  email?: string | null;
  phoneE164?: string | null;
  company?: string | null;
  contactName?: string | null;
}) {
  const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();
  const key = [
    normalize(data.email),
    normalize(data.phoneE164),
    normalize(data.company),
    normalize(data.contactName)
  ].filter(Boolean).join("|");
  
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 24);
}

// Industry-specific AI scoring
function calculateIndustryScore(
  leadData: any,
  industryType: string | null,
  customFields: Record<string, any>
): number {
  let baseScore = 50; // Start with neutral score
  const factors: string[] = [];

  // Base scoring factors
  if (leadData.email) baseScore += 10;
  if (leadData.phoneE164) baseScore += 10;
  if (leadData.company) baseScore += 5;
  if (leadData.contactName) baseScore += 5;

  // Industry-specific scoring
  switch (industryType) {
    case "cleaning":
      return calculateCleaningScore(baseScore, customFields, factors);
      
    case "hvac":
      return calculateHvacScore(baseScore, customFields, factors);
      
    case "fencing":
      return calculateFencingScore(baseScore, customFields, factors);
      
    default:
      return Math.min(100, Math.max(0, baseScore));
  }
}

function calculateCleaningScore(baseScore: number, fields: any, factors: string[]): number {
  // Property size scoring
  if (fields.squareFootage) {
    const size = parseInt(fields.squareFootage);
    if (size > 10000) { baseScore += 15; factors.push("Large property"); }
    else if (size > 5000) { baseScore += 10; factors.push("Medium property"); }
    else if (size > 1000) { baseScore += 5; factors.push("Standard property"); }
  }

  // Frequency commitment scoring
  if (fields.frequency === "daily") { baseScore += 20; factors.push("Daily frequency"); }
  else if (fields.frequency === "weekly") { baseScore += 15; factors.push("Weekly frequency"); }
  else if (fields.frequency === "biweekly") { baseScore += 10; factors.push("Bi-weekly frequency"); }

  // Service types - specialized services score higher
  if (fields.serviceTypes?.includes("disinfection")) { baseScore += 10; factors.push("Specialized disinfection"); }
  if (fields.serviceTypes?.includes("floor_care")) { baseScore += 8; factors.push("Floor care specialty"); }

  return Math.min(100, Math.max(0, baseScore));
}

function calculateHvacScore(baseScore: number, fields: any, factors: string[]): number {
  // Urgency scoring
  if (fields.urgency === "emergency") { baseScore += 25; factors.push("Emergency service"); }
  else if (fields.urgency === "priority") { baseScore += 15; factors.push("Priority service"); }
  
  // Equipment age scoring (older equipment = higher maintenance needs)
  if (fields.equipmentAge === "10+_years") { baseScore += 15; factors.push("Aging equipment"); }
  else if (fields.equipmentAge === "6-10_years") { baseScore += 10; factors.push("Mature equipment"); }

  // Service complexity
  if (fields.serviceType === "installation") { baseScore += 20; factors.push("Installation project"); }
  else if (fields.serviceType === "repair") { baseScore += 15; factors.push("Repair needed"); }

  return Math.min(100, Math.max(0, baseScore));
}

function calculateFencingScore(baseScore: number, fields: any, factors: string[]): number {
  // Project size scoring
  if (fields.linearFeet) {
    const feet = parseInt(fields.linearFeet);
    if (feet > 1000) { baseScore += 20; factors.push("Large project"); }
    else if (feet > 500) { baseScore += 15; factors.push("Medium project"); }
    else if (feet > 100) { baseScore += 10; factors.push("Standard project"); }
  }

  // Material preference (higher margins)
  if (fields.fenceType === "iron") { baseScore += 15; factors.push("Premium materials"); }
  else if (fields.fenceType === "vinyl") { baseScore += 12; factors.push("Mid-tier materials"); }
  
  // Gate complexity
  if (fields.gateCount > 2) { baseScore += 10; factors.push("Multiple gates"); }
  else if (fields.gateCount > 0) { baseScore += 5; factors.push("Gate installation"); }

  return Math.min(100, Math.max(0, baseScore));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Get authenticated user and their organization
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get organization with industry configuration
    const org = await db.org.findUnique({
      where: { id: user.orgId },
      select: {
        id: true,
        industryType: true,
        industryPack: {
          select: {
            leadFields: true,
            displayName: true
          }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Parse request body
    const {
      // Basic contact information
      company,
      contactName,
      email,
      phoneE164,
      website,
      
      // Industry and service information
      leadType = "job",
      serviceCode,
      naicsCode,
      sicCode,
      
      // Address information
      address,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
      postalCode,
      country = "US",
      
      // Custom fields (industry-specific)
      customFields = {},
      
      // Source information
      sourceType = "MANUAL_NEW_CUSTOMER",
      sourceDetail,
      notes
      
    } = req.body;

    // Validation
    if (!contactName && !company) {
      return res.status(400).json({ error: "Either contact name or company name is required" });
    }

    if (!email && !phoneE164) {
      return res.status(400).json({ error: "Either email or phone number is required" });
    }

    // Create identity hash for deduplication
    const identityHash = createIdentityHash({
      email,
      phoneE164,
      company,
      contactName
    });

    // Check for existing lead with same identity
    const existingLead = await db.lead.findFirst({
      where: {
        orgId: user.orgId,
        identityHash
      }
    });

    if (existingLead) {
      return res.status(409).json({ 
        error: "Duplicate lead detected",
        existingLeadId: existingLead.publicId
      });
    }

    // Calculate industry-specific AI score
    const aiScore = calculateIndustryScore(
      { email, phoneE164, company, contactName },
      org.industryType,
      customFields
    );

    // Create the lead
    const lead = await db.lead.create({
      data: {
        orgId: user.orgId,
        publicId: generateLeadPublicId(),
        sourceType: sourceType as any,
        identityHash,
        
        // Basic contact information
        company: company || null,
        contactName: contactName || null,
        email: email || null,
        phoneE164: phoneE164 || null,
        website: website || null,
        
        // Industry and service information
        industryType: org.industryType,
        leadType,
        naicsCode: naicsCode || null,
        sicCode: sicCode || null,
        serviceCode: serviceCode || null,
        
        // Address information
        address: address || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        postalCode: postalCode || null,
        country,
        
        // Custom fields and intelligence
        customFields,
        aiScore,
        scoreFactors: { 
          industry: org.industryType || "general",
          factors: ["Industry-specific scoring applied"],
          score: aiScore
        },
        enrichmentJson: {},
        
        // Additional information
        notes: notes || null,
        sourceDetail: sourceDetail || null,
        status: "NEW"
      },
      select: {
        id: true,
        publicId: true,
        company: true,
        contactName: true,
        email: true,
        industryType: true,
        leadType: true,
        customFields: true,
        aiScore: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`🎯 Created ${org.industryType || 'general'} lead ${lead.publicId} with score ${aiScore}`);

    res.status(201).json({
      ok: true,
      lead
    });

  } catch (error: unknown) {
    console.error("Lead creation error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: message });
  }
}