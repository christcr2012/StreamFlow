// apps/tenant-app/src/app/api/cleaning/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const updateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "quoted", "won", "lost"]).optional(),
  propertyType: z.enum(["residential", "commercial", "industrial"]).optional(),
  squareFootage: z.number().positive().optional(),
  serviceType: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/cleaning/leads/[id]
 * Get a specific cleaning lead
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
    // Phase 2: Query cleaning lead from Prisma
    // - Filter by id and orgId for multi-tenant isolation
    // - Include related estimates and activities
    // - Return 404 if not found
    const lead = {
      id,
      orgId: auth.orgId,
      status: "new",
      propertyType: "residential",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/cleaning/leads/[id]");
  }
}

/**
 * PATCH /api/cleaning/leads/[id]
 * Update a cleaning lead
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
    const validated = updateLeadSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real update
    // Phase 2: Update cleaning lead in Prisma
    // - Verify lead exists and belongs to orgId
    // - Update fields
    // - Create activity record for status changes
    // - Return updated lead
    const lead = {
      id,
      ...validated,
      orgId: auth.orgId,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "PATCH /api/cleaning/leads/[id]");
  }
}

/**
 * DELETE /api/cleaning/leads/[id]
 * Delete a cleaning lead
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
    // Phase 2: Delete cleaning lead from Prisma
    // - Verify lead exists and belongs to orgId
    // - Soft delete preferred (mark as deleted)
    // - Return success response

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createSafeErrorResponse(error, "DELETE /api/cleaning/leads/[id]");
  }
}
