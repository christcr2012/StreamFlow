/**
 * Offer API
 * Phase 1: Scaffold with TODO placeholders
 * Special promotional offers and discounts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
  targetAudience: z.enum(["all", "new", "existing", "churned"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(30),
});

const createOfferSchema = z.object({
  name: z.string().min(1).max(200),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/),
  description: z.string().max(1000).optional(),
  discountType: z.enum(["percent", "fixed_amount"]),
  discountValue: z.number().min(0),
  targetAudience: z.enum(["all", "new", "existing", "churned"]).default("all"),
  maxRedemptions: z.number().int().min(1).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  applicablePlans: z.array(z.string()).optional(),
});

/**
 * GET /api/offers
 * List offers (public or admin)
 */
export async function GET(req: NextRequest) {
  try {
    // No auth required for public offers, but admin gets all offers
    const auth = await getAuthContext().catch(() => null);

    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Offer model doesn't exist in schema
    // TODO Phase 2: Create migration for Offer table
    // TODO Phase 2: Add fields: id, name, code, description, discountType, discountValue, targetAudience, maxRedemptions, currentRedemptions, validFrom, validUntil, isActive
    // TODO Phase 2: Filter by date range (only show active offers to public)
    // TODO Phase 2: Admins see all offers, public sees only active + applicable

    return NextResponse.json({
      ok: true,
      offers: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: Offer model not yet in schema",
    });
  } catch (err) {
    console.error("[offers] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/offers
 * Create offer (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check

    const body = await req.json().catch(() => ({}));
    const parsed = createOfferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Check code uniqueness
    // TODO Phase 2: Validate validFrom < validUntil
    // TODO Phase 2: Create Offer record
    // TODO Phase 2: Set up webhook for billing system (Stripe coupon sync)
    // TODO Phase 2: Log offer creation to audit log

    return NextResponse.json(
      {
        ok: true,
        offer: null,
        message: "TODO: Offer model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[offers] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
