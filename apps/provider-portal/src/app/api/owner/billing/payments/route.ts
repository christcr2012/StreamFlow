// apps/provider-portal/src/app/api/owner/billing/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProviderSession } from "@cortiware/auth-service";

/**
 * GET /api/owner/billing/payments
 * List payment history
 *
 * Query params:
 *   - startDate: Filter start date
 *   - endDate: Filter end date
 *   - status: Filter by status (succeeded, failed, pending)
 *   - page: Page number
 *   - limit: Results per page
 *
 * Owner-only endpoint for payment history
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // PLACEHOLDER_block_phase2: Implement real query
    // Phase 2: Query payments from provider database
    // - Filter by owner's organization
    // - Apply date and status filters
    // - Include related invoices
    // - Include payment method details (last 4 digits)
    // - Paginate results
    // - Calculate totals
    const payments: any[] = [];
    const total = 0;

    return NextResponse.json({
      ok: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalPaid: 0,
        successfulPayments: 0,
        failedPayments: 0,
      },
    });
  } catch (error) {
    console.error("GET /api/owner/billing/payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
