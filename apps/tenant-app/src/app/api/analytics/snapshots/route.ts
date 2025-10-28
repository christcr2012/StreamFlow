/**
 * AnalyticsSnapshot API
 * Phase 1: Scaffold with TODO placeholders
 * Daily aggregated analytics for org performance tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  metric: z
    .enum(["revenue", "leads", "opportunities", "customers", "all"])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(30),
});

const triggerSnapshotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  force: z.boolean().optional().default(false),
});

/**
 * GET /api/analytics/snapshots
 * List analytics snapshots for date range (global stats)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check (only admins can view global analytics)

    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { startDate, endDate, cursor, limit } = parsed.data;

    const where: any = {};

    if (startDate) {
      where.snapshotDate = { ...where.snapshotDate, gte: new Date(startDate) };
    }
    if (endDate) {
      where.snapshotDate = { ...where.snapshotDate, lte: new Date(endDate) };
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    const snapshots = await prisma.analyticsSnapshot.findMany({
      where,
      orderBy: { snapshotDate: "desc" },
      take: limit + 1,
      select: {
        id: true,
        snapshotDate: true,
        mrrCents: true,
        arrCents: true,
        activeClients: true,
        newClients: true,
        churnedClients: true,
        totalRevenue: true,
        metricsJson: true,
        createdAt: true,
      },
    });

    const hasMore = snapshots.length > limit;
    const items = hasMore ? snapshots.slice(0, -1) : snapshots;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // TODO Phase 2: Add calculated fields (growth %, period comparisons)
    // TODO Phase 2: Add trend analysis (7-day, 30-day moving averages)
    // TODO Phase 2: Add metric breakdowns (by vertical, by region, by plan tier)

    return NextResponse.json({
      ok: true,
      snapshots: items,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (err) {
    console.error("[analytics/snapshots] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/analytics/snapshots
 * Trigger snapshot generation (admin only, typically cron job)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check
    // if (!auth.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await req.json().catch(() => ({}));
    const parsed = triggerSnapshotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { date, force } = parsed.data;
    const snapshotDate = new Date(date);

    // Check if snapshot already exists
    const existing = await prisma.analyticsSnapshot.findUnique({
      where: {
        snapshotDate,
      },
      select: { id: true },
    });

    if (existing && !force) {
      return NextResponse.json(
        {
          error: "Snapshot already exists for this date",
          snapshotId: existing.id,
        },
        { status: 409 },
      );
    }

    // TODO Phase 2: Calculate actual metrics from database
    // TODO Phase 2: mrrCents = sum of recurring revenue for active subscriptions
    // TODO Phase 2: arrCents = mrrCents * 12
    // TODO Phase 2: activeClients = count of active orgs
    // TODO Phase 2: newClients = count of orgs created on this date
    // TODO Phase 2: churnedClients = count of orgs that churned on this date
    // TODO Phase 2: totalRevenue = sum of payments received on this date

    const snapshot = await prisma.analyticsSnapshot.upsert({
      where: {
        snapshotDate,
      },
      create: {
        snapshotDate,
        mrrCents: 0, // TODO: Calculate
        arrCents: 0, // TODO: Calculate
        activeClients: 0, // TODO: Calculate
        newClients: 0, // TODO: Calculate
        churnedClients: 0, // TODO: Calculate
        totalRevenue: 0, // TODO: Calculate
      },
      update: {
        mrrCents: 0, // TODO: Calculate
        arrCents: 0, // TODO: Calculate
        activeClients: 0, // TODO: Calculate
        newClients: 0, // TODO: Calculate
        churnedClients: 0, // TODO: Calculate
        totalRevenue: 0, // TODO: Calculate
      },
    });

    return NextResponse.json({ ok: true, snapshot }, { status: 201 });
  } catch (err) {
    console.error("[analytics/snapshots] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
