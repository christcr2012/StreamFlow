// src/lib/leadConflictResolution.ts
/**
 * Industry-leading conflict resolution and anti-fraud system for lead management.
 * 
 * BUSINESS RULES:
 * 1. Employee referrals = Client pays employee $50 directly (NO Provider billing)
 * 2. System/AI leads = Provider charges client $100 (NO employee reward)
 * 3. Manual entries = No Provider billing, no employee reward
 * 4. CRITICAL: Never double-payment (Provider + Employee for same lead)
 */

/*
=== ENTERPRISE ROADMAP: LEAD DEDUPLICATION & DATA QUALITY ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Basic identity hashing for duplicate detection
- Simple fraud risk assessment
- Manual conflict resolution
- Limited data validation

ENTERPRISE CRM COMPARISON (Salesforce, HubSpot, Microsoft Dynamics):
1. Advanced Duplicate Detection:
   - Fuzzy matching algorithms (Jaro-Winkler, Levenshtein distance)
   - ML-powered duplicate detection with confidence scores
   - Cross-object deduplication (leads, contacts, accounts)
   - Real-time duplicate prevention during data entry

2. Data Quality Management:
   - Automated data validation and cleansing
   - Email/phone verification services integration
   - Address standardization and validation
   - Company data enrichment from multiple sources

3. Advanced Fraud Detection:
   - Behavioral analysis and anomaly detection
   - IP geolocation and device fingerprinting
   - Velocity checks and pattern recognition
   - Integration with fraud detection services

IMPLEMENTATION ROADMAP:

Phase 1: Enhanced Duplicate Detection (3-4 weeks)
- Implement fuzzy string matching for company names and contacts
- Add phonetic matching (Soundex/Metaphone) for name variations
- Create confidence-based duplicate scoring
- Add bulk deduplication tools for existing data

Phase 2: Data Quality Platform (1-2 months)
- Integrate email verification service (ZeroBounce, NeverBounce)
- Add phone number validation and formatting
- Implement address standardization (USPS, Google)
- Create data quality dashboard and reporting

Phase 3: ML-Powered Deduplication (2-3 months)
- Train ML models for duplicate detection
- Implement active learning for improving detection accuracy
- Add automated merge suggestions with confidence scores
- Create deduplication rules engine with custom logic

Phase 4: Advanced Fraud Prevention (1-2 months)
- Implement behavioral analytics platform
- Add device fingerprinting and geolocation tracking
- Create risk scoring models for lead sources
- Add integration with external fraud detection APIs

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: Advanced duplicate detection result
export type DuplicateDetectionResult = {
  isDuplicate: boolean;
  confidence: number;           // 0-1 confidence score
  matchType: 'exact' | 'fuzzy' | 'phonetic' | 'semantic';
  matchedFields: string[];      // Which fields matched
  duplicateLeadId?: string;     // ID of existing duplicate
  suggestedAction: 'merge' | 'flag' | 'ignore';
  mergeSuggestions?: {
    keepField: string;
    sourceValue: string;
    targetValue: string;
    confidence: number;
  }[];
};

// ENTERPRISE FEATURE: Data quality assessment
export type DataQualityResult = {
  overallScore: number;         // 0-100 data quality score
  completeness: number;         // Field completeness score
  accuracy: number;             // Data accuracy score
  consistency: number;          // Data consistency score
  validations: {
    email: 'valid' | 'invalid' | 'risky' | 'unknown';
    phone: 'valid' | 'invalid' | 'mobile' | 'landline' | 'unknown';
    address: 'valid' | 'invalid' | 'partial' | 'unknown';
    company: 'verified' | 'unverified' | 'suspicious' | 'unknown';
  };
  enrichmentSuggestions: string[];
  validationErrors: string[];
};

// ENTERPRISE FEATURE: Enhanced fraud risk assessment
export type EnhancedFraudRisk = {
  riskScore: number;            // 0-100 risk score
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    velocityRisk: number;       // Submission velocity risk
    patternRisk: number;        // Suspicious pattern risk
    sourceRisk: number;         // Source reliability risk
    behavioralRisk: number;     // Behavioral anomaly risk
    deviceRisk: number;         // Device/IP risk
  };
  detailedReasons: string[];
  recommendedActions: string[];
  requiresManualReview: boolean;
};

import { LeadSource, type Lead } from "@prisma/client";
import { prisma as db } from "@/lib/prisma";
import { isReferralSource, isBillableSource } from "@/lib/billing";

export type ConflictResolutionResult = {
  providerBillable: boolean;
  employeeRewardEligible: boolean;
  conflictDetected: boolean;
  fraudRisk: 'low' | 'medium' | 'high';
  resolution: 'approved' | 'flagged' | 'blocked';
  reason: string;
  recommendedAction?: string;
};

export type LeadIdentityData = {
  company?: string | null;
  contactName?: string | null;
  email?: string | null;
  phoneE164?: string | null;
  website?: string | null;
  address?: string | null;
  identityHash: string;
};

/**
 * Generate identity hash for conflict detection.
 * Uses multiple data points to detect potential duplicates/conflicts.
 */
export function generateIdentityHash(data: Omit<LeadIdentityData, 'identityHash'>): string {
  const normalized = {
    company: data.company?.toLowerCase().trim() || '',
    email: data.email?.toLowerCase().trim() || '',
    phone: data.phoneE164?.replace(/\D/g, '') || '', // Remove non-digits
    website: data.website?.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') || ''
  };

  // Create composite hash from multiple identity points
  const composite = [
    normalized.company,
    normalized.email,
    normalized.phone,
    normalized.website
  ].filter(Boolean).join('|');

  // Simple hash function - in production, use crypto.createHash
  let hash = 0;
  for (let i = 0; i < composite.length; i++) {
    const char = composite.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Detect conflicts between existing leads and a new lead.
 * Returns details about potential conflicts and recommended resolution.
 */
export async function detectLeadConflicts(
  orgId: string,
  newLeadData: LeadIdentityData & { sourceType: LeadSource; sourceDetail?: string | null }
): Promise<ConflictResolutionResult> {
  
  // Find existing leads with same identity hash
  const existingLeads = await db.lead.findMany({
    where: {
      orgId,
      identityHash: newLeadData.identityHash,
    },
    select: {
      id: true,
      sourceType: true,
      sourceDetail: true,
      status: true,
      convertedAt: true,
      createdAt: true,
      enrichmentJson: true,
      systemGenerated: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Initialize result
  const result: ConflictResolutionResult = {
    providerBillable: false,
    employeeRewardEligible: false,
    conflictDetected: false,
    fraudRisk: 'low',
    resolution: 'approved',
    reason: 'No conflicts detected'
  };

  // If no existing leads, proceed with normal classification
  if (existingLeads.length === 0) {
    return classifyNewLead(newLeadData.sourceType, result);
  }

  // CONFLICT DETECTED
  result.conflictDetected = true;
  
  // Analyze existing leads for conflict type
  const hasProviderBillableLead = existingLeads.some(lead => {
    const billing = (lead.enrichmentJson as any)?.billing;
    return billing?.billableEligible === true;
  });

  const hasEmployeeReferralLead = existingLeads.some(lead => 
    isReferralSource(lead.sourceType) || 
    lead.sourceDetail?.toLowerCase().includes('employee') ||
    lead.sourceDetail?.toLowerCase().includes('referral')
  );

  const hasConvertedLead = existingLeads.some(lead => lead.convertedAt !== null);

  // CRITICAL BUSINESS LOGIC: Prevent double-payment scenarios
  if (isReferralSource(newLeadData.sourceType)) {
    // New lead is employee referral
    if (hasProviderBillableLead) {
      // CRITICAL CONFLICT: Provider-billable lead already exists - BLOCK conversion
      result.resolution = 'blocked';
      result.fraudRisk = 'high';
      result.reason = 'BLOCKED: Employee referral conflicts with existing Provider-billable lead - prevents double-payment';
      result.recommendedAction = 'Conversion blocked to prevent double-payment scenario';
      return result;
    }
    
    if (hasEmployeeReferralLead) {
      // CONFLICT: Another employee referral exists - BLOCK conversion
      result.resolution = 'blocked';
      result.fraudRisk = 'medium';
      result.reason = 'BLOCKED: Multiple employee referrals for same customer';
      result.recommendedAction = 'Conversion blocked - only one employee referral allowed per customer';
      return result;
    }

    // Employee referral is valid
    result.employeeRewardEligible = true;
    result.resolution = 'approved';
    result.reason = 'Valid employee referral - eligible for $50 employee reward, no Provider billing';
    
  } else if (isBillableSource(newLeadData.sourceType)) {
    // New lead is Provider-billable (system/AI generated)
    if (hasEmployeeReferralLead) {
      // CRITICAL CONFLICT: Employee referral already exists - BLOCK conversion
      result.resolution = 'blocked';
      result.fraudRisk = 'high';
      result.reason = 'BLOCKED: Provider-billable lead conflicts with existing employee referral - prevents double-payment';
      result.recommendedAction = 'Conversion blocked to prevent double-payment scenario';
      return result;
    }

    if (hasProviderBillableLead && hasConvertedLead) {
      // CONFLICT: Already billed for this customer - FLAG for review
      result.resolution = 'flagged';
      result.fraudRisk = 'medium';
      result.reason = 'Customer already converted through Provider-billable lead';
      result.recommendedAction = 'Review if this is a new contract vs existing relationship';
      return result;
    }

    // Provider billing is valid
    result.providerBillable = true;
    result.resolution = 'approved';
    result.reason = 'Valid Provider-billable lead - eligible for $100 Provider billing, no employee reward';
    
  } else {
    // Manual entry or other non-billable source
    result.resolution = 'approved';
    result.reason = 'Manual entry - no billing conflicts';
  }

  // Anti-fraud checks
  result.fraudRisk = assessFraudRisk(existingLeads, newLeadData);
  
  // CRITICAL: Auto-block high fraud risk scenarios
  if (result.fraudRisk === 'high') {
    result.resolution = 'blocked';
    result.reason = 'BLOCKED: High fraud risk detected - automatic security block';
    result.recommendedAction = 'Conversion blocked due to suspicious activity patterns';
  }
  
  return result;
}

/**
 * Classify a new lead when no conflicts exist.
 */
function classifyNewLead(sourceType: LeadSource, result: ConflictResolutionResult): ConflictResolutionResult {
  if (isReferralSource(sourceType)) {
    result.employeeRewardEligible = true;
    result.reason = 'Employee referral - eligible for $50 employee reward';
  } else if (isBillableSource(sourceType)) {
    result.providerBillable = true;
    result.reason = 'System-generated lead - eligible for $100 Provider billing';
  } else {
    result.reason = 'Manual entry - no billing or reward eligibility';
  }
  
  return result;
}

/**
 * Assess fraud risk based on patterns and timing.
 */
function assessFraudRisk(
  existingLeads: Array<{
    sourceType: LeadSource;
    sourceDetail: string | null;
    createdAt: Date;
    convertedAt: Date | null;
  }>,
  newLeadData: { sourceType: LeadSource; sourceDetail?: string | null }
): 'low' | 'medium' | 'high' {
  
  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
  
  // Check for suspicious patterns
  const recentLeads = existingLeads.filter(lead => lead.createdAt > recentThreshold);
  const rapidEntryCount = recentLeads.length;
  
  // High risk indicators
  if (rapidEntryCount >= 3) {
    return 'high'; // Multiple entries in 24 hours
  }
  
  const hasQuickConversion = existingLeads.some(lead => {
    if (!lead.convertedAt) return false;
    const timeDiff = lead.convertedAt.getTime() - lead.createdAt.getTime();
    return timeDiff < 60 * 60 * 1000; // Converted within 1 hour
  });
  
  if (hasQuickConversion && rapidEntryCount >= 2) {
    return 'high'; // Quick conversion + multiple recent entries
  }
  
  // Medium risk indicators
  if (rapidEntryCount >= 2) {
    return 'medium'; // 2+ entries in 24 hours
  }
  
  const sourceTypeVariation = new Set(existingLeads.map(l => l.sourceType)).size;
  if (sourceTypeVariation >= 3) {
    return 'medium'; // Many different source types for same customer
  }
  
  return 'low';
}

/**
 * Apply conflict resolution when converting a lead.
 * Ensures proper billing flags and prevents double-payment.
 */
export async function applyConflictResolution(
  leadId: string,
  orgId: string
): Promise<{
  success: boolean;
  billing: {
    providerBillable: boolean;
    employeeRewardEligible: boolean;
    reason: string;
  };
  conflicts?: string[];
}> {
  
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      orgId: true,
      sourceType: true,
      sourceDetail: true,
      identityHash: true,
      company: true,
      contactName: true,
      email: true,
      phoneE164: true,
      website: true,
      address: true
    }
  });

  if (!lead || lead.orgId !== orgId) {
    return {
      success: false,
      billing: {
        providerBillable: false,
        employeeRewardEligible: false,
        reason: 'Lead not found or access denied'
      }
    };
  }

  const resolution = await detectLeadConflicts(orgId, {
    identityHash: lead.identityHash,
    sourceType: lead.sourceType,
    sourceDetail: lead.sourceDetail,
    company: lead.company,
    contactName: lead.contactName,
    email: lead.email,
    phoneE164: lead.phoneE164,
    website: lead.website,
    address: lead.address
  });

  const conflicts: string[] = [];
  
  if (resolution.conflictDetected) {
    conflicts.push(resolution.reason);
    if (resolution.recommendedAction) {
      conflicts.push(resolution.recommendedAction);
    }
  }

  // Block high-risk conversions and explicit blocks
  if (resolution.resolution === 'blocked' || resolution.fraudRisk === 'high') {
    return {
      success: false,
      billing: {
        providerBillable: false,
        employeeRewardEligible: false,
        reason: resolution.reason || 'Conversion blocked due to high fraud risk or conflicts'
      },
      conflicts
    };
  }

  // Flag medium risk for manual review but allow conversion
  if (resolution.resolution === 'flagged' && resolution.fraudRisk === 'medium') {
    // Allow conversion but flag for review
    conflicts.push('Medium fraud risk - flagged for manual review');
  }

  return {
    success: true,
    billing: {
      providerBillable: resolution.providerBillable,
      employeeRewardEligible: resolution.employeeRewardEligible,
      reason: resolution.reason
    },
    conflicts: conflicts.length > 0 ? conflicts : undefined
  };
}