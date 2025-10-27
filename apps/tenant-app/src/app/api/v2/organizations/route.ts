import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

// Returns current org summary for the authenticated user
export async function GET(_req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("[v2/organizations] GET error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
