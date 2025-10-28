import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import {
  compose,
  withProviderAuth,
  withRateLimit,
  withIdempotencyRequired,
} from "@/lib/api/middleware";
import { withAudit } from "@/lib/api/audit-middleware";

// GET /api/federation/billing/invoice
// Phase 1 scaffold: list invoices (placeholder: empty list with filters echoed)
const getHandler = async (req: NextRequest) => {
  try {
    const { searchParams } = req.nextUrl;
    const tenantId = searchParams.get("tenantId") || undefined;
    const status = searchParams.get("status") || undefined; // draft|open|paid|void
    const limit = Number(searchParams.get("limit") || "50");

    // Phase 2: fetch from billing provider or database
    const invoices: any[] = [];

    return jsonOk({ tenantId, status, limit, invoices });
  } catch (error) {
    console.error("Error listing invoices:", error);
    return jsonError(500, "internal_error", "Failed to list invoices");
  }
};

// POST /api/federation/billing/invoice
// Phase 1 scaffold: create/sync an invoice (placeholder result)
const postHandler = async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { tenantId, amount, currency = "USD", memo } = body || {};

    if (!tenantId || !amount) {
      return jsonError(
        400,
        "invalid_request",
        "tenantId and amount are required",
      );
    }

    // Phase 2: integrate with Stripe or billing system
    const invoice = {
      id: "temp_invoice_id",
      tenantId,
      amount,
      currency,
      memo: memo || null,
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    return jsonOk({ invoice });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return jsonError(500, "internal_error", "Failed to create invoice");
  }
};

export const GET = compose(
  withProviderAuth(),
  withRateLimit("api"),
)(getHandler);
export const POST = compose(
  withProviderAuth(),
  withRateLimit("api"),
  withIdempotencyRequired(),
)(
  withAudit(postHandler, {
    action: "create",
    entityType: "invoice",
    actorType: "provider",
  }),
);
