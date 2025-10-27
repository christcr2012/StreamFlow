/**
 * UsageMeter API
 * Phase 1: Scaffold with TODO placeholders
 * Track consumption of metered features (API calls, storage, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  meter: z.string().max(100).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

const recordUsageSchema = z.object({
  meter: z.string().min(1).max(100),
  quantity: z.number().int().min(0),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/usage-meters
 * List usage meter readings
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { meter, startDate, endDate, cursor, limit } = parsed.data;

    const where: any = { orgId: auth.orgId };

    if (meter) {
      where.meter = meter;
    }
    if (startDate || endDate) {
      where.windowStart = {};
      if (startDate) where.windowStart.gte = new Date(startDate);
      if (endDate) where.windowStart.lte = new Date(endDate);
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    const meters = await prisma.usageMeter.findMany({
      where,
      orderBy: { windowStart: "desc" },
      take: limit + 1,
      select: {
        id: true,
        orgId: true,
        meter: true,
        quantity: true,
        windowStart: true,
        windowEnd: true,
        createdAt: true,
      },
    });

    const hasMore = meters.length > limit;
    const items = hasMore ? meters.slice(0, -1) : meters;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // TODO Phase 2: Add aggregation (sum, avg, max per meter)
    // TODO Phase 2: Add time-series grouping (hourly, daily, monthly)
    // TODO Phase 2: Add threshold checks and alerts
    // TODO Phase 2: Add comparison to plan limits

    return NextResponse.json({
      ok: true,
      meters: items,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (err) {
    console.error("[usage-meters] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/usage-meters
 * Record usage event
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = recordUsageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { meter, quantity, windowStart, windowEnd, metadata } = parsed.data;

    // TODO Phase 2: Validate meter against allowed meters for this org
    // TODO Phase 2: Check if usage exceeds plan limits
    // TODO Phase 2: Trigger alerts if approaching limits (80%, 90%, 100%)
    // TODO Phase 2: Batch insert for high-volume meters
    // TODO Phase 2: Implement idempotency key to prevent duplicate recordings

    const record = await prisma.usageMeter.create({
      data: {
        orgId: auth.orgId,
        meter,
        quantity,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
      },
      select: {
        id: true,
        orgId: true,
        meter: true,
        quantity: true,
        windowStart: true,
        windowEnd: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, meter: record }, { status: 201 });
  } catch (err) {
    console.error("[usage-meters] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
