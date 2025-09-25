// src/pages/api/dashboard/summary.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { isSystemGenerated } from "@/lib/leadScoring";
import { currentMonthRange } from "@/lib/reportingWindow";

type TrendBucket = { newLeads: number; converted: number };
type EnrichmentBilling = {
  billableEligible?: boolean;
  billedAt?: unknown;
  unitPriceCents?: number;
};
type EnrichmentJson = { billing?: EnrichmentBilling } & Record<string, unknown>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!(await assertPermission(req, res, PERMS.DASHBOARD_VIEW))) return;

    // --- Step 7.1 augment: timezone-aware "This Month" window (America/Denver by default)
    const { from: periodStart, to: periodEnd } = currentMonthRange();

    const now = new Date();

    // ---- Recent block (unchanged intent): last 90 days by CREATED date for generic KPIs/trend
    const recent = await db.lead.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 90 * 24 * 3600 * 1000) } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        convertedAt: true,
        status: true,
        sourceType: true,
        sourceDetail: true,
        systemGenerated: true,
        aiScore: true,
        enrichmentJson: true,
      },
    });

    const total = recent.length;
    let converted = 0;
    let rfp = 0;

    const HOT_SCORE_THRESHOLD = Number(process.env.HOT_SCORE_THRESHOLD ?? 70);
    let hot = 0;
    let cold = 0;

    const trendBuckets: Record<string, TrendBucket> = {};
    const trendStart = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    // We will compute month billables via a dedicated conversion-scoped query below.
    // Initialize here to keep the response shape identical.
    let monthBillableCount = 0;
    let monthBillableAmountUSD = 0;

    for (const l of recent) {
      const st = (l.status || "").toString().toUpperCase();
      const srcType = (l.sourceType || "").toString().toUpperCase();

      // narrow enrichmentJson safely
      const ej = (l.enrichmentJson ?? {}) as EnrichmentJson;

      if (srcType === "RFP" || l.systemGenerated || isSystemGenerated(l.sourceDetail ?? "")) {
        rfp++;
      }

      if (st === "CONVERTED" || st === "WON" || st === "CLOSED-WON") {
        converted++;
      }

      const score = typeof l.aiScore === "number" ? l.aiScore : null;
      if (score !== null) {
        if (score >= HOT_SCORE_THRESHOLD) hot++;
        else cold++;
      }

      const createdAt = l.createdAt ? new Date(l.createdAt) : null;
      if (createdAt && createdAt >= trendStart) {
        const key = createdAt.toISOString().slice(0, 10);
        if (!trendBuckets[key]) trendBuckets[key] = { newLeads: 0, converted: 0 };
        trendBuckets[key].newLeads++;
      }
      const convAt = l.convertedAt ? new Date(l.convertedAt) : null;
      if (st === "CONVERTED" && convAt && convAt >= trendStart) {
        const key = convAt.toISOString().slice(0, 10);
        if (!trendBuckets[key]) trendBuckets[key] = { newLeads: 0, converted: 0 };
        trendBuckets[key].converted++;
      }
    }

    // ---- Accurate month billables: query by CONVERTED date within the month window
    // Includes leads created long ago but converted this month.
    const monthConverted = await db.lead.findMany({
      where: {
        // statuses: your dataset sometimes uses WON/CLOSED-WON; we treat them as converted as well
        // If your enum is strict, feel free to narrow to 'CONVERTED' only.
        convertedAt: { gte: periodStart, lte: periodEnd },
        // "System-generated" guard: either explicit field or sourceType flag
        OR: [{ sourceType: "SYSTEM" as any }, { systemGenerated: true }],
      },
      select: {
        id: true,
        convertedAt: true,
        status: true,
        sourceType: true,
        systemGenerated: true,
        enrichmentJson: true,
      },
    });

    for (const l of monthConverted) {
      const ej = (l.enrichmentJson ?? {}) as EnrichmentJson;
      const billing = (ej.billing ?? {}) as EnrichmentBilling;

      // Bill only if the conversion is marked eligible and not yet billed
      if (billing.billableEligible === true && !billing.billedAt) {
        monthBillableCount++;
        const price = Number(billing.unitPriceCents || 0) / 100;
        monthBillableAmountUSD += price;
      }
    }

    const trend = Object.keys(trendBuckets)
      .sort()
      .map((d) => ({ date: d, ...trendBuckets[d] }));

    return res.status(200).json({
      ok: true,
      kpis: {
        totalLeads90d: total,
        converted90d: converted,
        rfp90d: rfp,
        monthBillableCount,
        monthBillableAmountUSD,
        periodStartISO: periodStart.toISOString(),
        periodEndISO: periodEnd.toISOString(),
        hot90d: hot,
        cold90d: cold,
        trend,
      },
    });
  } catch (e: unknown) {
    const msg = (e as { message?: string } | null)?.message ?? "Internal Error";
    // eslint-disable-next-line no-console
    console.error("/api/dashboard/summary error:", e);
    return res.status(500).json({ ok: false, error: msg });
  }
}
