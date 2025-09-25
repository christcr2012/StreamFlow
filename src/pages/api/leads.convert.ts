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

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { LeadStatus, LeadSource } from "@prisma/client";
import { UNIT_PRICE_CENTS, isReferralSource, isBillableSource, asLeadSource } from "@/lib/billing";

type Ok = { ok: true; leadId: string };
type Err = { ok: false; error: string };
type Resp = Ok | Err;

// Narrow type for enrichmentJson.billing we care about
type BillingInfo = {
  unitPriceCents?: number;
  billableEligible?: boolean;
  billedAt?: string | null;
  reason?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  try {
    // Permission: converting a lead is a write op
    if (!(await assertPermission(req, res, PERMS.LEAD_UPDATE))) return;

    const id = (req.method === "POST" ? req.body?.id : req.query?.id) as string | undefined;
    if (!id) return res.status(400).json({ ok: false, error: "Missing lead id" });

    // Load the lead (select only what we need)
    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        convertedAt: true,
        sourceType: true,
        sourceDetail: true,
        systemGenerated: true,
        enrichmentJson: true,
      },
    });

    if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });

    // If already converted, we still refresh billing flags to ensure policy consistency (idempotent).
    const now = new Date();

    // Normalize source to Prisma enum when possible
    const srcEnum: LeadSource | null = lead.sourceType ? (lead.sourceType as LeadSource) : null;
    const srcStr = lead.sourceType?.toString() ?? "";
    const src = srcEnum ?? asLeadSource(srcStr) ?? null;

    // Determine referral/system flags
    const referral = isReferralSource(src ?? srcStr);
    const systemish = lead.systemGenerated === true || (src === LeadSource.SYSTEM);

    // Billing eligibility per policy
    const billableEligible = systemish && !referral;
    const unitPriceCents = billableEligible ? UNIT_PRICE_CENTS : 0;
    const reason = billableEligible ? "Converted system lead" : "Non-billable (referral or non-system)";

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
