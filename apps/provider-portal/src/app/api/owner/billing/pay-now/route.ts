// apps/provider-portal/src/app/api/owner/billing/pay-now/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProviderSession } from "@cortiware/auth-service";

const paymentSchema = z.object({
  invoiceId: z.string(),
  paymentMethodId: z.string(),
  amount: z.number().positive().optional(),
});

/**
 * POST /api/owner/billing/pay-now
 * Process immediate payment for an invoice
 *
 * Body:
 *   - invoiceId: Invoice to pay
 *   - paymentMethodId: Payment method to use
 *   - amount: Optional partial payment amount
 *
 * Owner-only endpoint for instant payment
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
    const validated = paymentSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real payment processing
    // Phase 2: Process payment through Stripe
    // - Validate invoice exists and belongs to owner's org
    // - Validate payment method belongs to owner
    // - Calculate amount (full or partial)
    // - Create Stripe PaymentIntent
    // - Process payment
    // - Update invoice status
    // - Create payment record
    // - Send receipt email
    // - Return payment confirmation
    const payment = {
      id: "stub-payment-id",
      invoiceId: validated.invoiceId,
      amount: validated.amount || 0,
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/owner/billing/pay-now error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
