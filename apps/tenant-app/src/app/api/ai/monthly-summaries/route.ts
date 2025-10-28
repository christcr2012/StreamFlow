/**
 * AI Monthly Summaries API
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  monthKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(), // Format: YYYY-MM
  limit: z.coerce.number().min(1).max(100).optional().default(12),
});

/**
 * GET /api/ai/monthly-summaries
 * List monthly AI usage summaries
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parse = listQuerySchema.safeParse({
      monthKey: searchParams.get("monthKey") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parse.error.flatten() },
        { status: 400 },
      );
    }

    const { monthKey, limit } = parse.data;

    const where: any = { orgId: auth.orgId };
    if (monthKey) where.monthKey = monthKey;

    // TODO Phase 2: Add feature filter (summarize by feature type)
    // TODO Phase 2: Add comparison with previous month
    // TODO Phase 2: Calculate cost savings vs manual operations

    const summaries = await prisma.aiMonthlySummary.findMany({
      where,
      orderBy: { monthKey: "desc" },
      take: limit ?? 12,
      select: {
        id: true,
        orgId: true,
        monthKey: true,
        tokensIn: true,
        tokensOut: true,
        costUsd: true,
        creditsUsed: true,
        callCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, summaries });
  } catch (err) {
    console.error("[ai/monthly-summaries] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ai/monthly-summaries
 * Trigger manual summary generation (admin only)
 * TODO Phase 2: Move to background job (cron) instead of manual trigger
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check
    // TODO Phase 2: Add rate limiting (prevent duplicate runs)

    const body = await req.json().catch(() => ({}));
    const { monthKey } = body; // Format: YYYY-MM

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json(
        { error: "monthKey required (format: YYYY-MM)" },
        { status: 400 },
      );
    }

    // TODO Phase 2: Aggregate AIUsageEvent records for the specified month
    // TODO Phase 2: Calculate total tokensIn, tokensOut, costUsd, callCount
    // TODO Phase 2: Upsert AiMonthlySummary record

    // Placeholder implementation
    const summary = await prisma.aiMonthlySummary.upsert({
      where: {
        orgId_monthKey: {
          orgId: auth.orgId,
          monthKey,
        },
      },
      create: {
        orgId: auth.orgId,
        monthKey,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        creditsUsed: 0,
        callCount: 0,
      },
      update: {
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        creditsUsed: 0,
        callCount: 0,
      },
    });

    return NextResponse.json({ ok: true, summary }, { status: 201 });
  } catch (err) {
    console.error("[ai/monthly-summaries] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
