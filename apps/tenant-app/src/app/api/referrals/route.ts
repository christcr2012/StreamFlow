/**
 * Referrals API - Referral tracking and rewards
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

const createReferralSchema = z.object({
  referredName: z.string().min(1).max(200),
  referredEmail: z.string().email().max(200).optional(),
  referredPhone: z.string().max(20).optional(),
  employeeId: z.string().optional(),
});

/**
 * GET /api/referrals
 * List referrals
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parse = listQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parse.error.flatten() },
        { status: 400 },
      );
    }

    const { status, cursor, limit } = parse.data;

    const where: any = { orgId: auth.orgId };
    if (status) where.status = status;

    // TODO Phase 2: Add employeeId filter
    // TODO Phase 2: Add date range filters
    // TODO Phase 2: Add conversion tracking

    const results = await prisma.referral.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: (limit ?? 50) + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        orgId: true,
        employeeId: true,
        referredName: true,
        referredEmail: true,
        referredPhone: true,
        status: true,
        convertedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = results.length > (limit ?? 50);
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ ok: true, items, nextCursor, hasMore });
  } catch (err) {
    console.error("[referrals] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/referrals
 * Create a new referral
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createReferralSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { referredName, referredEmail, referredPhone, employeeId } =
      parsed.data;

    // TODO Phase 2: Send referral invite email/SMS to referred person
    // TODO Phase 2: Generate unique referral tracking code
    // TODO Phase 2: Track conversion when referred person signs up

    const referral = await prisma.referral.create({
      data: {
        orgId: auth.orgId,
        employeeId: employeeId || null,
        referredName,
        referredEmail: referredEmail || null,
        referredPhone: referredPhone || null,
        status: "new",
      },
      select: {
        id: true,
        orgId: true,
        employeeId: true,
        referredName: true,
        referredEmail: true,
        referredPhone: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, referral }, { status: 201 });
  } catch (err) {
    console.error("[referrals] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
