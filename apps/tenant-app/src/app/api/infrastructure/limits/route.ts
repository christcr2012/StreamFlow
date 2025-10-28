/**
 * InfrastructureLimit API
 * Phase 1: Scaffold with TODO placeholders
 * Manage hard limits on resources (max users, max storage, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

const createLimitSchema = z.object({
  resourceKey: z.string().min(1).max(100),
  maxValue: z.number().int().min(0),
  enforcementLevel: z.enum(["soft", "hard"]).default("soft"),
  alertThresholdPercent: z.number().min(0).max(100).optional().default(80),
});

/**
 * GET /api/infrastructure/limits
 * List infrastructure limits for org
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

    const { active, cursor, limit } = parsed.data;

    const where: any = { orgId: auth.orgId };

    if (active === "true") {
      where.isActive = true;
    } else if (active === "false") {
      where.isActive = false;
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    // TODO Phase 2: InfrastructureLimit model doesn't exist in schema
    // TODO Phase 2: Create migration for InfrastructureLimit table
    // TODO Phase 2: Add fields: id, orgId, resourceKey, maxValue, currentValue, enforcementLevel, alertThresholdPercent, isActive, lastCheckedAt

    // Placeholder response
    return NextResponse.json({
      ok: true,
      limits: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: InfrastructureLimit model not yet in schema",
    });
  } catch (err) {
    console.error("[infrastructure/limits] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/infrastructure/limits
 * Create infrastructure limit (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check

    const body = await req.json().catch(() => ({}));
    const parsed = createLimitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Create InfrastructureLimit record
    // TODO Phase 2: Check current usage against limit
    // TODO Phase 2: Trigger alert if already over threshold
    // TODO Phase 2: Set up monitoring for this resource

    return NextResponse.json(
      {
        ok: true,
        limit: null,
        message: "TODO: InfrastructureLimit model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[infrastructure/limits] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
