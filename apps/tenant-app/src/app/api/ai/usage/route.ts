/**
 * AI Usage Tracking API
 *
 * Tracks AI usage across features and provides cost analytics
 * Uses real Prisma models: AiUsageEvent and AIBudget
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";
import { Prisma } from "@prisma/client-tenant";

type Period = "day" | "week" | "month" | "year";

function getDateRange(period: Period): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  switch (period) {
    case "day":
      start.setDate(end.getDate() - 1);
      break;
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
  }
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "month") as Period;
    const { start, end } = getDateRange(period);

    const events = await prisma.aiUsageEvent.findMany({
      where: {
        orgId: auth.orgId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        feature: true,
        model: true,
        tokensIn: true,
        tokensOut: true,
        costUsd: true,
        createdAt: true,
      },
    });

    // Aggregate totals
    const totals = events.reduce(
      (acc, e) => {
        acc.totalTokensIn += e.tokensIn;
        acc.totalTokensOut += e.tokensOut;
        acc.totalCost += parseFloat(e.costUsd.toString());
        acc.totalCalls += 1;
        return acc;
      },
      { totalTokensIn: 0, totalTokensOut: 0, totalCost: 0, totalCalls: 0 },
    );

    const averageCostPerCall =
      totals.totalCalls > 0 ? totals.totalCost / totals.totalCalls : 0;

    // Group by feature
    const byFeatureMap = new Map<
      string,
      { cost: number; calls: number; tokens: number }
    >();
    for (const e of events) {
      const key = e.feature;
      const cur = byFeatureMap.get(key) || { cost: 0, calls: 0, tokens: 0 };
      cur.cost += parseFloat(e.costUsd.toString());
      cur.calls += 1;
      cur.tokens += e.tokensIn + e.tokensOut;
      byFeatureMap.set(key, cur);
    }

    const byFeature = Array.from(byFeatureMap.entries()).map(
      ([feature, v]) => ({
        feature,
        cost: Number(v.cost.toFixed(2)),
        calls: v.calls,
        tokens: v.tokens,
      }),
    );

    // Group by model
    const byModelMap = new Map<
      string,
      { cost: number; calls: number; tokens: number }
    >();
    for (const e of events) {
      const key = e.model;
      const cur = byModelMap.get(key) || { cost: 0, calls: 0, tokens: 0 };
      cur.cost += parseFloat(e.costUsd.toString());
      cur.calls += 1;
      cur.tokens += e.tokensIn + e.tokensOut;
      byModelMap.set(key, cur);
    }

    const byModel = Array.from(byModelMap.entries()).map(([model, v]) => ({
      model,
      cost: Number(v.cost.toFixed(2)),
      calls: v.calls,
      tokens: v.tokens,
    }));

    // Group by day (YYYY-MM-DD)
    const byDayMap = new Map<string, { cost: number; calls: number }>();
    for (const e of events) {
      const d = new Date(e.createdAt);
      const key = d.toISOString().slice(0, 10);
      const cur = byDayMap.get(key) || { cost: 0, calls: 0 };
      cur.cost += parseFloat(e.costUsd.toString());
      cur.calls += 1;
      byDayMap.set(key, cur);
    }

    const byDay = Array.from(byDayMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({
        date,
        cost: Number(v.cost.toFixed(2)),
        calls: v.calls,
      }));

    // Budget information
    const budget = await prisma.aIBudget.findUnique({
      where: { orgId: auth.orgId },
    });
    const monthlyLimit = budget
      ? parseFloat(budget.monthlyBudget.toString())
      : 0;
    const currentSpend = budget
      ? parseFloat(budget.currentSpend.toString())
      : totals.totalCost;
    const remaining = Math.max(0, monthlyLimit - currentSpend);
    const percentUsed =
      monthlyLimit > 0 ? Math.min(100, (currentSpend / monthlyLimit) * 100) : 0;

    // Rough days remaining based on resetDay
    const now = new Date();
    const resetDay = budget?.resetDay ?? 1;
    const nextReset = new Date(now.getFullYear(), now.getMonth(), resetDay);
    if (now > nextReset) nextReset.setMonth(nextReset.getMonth() + 1);
    const daysRemaining = Math.max(
      0,
      Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    // Projected EOM by simple linear extrapolation
    const daysElapsed = Math.max(
      1,
      Math.ceil(
        (now.getTime() -
          new Date(now.getFullYear(), now.getMonth(), 1).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const projectedEndOfMonth = Number(
      ((currentSpend / daysElapsed) * 30).toFixed(2),
    );

    return NextResponse.json({
      period,
      summary: {
        totalCost: Number(totals.totalCost.toFixed(2)),
        totalTokensIn: totals.totalTokensIn,
        totalTokensOut: totals.totalTokensOut,
        totalCalls: totals.totalCalls,
        averageCostPerCall: Number(averageCostPerCall.toFixed(3)),
      },
      byFeature,
      byModel,
      byDay,
      budget: {
        monthlyLimit,
        currentSpend,
        remaining: Number(remaining.toFixed(2)),
        percentUsed: Number(percentUsed.toFixed(2)),
        daysRemaining,
        projectedEndOfMonth,
        alertThreshold: budget?.alertThreshold ?? 80,
        alertsEnabled: true,
      },
    });
  } catch (error: any) {
    console.error("GET /api/ai/usage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI usage" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feature, model, tokensIn, tokensOut, costUsd, metadata } = body as {
      feature: string;
      model: string;
      tokensIn: number;
      tokensOut: number;
      costUsd: number;
      metadata?: { requestId?: string };
    };

    if (
      !feature ||
      !model ||
      typeof tokensIn !== "number" ||
      typeof tokensOut !== "number" ||
      typeof costUsd !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const created = await prisma.aiUsageEvent.create({
      data: {
        orgId: auth.orgId,
        userId: auth.userId,
        feature,
        model,
        tokensIn,
        tokensOut,
        costUsd: new Prisma.Decimal(costUsd),
        creditsUsed: Math.ceil(costUsd * 100),
        requestId: metadata?.requestId,
      },
      select: { id: true, createdAt: true },
    });

    // Best-effort update to AIBudget currentSpend
    await prisma.aIBudget.updateMany({
      where: { orgId: auth.orgId },
      data: { currentSpend: { increment: new Prisma.Decimal(costUsd) } },
    });

    return NextResponse.json(
      {
        success: true,
        id: created.id,
        createdAt: created.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/ai/usage error:", error);
    return NextResponse.json(
      { error: "Failed to record AI usage" },
      { status: 500 },
    );
  }
}
