/**
 * SubscriptionTier API
 * Phase 1: Scaffold with TODO placeholders
 * Manage subscription plans and tiers
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

const createTierSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  basePrice: z.number().min(0),
  billingCycle: z.enum(["monthly", "yearly"]),
  features: z.array(z.string()).optional().default([]),
  limits: z.record(z.number()).optional().default({}),
});

/**
 * GET /api/subscription-tiers
 * List subscription tiers (public endpoint)
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

    const { active, cursor, limit } = parsed.data;

    const where: any = {};

    if (active === "true") {
      where.isActive = true;
    } else if (active === "false") {
      where.isActive = false;
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    // TODO Phase 2: SubscriptionTier model doesn't exist in schema
    // TODO Phase 2: Create migration for SubscriptionTier table
    // TODO Phase 2: Add fields: id, name, slug, description, basePriceCents, billingCycle, features (JSON), limits (JSON), isActive, displayOrder
    // TODO Phase 2: Include pricing in multiple currencies
    // TODO Phase 2: Include feature comparison data

    return NextResponse.json({
      ok: true,
      tiers: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: SubscriptionTier model not yet in schema",
    });
  } catch (err) {
    console.error("[subscription-tiers] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/subscription-tiers
 * Create subscription tier (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check (only platform admins can create tiers)

    const body = await req.json().catch(() => ({}));
    const parsed = createTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Check slug uniqueness
    // TODO Phase 2: Create SubscriptionTier record
    // TODO Phase 2: Create associated pricing records for all regions
    // TODO Phase 2: Trigger webhook to update billing system (Stripe, etc.)

    return NextResponse.json(
      {
        ok: true,
        tier: null,
        message: "TODO: SubscriptionTier model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[subscription-tiers] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
