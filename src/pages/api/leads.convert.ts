// src/pages/api/leads.convert.ts
/**
 * Convert a lead and stamp billing metadata consistently.
 *
 * Policy:
 *  - Only system-generated leads are billable.
 *  - Referrals (employee/existing/new customer, or any source containing "referral") are never billable.
 *  - Flat price: UNIT_PRICE_CENTS (from src/lib/billing).
 *
 * Notes:
 *  - Idempotent: calling convert twice will not double-stamp or corrupt billing fields.
 *  - Preserves unrelated enrichmentJson fields.
 */

/*
=== ENTERPRISE ROADMAP: LEAD CONVERSION & PIPELINE MANAGEMENT ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Simple status-based conversion (NEW → CONVERTED)
- Basic billing metadata stamping
- Limited conversion tracking and analytics
- No pipeline automation or workflow management

ENTERPRISE CRM COMPARISON (Salesforce, HubSpot, Pipedrive):
1. Advanced Pipeline Management:
   - Multi-stage opportunity pipelines with custom stages
   - Weighted probability scoring by stage
   - Pipeline velocity tracking and forecasting
   - Stage-specific automation and requirements

2. Conversion Intelligence:
   - AI-powered conversion probability scoring
   - Win/loss analysis with detailed attribution
   - Revenue forecasting and pipeline analytics
   - Automated next-step recommendations

3. Workflow Automation:
   - Trigger-based automation on status changes
   - Automated task creation and assignment
   - Email sequences and nurturing campaigns
   - Integration with external sales tools

IMPLEMENTATION ROADMAP:

Phase 1: Enhanced Pipeline Management (3-4 weeks)
- Add opportunity pipeline stages beyond simple conversion
- Implement stage-specific probability weighting
- Add pipeline velocity tracking and reporting
- Create conversion funnel analytics dashboard

Phase 2: Conversion Intelligence (1-2 months)
- Build ML models for conversion probability prediction
- Add win/loss tracking with detailed reasons
- Implement revenue forecasting based on pipeline
- Create conversion attribution and source analysis

Phase 3: Automation & Workflows (2-3 months)
- Build workflow automation engine with triggers
- Add automated task and activity creation
- Implement email nurturing sequences
- Create sales process enforcement and guidance

Phase 4: Advanced Analytics (1-2 months)
- Add comprehensive pipeline analytics dashboard
- Implement sales performance tracking and KPIs
- Create territory and rep performance analysis
- Add forecasting accuracy tracking and improvement

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: Multi-stage opportunity pipeline
export type OpportunityStage = {
  id: string;
  name: string;
  probability: number;        // Win probability (0-100%)
  order: number;             // Stage order in pipeline
  requirements: string[];    // Required fields/actions for stage
  automation: {
    onEnter?: string[];      // Actions when entering stage
    onExit?: string[];       // Actions when leaving stage
    timeLimit?: number;      // Max days in stage
  };
};

// ENTERPRISE FEATURE: Conversion prediction and analytics
export type ConversionPrediction = {
  probability: number;       // ML-predicted conversion probability
  confidence: number;        // Model confidence score
  timeToConversion: number;  // Predicted days to conversion
  valueEstimate: number;     // Predicted deal value
  riskFactors: string[];     // Factors that may prevent conversion
  accelerators: string[];    // Factors that may speed conversion
};

// ENTERPRISE FEATURE: Win/loss analysis tracking
export type WinLossAnalysis = {
  outcome: 'won' | 'lost' | 'no-decision';
  primaryReason: string;
  competitorWon?: string;
  valueRealized?: number;
  salesCycle: number;        // Days from lead to close
  touchpoints: number;       // Number of interactions
  feedback: string;          // Detailed win/loss feedback
  attribution: {
    source: string;
    campaign?: string;
    channel: string;
  };
};

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { LeadStatus, LeadSource } from "@prisma/client";
import { UNIT_PRICE_CENTS, isReferralSource, isBillableSource, asLeadSource } from "@/lib/billing";
import { applyConflictResolution } from "@/lib/leadConflictResolution";

type Ok = { ok: true; leadId: string };
type Err = { ok: false; error: string; conflicts?: string[] };
type Resp = Ok | Err;

// Narrow type for enrichmentJson.billing we care about
type BillingInfo = {
  unitPriceCents?: number;
  billableEligible?: boolean;
  billedAt?: string | null;
  reason?: string;
  employeeRewardEligible?: boolean;
  conflictChecked?: boolean;
  conflictWarnings?: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  try {
    // Permission: converting a lead is a write op
    if (!(await assertPermission(req, res, PERMS.LEAD_UPDATE))) return;

    const id = (req.method === "POST" ? req.body?.id : req.query?.id) as string | undefined;
    if (!id) return res.status(400).json({ ok: false, error: "Missing lead id" });

    // Load the lead (include orgId for conflict resolution)
    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        orgId: true,
        status: true,
        convertedAt: true,
        sourceType: true,
        sourceDetail: true,
        systemGenerated: true,
        enrichmentJson: true,
      },
    });

    if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });

    // CRITICAL: Apply conflict resolution and anti-fraud logic
    const conflictResult = await applyConflictResolution(lead.id, lead.orgId);
    
    if (!conflictResult.success) {
      return res.status(400).json({ 
        ok: false, 
        error: conflictResult.billing.reason,
        conflicts: conflictResult.conflicts 
      });
    }

    // If already converted, we still refresh billing flags to ensure policy consistency (idempotent).
    const now = new Date();

    // Use conflict resolution results for billing
    const billableEligible = conflictResult.billing.providerBillable;
    const employeeRewardEligible = conflictResult.billing.employeeRewardEligible;
    const unitPriceCents = billableEligible ? UNIT_PRICE_CENTS : 0;
    const reason = conflictResult.billing.reason;

    // Safely merge enrichmentJson.billing without dropping other fields
    const ej = (lead.enrichmentJson ?? {}) as Record<string, unknown>;
    const prevBilling = (typeof (ej as any).billing === "object" && (ej as any).billing !== null
      ? ((ej as any).billing as Record<string, unknown>)
      : {}) as BillingInfo;

    const mergedBilling: BillingInfo = {
      ...prevBilling,
      billableEligible,
      unitPriceCents,
      reason,
      employeeRewardEligible, // Track employee reward eligibility
      conflictChecked: true,   // Mark as processed through conflict resolution
      conflictWarnings: conflictResult.conflicts, // Store any warnings
      // Do not overwrite billedAt if it already exists; preserve billing history
      billedAt: prevBilling.billedAt ?? null,
    };

    const updated = await db.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.CONVERTED,
        convertedAt: lead.convertedAt ?? now,
        enrichmentJson: {
          ...ej,
          billing: mergedBilling,
        },
      },
      select: { id: true },
    });

    return res.status(200).json({ ok: true, leadId: updated.id });
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error("/api/leads.convert error:", e);
    const msg = (e as { message?: string } | null)?.message ?? "Internal error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
