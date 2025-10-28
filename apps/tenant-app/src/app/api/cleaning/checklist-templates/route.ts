// apps/tenant-app/src/app/api/cleaning/checklist-templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-context";
import { createSafeErrorResponse } from "@/lib/error-handler";

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(false),
  })),
});

/**
 * GET /api/cleaning/checklist-templates
 * List checklist templates for inspections
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PLACEHOLDER_block_phase2: Implement real query
    // Phase 2: Query checklist templates from Prisma
    // - Filter by orgId for multi-tenant isolation
    // - Include default system templates
    // - Order by name
    const data: any[] = [];

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return createSafeErrorResponse(error, "GET /api/cleaning/checklist-templates");
  }
}

/**
 * POST /api/cleaning/checklist-templates
 * Create a new checklist template
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTemplateSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real creation
    // Phase 2: Create checklist template in Prisma
    // - Create template with orgId
    // - Create checklist items
    // - Return created template with items
    const template = {
      id: "stub-template-id",
      ...validated,
      orgId: auth.orgId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return createSafeErrorResponse(error, "POST /api/cleaning/checklist-templates");
  }
}
