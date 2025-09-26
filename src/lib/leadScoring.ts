// src/lib/leadScoring.ts
// Lead Scoring Engine - Northern Colorado Cleaning Business
// Lead scoring utilities. Scoring is driven by a configuration file (see
// src/config/leadScoringConfig.ts). Each lead is assigned a baseline score
// which is adjusted based on geography, service keywords and the lead’s source
// type. A list of reasons is returned alongside the numeric score.

import config from "@/config/leadScoringConfig";

// Lead data structure for scoring input
// Flexible interface accepts leads from various sources (SAM.gov, permits, manual entry)
export type LeadLike = {
  // GEOGRAPHIC TARGETING (drives proximity scoring)
  city?: string | null;          // Primary city for service delivery
  state?: string | null;         // State (Colorado gets +10 bonus)
  zip?: string | null;           // ZIP code (806xx/807xx get county bonus)
  
  // SERVICE CLASSIFICATION (drives service type scoring)
  serviceCode?: string | null;      // Primary service type code
  sourceType?: string | null;      // Maps to LeadSource enum (RFP, SYSTEM, etc)
  sourceDetail?: string | null;    // Additional source context
  leadType?: 'hot' | 'warm' | 'cold' | null; // Purchase intent level
  serviceDescription?: string | null; // Full service description
  title?: string | null;           // Lead title
  
  // GOVERNMENT CONTRACT FIELDS (for SAM.gov RFPs)
  agency?: string | null;          // Government agency name
  naics?: string | null;           // NAICS industry code
  psc?: string | null;             // Product Service Code
};

// Scoring result with detailed reasoning for transparency
export type ScoreResult = { 
  score: number;      // Final score (1-99, higher = higher priority)
  reasons: string[];  // Human-readable explanations for sales team
};

/**
 * Compute a lead score based on the lead’s attributes and the current scoring
 * configuration. Scores are clamped between 1 and 99. Reasons describe
 * which factors contributed to the score.
 */
export function scoreLead(lead: LeadLike): ScoreResult {
  let score = 50; // Baseline score - average lead with no special factors
  const reasons: string[] = []; // Track scoring factors for transparency

  const city = (lead.city || "").trim().toLowerCase();
  const state = (lead.state || "").trim().toUpperCase();
  const zip = (lead.zip || "").trim();
  const svc = (lead.serviceCode || "").trim().toLowerCase();
  const srcType = (lead.sourceType || "").trim().toUpperCase();
  const detail = (lead.sourceDetail || "").trim().toLowerCase();

  // Geographic weighting: state and priority cities/counties
  if (state === "CO") {
    score += 10;
    reasons.push("Colorado service area");
  }
  if (city && config.geoPriority[city]) {
    score += config.geoPriority[city];
    reasons.push(`Priority city: ${city}`);
  }
  // Recognize Logan/Weld county prefixes (806xx, 807xx) in ZIP
  if (/^806|^807/.test(zip)) {
    score += 8;
    reasons.push(`ZIP in target bands (${zip.slice(0, 3)}xx)`);
  }

  // Service weighting: match substring within service code/description
  for (const key of Object.keys(config.serviceWeights)) {
    if (svc.includes(key)) {
      const pts = config.serviceWeights[key];
      score += pts;
      reasons.push(`Service match: ${key}`);
      break;
    }
  }

  // Source weighting: use sourceType; fallback to heuristics based on detail
  if (srcType) {
    const pts = config.sourceWeights[srcType as keyof typeof config.sourceWeights];
    if (typeof pts === "number") {
      score += pts;
      reasons.push(`Source type: ${srcType}`);
    }
  }
  // Additional boost if SAM/RFP keywords appear in detail
  if (detail.includes("sam.gov") || detail.includes("rfp")) {
    score += config.sourceWeights.RFP ?? 12;
    reasons.push("Government RFP (SAM.gov)");
  }

  // Service description keyword matching
  const serviceDesc = (lead.serviceDescription || lead.title || "").toLowerCase();
  for (const key of Object.keys(config.serviceWeights)) {
    if (serviceDesc.includes(key)) {
      const pts = Math.floor(config.serviceWeights[key] * 0.5); // Half points for description match
      score += pts;
      reasons.push(`Service description match: ${key}`);
      break;
    }
  }

  // Apply lead type modifier (hot/warm/cold)
  const leadType = lead.leadType?.toLowerCase() as keyof typeof config.leadTypeModifiers;
  if (leadType && config.leadTypeModifiers[leadType]) {
    const modifier = config.leadTypeModifiers[leadType];
    const originalScore = score;
    score = Math.round(score * modifier);
    reasons.push(`${leadType.toUpperCase()} lead modifier: ${modifier}x (${originalScore} → ${score})`);
  }

  // Clamp between 1 and 99
  score = Math.max(1, Math.min(99, Math.round(score)));
  return { score, reasons };
}

/**
 * Determine if a lead appears to be system-generated. This helper remains for
 * backwards compatibility. It checks the sourceDetail string for common
 * indicators. New code should prefer the systemGenerated flag on Lead.
 */
export function isSystemGenerated(sourceDetail?: string | null): boolean {
  const d = (sourceDetail || "").toLowerCase();
  return d.includes("sam.gov") || d.includes("rfp");
}