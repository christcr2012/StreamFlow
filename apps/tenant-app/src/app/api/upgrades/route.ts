/**
 * Upgrade API
 * Phase 1: Scaffold with TODO placeholders
 * Track and manage org upgrades (plan changes, vertical pack additions)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "completed"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(30),
});

const createUpgradeSchema = z.object({
  upgradeType: z.enum(["plan", "vertical_pack", "addon"]),
  targetId: z.string().min(1),
  reason: z.string().max(500).optional(),
  requestedBy: z.string().optional(),
});

/**
 * GET /api/upgrades
 * List upgrade requests for org
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

    // TODO Phase 2: Upgrade model doesn't exist in schema
    // TODO Phase 2: Create migration for Upgrade table
    // TODO Phase 2: Add fields: id, orgId, upgradeType, currentPlanId, targetPlanId, status, reason, requestedBy, approvedBy, completedAt

    return NextResponse.json({
      ok: true,
      upgrades: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: Upgrade model not yet in schema",
    });
  } catch (err) {
    console.error("[upgrades] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/upgrades
 * Request an upgrade
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createUpgradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Create Upgrade record
    // TODO Phase 2: Calculate pricing difference
    // TODO Phase 2: Send notification to admins for approval
    // TODO Phase 2: Check if org meets upgrade requirements
    // TODO Phase 2: Auto-approve if within policy limits

    return NextResponse.json(
      {
        ok: true,
        upgrade: null,
        message: "TODO: Upgrade model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[upgrades] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
