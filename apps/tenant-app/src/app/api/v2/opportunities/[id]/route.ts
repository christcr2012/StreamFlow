import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateOpportunitySchema = z.object({
  stage: z.string().max(100).optional(),
  estValue: z.number().nonnegative().nullable().optional(),
  ownerId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const opp = await prisma.opportunity.findFirst({
      where: { id, orgId: auth.orgId },
      select: {
        id: true,
        customerId: true,
        estValue: true,
        stage: true,
        ownerId: true,
        sourceLeadId: true,
        classification: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!opp) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, opportunity: opp });
  } catch (err) {
    console.error("[v2/opportunities/[id]] GET error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateOpportunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.opportunity.findFirst({
      where: { id, orgId: auth.orgId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    const updateData: any = {};
    const d = parsed.data;
    if (d.stage !== undefined) updateData.stage = d.stage;
    if (d.estValue !== undefined) updateData.estValue = d.estValue;
    if (d.ownerId !== undefined) updateData.ownerId = d.ownerId;

    const opp = await prisma.opportunity.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        estValue: true,
        stage: true,
        ownerId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, opportunity: opp });
  } catch (err) {
    console.error("[v2/opportunities/[id]] PATCH error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.opportunity.findFirst({
      where: { id, orgId: auth.orgId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Opportunity deleted" });
  } catch (err) {
    console.error("[v2/opportunities/[id]] DELETE error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
