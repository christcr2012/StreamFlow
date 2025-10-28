// apps/tenant-app/src/app/api/cleaning/estimates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const updateEstimateSchema = z.object({
  status: z.enum(["draft", "sent", "viewed", "accepted", "rejected"]).optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
  })).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/cleaning/estimates/[id]
 * Get a specific cleaning estimate
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // PLACEHOLDER_block_phase2: Implement real query
    // Phase 2: Query estimate from Prisma
    // - Filter by id and orgId for multi-tenant isolation
    // - Include related lead/customer and line items
    // - Return 404 if not found
    const estimate = {
      id,
      orgId: auth.orgId,
      status: "draft",
      subtotal: 0,
      tax: 0,
      total: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, estimate });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/cleaning/estimates/[id]");
  }
}

/**
 * PATCH /api/cleaning/estimates/[id]
 * Update a cleaning estimate
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateEstimateSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real update
    // Phase 2: Update estimate in Prisma
    // - Verify estimate exists and belongs to orgId
    // - Update fields
    // - Recalculate totals if line items changed
    // - Return updated estimate
    const estimate = {
      id,
      ...validated,
      orgId: auth.orgId,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, estimate });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "PATCH /api/cleaning/estimates/[id]");
  }
}

/**
 * DELETE /api/cleaning/estimates/[id]
 * Delete a cleaning estimate
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // PLACEHOLDER_block_phase2: Implement real deletion
    // Phase 2: Delete estimate from Prisma
    // - Verify estimate exists and belongs to orgId
    // - Soft delete (mark as deleted) preferred
    // - Return success response

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createSafeErrorResponse(error, "DELETE /api/cleaning/estimates/[id]");
  }
}
