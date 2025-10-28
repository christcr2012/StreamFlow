// apps/tenant-app/src/app/api/cleaning/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const createBillingSchema = z.object({
  workOrderId: z.string().optional(),
  serviceId: z.string().optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

/**
 * GET /api/cleaning/billing
 * List billing records for cleaning services
 * 
 * Query params:
 *   - workOrderId: Filter by work order
 *   - status: Filter by billing status
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PLACEHOLDER_block_phase2: Implement real query
    // Phase 2: Query cleaning billing records from Prisma
    // - Filter by orgId for multi-tenant isolation
    // - Apply workOrderId filter if provided
    // - Apply status filter if provided
    // - Include related work orders and services
    const data: any[] = [];

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/cleaning/billing");
  }
}

/**
 * POST /api/cleaning/billing
 * Create a new billing record
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createBillingSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real creation
    // Phase 2: Create billing record in Prisma
    // - Validate work order exists and belongs to orgId
    // - Create billing record with orgId
    // - Return created record
    const record = {
      id: "stub-id",
      ...validated,
      orgId: auth.orgId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "POST /api/cleaning/billing");
  }
}
