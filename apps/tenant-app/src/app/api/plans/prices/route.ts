/**
 * Plan Price API
 * Phase 1: Scaffold with TODO placeholders
 * Regional pricing for subscription plans
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  planId: z.string().optional(),
  currency: z.string().length(3).optional(),
  region: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

const createPriceSchema = z.object({
  planId: z.string().min(1),
  currency: z.string().length(3),
  region: z.string().min(1).max(50),
  basePriceCents: z.number().int().min(0),
  taxRate: z.number().min(0).max(1).optional().default(0),
});

/**
 * GET /api/plans/prices
 * List plan prices (public endpoint)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: PlanPrice model doesn't exist in schema
    // TODO Phase 2: Create migration for PlanPrice table
    // TODO Phase 2: Add fields: id, planId, currency, region, basePriceCents, taxRate, stripePriceId, isActive
    // TODO Phase 2: Join with SubscriptionTier to include plan details
    // TODO Phase 2: Auto-detect user region from IP for default currency

    return NextResponse.json({
      ok: true,
      prices: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: PlanPrice model not yet in schema",
    });
  } catch (err) {
    console.error("[plans/prices] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/plans/prices
 * Create plan price (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check

    const body = await req.json().catch(() => ({}));
    const parsed = createPriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Verify planId exists
    // TODO Phase 2: Check uniqueness of planId + currency + region
    // TODO Phase 2: Create PlanPrice record
    // TODO Phase 2: Create Stripe Price object and store stripePriceId
    // TODO Phase 2: Log price creation to audit log

    return NextResponse.json(
      {
        ok: true,
        price: null,
        message: "TODO: PlanPrice model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[plans/prices] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
