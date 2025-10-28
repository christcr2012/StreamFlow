// apps/tenant-app/src/app/api/cleaning/contracts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const updateContractSchema = z.object({
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  terms: z.string().optional(),
});

/**
 * GET /api/cleaning/contracts/[id]
 * Get a specific cleaning contract
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
    // Phase 2: Query contract from Prisma
    // - Filter by id and orgId for multi-tenant isolation
    // - Include related customer and schedules
    // - Return 404 if not found
    const contract = {
      id,
      orgId: auth.orgId,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, contract });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/cleaning/contracts/[id]");
  }
}

/**
 * PATCH /api/cleaning/contracts/[id]
 * Update a cleaning contract
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
    const validated = updateContractSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real update
    // Phase 2: Update contract in Prisma
    // - Verify contract exists and belongs to orgId
    // - Update fields
    // - Return updated contract
    const contract = {
      id,
      ...validated,
      orgId: auth.orgId,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, contract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "PATCH /api/cleaning/contracts/[id]");
  }
}

/**
 * DELETE /api/cleaning/contracts/[id]
 * Delete a cleaning contract
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
    // Phase 2: Delete contract from Prisma
    // - Verify contract exists and belongs to orgId
    // - Soft delete or hard delete based on business rules
    // - Return success response

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createSafeErrorResponse(error, "DELETE /api/cleaning/contracts/[id]");
  }
}
