/**
 * PricingOverride API
 * Phase 1: Scaffold with TODO placeholders
 * Custom pricing exceptions for specific orgs
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  targetOrgId: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

const createOverrideSchema = z.object({
  targetOrgId: z.string().min(1),
  resourceType: z.enum(["plan", "feature", "meter", "addon"]),
  resourceId: z.string().min(1),
  overridePrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  reason: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/pricing/overrides
 * List pricing overrides (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check (only platform admins can view overrides)

    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: PricingOverride model doesn't exist in schema
    // TODO Phase 2: Create migration for PricingOverride table
    // TODO Phase 2: Add fields: id, targetOrgId, resourceType, resourceId, originalPrice, overridePrice, discountPercent, reason, createdBy, expiresAt

    return NextResponse.json({
      ok: true,
      overrides: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: PricingOverride model not yet in schema",
    });
  } catch (err) {
    console.error("[pricing/overrides] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/pricing/overrides
 * Create pricing override (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check

    const body = await req.json().catch(() => ({}));
    const parsed = createOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Verify targetOrgId exists
    // TODO Phase 2: Verify resourceId exists
    // TODO Phase 2: Create PricingOverride record
    // TODO Phase 2: Log to audit log with reason
    // TODO Phase 2: Notify target org of special pricing
    // TODO Phase 2: Update billing system (Stripe metadata, etc.)

    return NextResponse.json(
      {
        ok: true,
        override: null,
        message: "TODO: PricingOverride model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[pricing/overrides] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
