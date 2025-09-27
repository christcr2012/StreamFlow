// src/pages/api/leads/industry-config.ts
// Industry-Specific Lead Intake Configuration API
// Provides dynamic form fields and validation based on organization's industry

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

interface IndustryLeadConfig {
  industryType: string | null;
  displayName: string;
  leadFields: Record<string, any>;
  leadTypes: string[];
  defaultValues: Record<string, any>;
  validation: Record<string, any>;
  scoringFactors: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
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
        name: true,
        industryType: true,
        industryConfig: true,
        activeCapabilities: true,
        industryPack: {
          select: {
            displayName: true,
            leadFields: true,
            workflowSteps: true,
            measurementUnits: true,
            requiredCapabilities: true
          }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Build industry-specific lead configuration
    const config: IndustryLeadConfig = {
      industryType: org.industryType,
      displayName: org.industryPack?.displayName || "General Services",
      leadFields: (org.industryPack?.leadFields as Record<string, any>) || getDefaultLeadFields(),
      leadTypes: getLeadTypesForIndustry(org.industryType),
      defaultValues: getDefaultValuesForIndustry(org.industryType),
      validation: getValidationRulesForIndustry(org.industryType),
      scoringFactors: getScoringFactorsForIndustry(org.industryType)
    };

    res.status(200).json({
      ok: true,
      config
    });

  } catch (error: unknown) {
    console.error("Industry config API error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: message });
  }
}

// Default lead fields for organizations without industry packs
function getDefaultLeadFields() {
  return {
    serviceType: {
      type: "select",
      label: "Service Type",
      options: ["consultation", "service", "maintenance", "installation"],
      required: true
    },
    propertySize: {
      type: "number",
      label: "Property Size",
      placeholder: "Square footage or area",
      min: 1,
      required: false
    },
    urgency: {
      type: "select",
      label: "Urgency",
      options: ["routine", "priority", "urgent", "emergency"],
      required: true,
      default: "routine"
    },
    budget: {
      type: "select",
      label: "Budget Range",
      options: ["under_1000", "1000_5000", "5000_10000", "10000_plus"],
      required: false
    },
    timeline: {
      type: "select", 
      label: "Timeline",
      options: ["immediate", "within_week", "within_month", "flexible"],
      required: true
    },
    specialRequirements: {
      type: "textarea",
      label: "Special Requirements",
      placeholder: "Any specific requirements or notes...",
      required: false
    }
  };
}

// Get available lead types based on industry
function getLeadTypesForIndustry(industryType: string | null): string[] {
  const allTypes = [
    { value: "job", label: "Job/Project Lead" },
    { value: "relationship", label: "Relationship Lead" },
    { value: "permit", label: "Permit/Compliance Lead" },
    { value: "government", label: "Government Contract Lead" }
  ];

  // Industry-specific filtering
  switch (industryType) {
    case "cleaning":
      return allTypes.filter(t => ["job", "relationship"].includes(t.value)).map(t => t.value);
    
    case "hvac":
      return allTypes.filter(t => ["job", "relationship", "permit"].includes(t.value)).map(t => t.value);
    
    case "fencing":
      return allTypes.filter(t => ["job", "permit", "government"].includes(t.value)).map(t => t.value);
    
    default:
      return allTypes.map(t => t.value);
  }
}

// Get default field values based on industry
function getDefaultValuesForIndustry(industryType: string | null): Record<string, any> {
  switch (industryType) {
    case "cleaning":
      return {
        leadType: "job",
        frequency: "weekly",
        serviceTypes: ["general_cleaning"]
      };
    
    case "hvac":
      return {
        leadType: "job",
        serviceType: "maintenance",
        urgency: "routine"
      };
    
    case "fencing":
      return {
        leadType: "job", 
        projectType: "new_installation",
        fenceType: "wood"
      };
    
    default:
      return {
        leadType: "job",
        urgency: "routine"
      };
  }
}

// Get validation rules based on industry
function getValidationRulesForIndustry(industryType: string | null): Record<string, any> {
  const baseRules = {
    company: { required: false, minLength: 2, maxLength: 100 },
    contactName: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, format: "email" },
    phoneE164: { required: false, format: "phone" }
  };

  switch (industryType) {
    case "cleaning":
      return {
        ...baseRules,
        squareFootage: { required: true, min: 100, max: 1000000 },
        frequency: { required: true }
      };
    
    case "hvac":
      return {
        ...baseRules,
        serviceType: { required: true },
        buildingType: { required: true }
      };
    
    case "fencing":
      return {
        ...baseRules,
        linearFeet: { required: true, min: 10, max: 10000 },
        height: { required: true },
        fenceType: { required: true }
      };
    
    default:
      return baseRules;
  }
}

// Get industry-specific scoring factors
function getScoringFactorsForIndustry(industryType: string | null): string[] {
  const baseFactors = ["lead_completeness", "contact_quality", "timeline_urgency"];

  switch (industryType) {
    case "cleaning":
      return [...baseFactors, "property_size", "frequency_commitment", "location_accessibility"];
    
    case "hvac":
      return [...baseFactors, "equipment_age", "service_complexity", "seasonal_timing"];
    
    case "fencing":
      return [...baseFactors, "project_size", "material_preference", "permit_requirements"];
    
    default:
      return baseFactors;
  }
}