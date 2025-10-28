// apps/provider-portal/src/app/api/owner/subscription/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProviderSession } from "@cortiware/auth-service";

/**
 * GET /api/owner/subscription/portal
 * Get Stripe billing portal session URL
 *
 * Query Params:
 *   - returnUrl: Optional URL to return to after portal session
 *
 * Owner-only endpoint for self-service billing management
 */
export async function GET(req: NextRequest) {
  try {
    const session = getProviderSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Owner access required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const returnUrl = searchParams.get("returnUrl") || undefined;

    // PLACEHOLDER_block_phase2: Implement real Stripe billing portal
    // Phase 2: Create Stripe billing portal session
    // - Get Stripe customer ID for owner's org
    // - Create billing portal session with return_url
    // - Set configuration (allow plan changes, payment method updates)
    // - Return portal URL with expiration timestamp
    // - Log portal access event
    const portal = {
      portalSessionId:
        "bps_stub_" + Math.random().toString(36).substring(2, 15),
      url:
        "https://billing.stripe.com/session/stub_" +
        Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      returnUrl: returnUrl || "https://provider.cortiware.com/billing",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, portal });
  } catch (error) {
    console.error("GET /api/owner/subscription/portal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
