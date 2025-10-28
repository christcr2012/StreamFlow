import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateOrgSchema = z.object({
  name: z.string().max(200).optional(),
  themeSettings: z.any().optional(),
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

    if (id !== auth.orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const org = await prisma.org.findUnique({
      where: { id: auth.orgId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        featureFlags: true,
        aiPlan: true,
        aiMonthlyBudgetCents: true,
        aiCreditBalance: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        themeSettings: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: org });
  } catch (err) {
    console.error("[v2/organizations/[id]] GET error:", err);
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

    if (id !== auth.orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updateData: any = {};
    const d = parsed.data;
    if (d.name !== undefined) updateData.name = d.name;
    if (d.themeSettings !== undefined)
      updateData.themeSettings = d.themeSettings;

    const org = await prisma.org.update({
      where: { id: auth.orgId },
      data: updateData,
      select: {
        id: true,
        name: true,
        updatedAt: true,
        themeSettings: true,
      },
    });

    return NextResponse.json({ ok: true, item: org });
  } catch (err) {
    console.error("[v2/organizations/[id]] PATCH error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
