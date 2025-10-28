// apps/tenant-app/src/app/api/cleaning/work-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const updateWorkOrderSchema = z.object({
  status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]).optional(),
  scheduledDate: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/cleaning/work-orders/[id]
 * Get a specific work order
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
    // Phase 2: Query work order from Prisma
    // - Filter by id and orgId for multi-tenant isolation
    // - Include related contract, schedule, and events
    // - Return 404 if not found
    const workOrder = {
      id,
      orgId: auth.orgId,
      status: "scheduled",
      scheduledDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, workOrder });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/cleaning/work-orders/[id]");
  }
}

/**
 * PATCH /api/cleaning/work-orders/[id]
 * Update a work order
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
    const validated = updateWorkOrderSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real update
    // Phase 2: Update work order in Prisma
    // - Verify work order exists and belongs to orgId
    // - Update fields
    // - Create event for status changes
    // - Return updated work order
    const workOrder = {
      id,
      ...validated,
      orgId: auth.orgId,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, workOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "PATCH /api/cleaning/work-orders/[id]");
  }
}

/**
 * DELETE /api/cleaning/work-orders/[id]
 * Delete a work order
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
    // Phase 2: Delete work order from Prisma
    // - Verify work order exists and belongs to orgId
    // - Only allow deletion of non-completed orders
    // - Return success response

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createSafeErrorResponse(error, "DELETE /api/cleaning/work-orders/[id]");
  }
}
