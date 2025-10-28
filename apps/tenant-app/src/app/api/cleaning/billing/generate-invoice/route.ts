// apps/tenant-app/src/app/api/cleaning/billing/generate-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const generateInvoiceSchema = z.object({
  workOrderId: z.string(),
  billingPeriodStart: z.string().optional(),
  billingPeriodEnd: z.string().optional(),
  includeUnbilled: z.boolean().default(true),
});

/**
 * POST /api/cleaning/billing/generate-invoice
 * Generate an invoice from cleaning work orders
 * 
 * Body:
 *   - workOrderId: Work order to invoice
 *   - billingPeriodStart: Optional start date
 *   - billingPeriodEnd: Optional end date
 *   - includeUnbilled: Include unbilled line items
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = generateInvoiceSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real invoice generation
    // Phase 2: Generate invoice from work order billing records
    // - Validate work order exists and belongs to orgId
    // - Query all unbilled line items for the work order
    // - Calculate totals (subtotal, tax, total)
    // - Create Invoice record in Prisma
    // - Mark billing records as invoiced
    // - Return created invoice
    const invoice = {
      id: "stub-invoice-id",
      workOrderId: validated.workOrderId,
      orgId: auth.orgId,
      subtotal: 0,
      tax: 0,
      total: 0,
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "POST /api/cleaning/billing/generate-invoice");
  }
}
