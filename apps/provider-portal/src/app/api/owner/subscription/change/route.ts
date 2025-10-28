// apps/provider-portal/src/app/api/owner/subscription/change/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProviderSession } from "@cortiware/auth-service";

const changeSchema = z.object({
  planId: z.string(),
  billingPeriod: z.enum(["monthly", "annual"]).optional(),
  effectiveDate: z.enum(["immediate", "next_cycle"]).default("next_cycle"),
  prorationBehavior: z
    .enum(["create_prorations", "none"])
    .default("create_prorations"),
});

/**
 * POST /api/owner/subscription/change
 * Change subscription plan or billing period
 *
 * Body:
 *   - planId: Target subscription plan ID
 *   - billingPeriod: Optional billing period change
 *   - effectiveDate: When to apply change (immediate or next billing cycle)
 *   - prorationBehavior: Whether to prorate charges
 *
 * Owner-only endpoint for subscription management
 */
export async function POST(req: NextRequest) {
  try {
    const session = getProviderSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Owner access required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validated = changeSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real subscription change
    // Phase 2: Update Stripe subscription
    // - Fetch current subscription from Stripe
    // - Validate plan transition (upgrade/downgrade rules)
    // - Calculate prorated charges if immediate
    // - Update subscription with new plan
    // - Handle proration invoice if needed
    // - Update org record in database
    // - Send notification email to owner
    // - Log subscription change event
    const change = {
      changeId: "chg_stub_" + Math.random().toString(36).substring(2, 15),
      fromPlan: "plan_starter",
      toPlan: validated.planId,
      billingPeriod: validated.billingPeriod || "monthly",
      effectiveDate: validated.effectiveDate,
      prorationAmount: validated.effectiveDate === "immediate" ? 45.67 : 0,
      status: "pending",
      scheduledAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, change }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/owner/subscription/change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
