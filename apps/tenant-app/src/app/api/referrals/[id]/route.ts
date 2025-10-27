/**
 * Referral Detail API - [id] route
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateReferralSchema = z.object({
  referredName: z.string().min(1).max(200).optional(),
  referredEmail: z.string().email().max(255).optional().nullable(),
  referredPhone: z.string().max(50).optional().nullable(),
  status: z.string().max(50).optional(),
  convertedAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/**
 * GET /api/referrals/[id]
 * Get referral detail
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referral = await prisma.referral.findFirst({
      // TODO Phase 2: Scope to org via relation (employee/org) once schema verified
      where: { id: params.id },
      select: {
        id: true,
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

    if (!referral) {
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 },
      );
    }

    // TODO Phase 2: Include conversion details (which customer/opportunity)
    // TODO Phase 2: Include referral value if converted
    // TODO Phase 2: Include tracking history (views, clicks, signups)

    return NextResponse.json({ ok: true, referral });
  } catch (err) {
    console.error("[referrals/[id]] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/referrals/[id]
 * Update referral
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateReferralSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify referral exists and belongs to org
    const existing = await prisma.referral.findFirst({
      // TODO Phase 2: Scope to org via relation (employee/org) once schema verified
      where: { id: params.id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 },
      );
    }

    // TODO Phase 2: Validate status transitions (e.g., can't unconvert after conversion)
    // TODO Phase 2: Auto-set convertedAt when status changes to 'converted'
    // TODO Phase 2: Send notification to employee when referral converts
    // TODO Phase 2: Calculate and assign referral bonus/credit

    const updateData: any = {};
    if (parsed.data.referredName !== undefined)
      updateData.referredName = parsed.data.referredName;
    if (parsed.data.referredEmail !== undefined)
      updateData.referredEmail = parsed.data.referredEmail;
    if (parsed.data.referredPhone !== undefined)
      updateData.referredPhone = parsed.data.referredPhone;
    if (parsed.data.status !== undefined)
      updateData.status = parsed.data.status;
    if (parsed.data.convertedAt !== undefined) {
      updateData.convertedAt = parsed.data.convertedAt
        ? new Date(parsed.data.convertedAt)
        : null;
    }

    const updated = await prisma.referral.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        referredName: true,
        referredEmail: true,
        referredPhone: true,
        status: true,
        convertedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, referral: updated });
  } catch (err) {
    console.error("[referrals/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/referrals/[id]
 * Delete referral
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify referral exists and belongs to org
    const existing = await prisma.referral.findFirst({
      // TODO Phase 2: Scope to org via relation (employee/org) once schema verified
      where: { id: params.id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 },
      );
    }

    // TODO Phase 2: Prevent deletion of converted referrals (archive instead)
    // TODO Phase 2: Log deletion to audit log

    await prisma.referral.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true, message: "Referral deleted" });
  } catch (err) {
    console.error("[referrals/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
