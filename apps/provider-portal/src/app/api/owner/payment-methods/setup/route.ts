// apps/provider-portal/src/app/api/owner/payment-methods/setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProviderSession } from "@cortiware/auth-service";

const setupSchema = z.object({
  type: z.enum(["card", "bank_account", "ach"]),
  returnUrl: z.string().url().optional(),
});

/**
 * POST /api/owner/payment-methods/setup
 * Initialize payment method setup (Stripe SetupIntent)
 *
 * Body:
 *   - type: Type of payment method to add
 *   - returnUrl: Optional URL to return to after setup
 *
 * Owner-only endpoint for payment method management
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
    const validated = setupSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real Stripe setup
    // Phase 2: Create Stripe SetupIntent
    // - Get or create Stripe customer for owner's org
    // - Create SetupIntent with appropriate payment method types
    // - Set metadata (orgId, type)
    // - Return client_secret for frontend Stripe Elements
    // - Store setup session for webhook handling
    const setup = {
      setupIntentId: "seti_stub_" + Math.random().toString(36).substring(2, 15),
      clientSecret:
        "seti_secret_stub_" + Math.random().toString(36).substring(2, 15),
      type: validated.type,
      status: "requires_payment_method",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, setup }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/owner/payment-methods/setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
