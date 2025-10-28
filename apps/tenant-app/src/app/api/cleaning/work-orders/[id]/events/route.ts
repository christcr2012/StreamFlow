// apps/tenant-app/src/app/api/cleaning/work-orders/[id]/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const createEventSchema = z.object({
  type: z.enum(["status_change", "note_added", "inspection_completed", "issue_reported"]),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/cleaning/work-orders/[id]/events
 * List events for a work order
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
    // Phase 2: Query work order events from Prisma
    // - Verify work order exists and belongs to orgId
    // - Query all events for this work order
    // - Order by createdAt descending
    // - Include user who created each event
    const events: any[] = [];

    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/cleaning/work-orders/[id]/events");
  }
}

/**
 * POST /api/cleaning/work-orders/[id]/events
 * Create a new event for a work order
 */
export async function POST(
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
    const validated = createEventSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real creation
    // Phase 2: Create work order event in Prisma
    // - Verify work order exists and belongs to orgId
    // - Create event with userId and timestamp
    // - Return created event
    const event = {
      id: "stub-event-id",
      workOrderId: id,
      ...validated,
      userId: auth.userId,
      orgId: auth.orgId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "POST /api/cleaning/work-orders/[id]/events");
  }
}
