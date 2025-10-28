// apps/provider-portal/src/app/api/analyst/incidents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProviderSession } from "@cortiware/auth-service";

const createIncidentSchema = z.object({
  tenantOrgId: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  category: z.enum(["performance", "security", "data", "integration", "other"]),
  title: z.string().min(5),
  description: z.string().min(10),
});

/**
 * GET /api/analyst/incidents
 * List incidents across all tenants
 *
 * Query params:
 *   - tenantOrgId: Filter by tenant
 *   - severity: Filter by severity
 *   - status: Filter by status (open, investigating, resolved, closed)
 *   - category: Filter by category
 *
 * Analyst-only endpoint for incident management
 */
export async function GET(req: NextRequest) {
  try {
    const session = getProviderSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Analyst access required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const tenantOrgId = searchParams.get("tenantOrgId");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // PLACEHOLDER_block_phase2: Implement real query
    // Phase 2: Query incidents from provider database
    // - Filter by all provided query parameters
    // - Include tenant information
    // - Order by severity desc, createdAt desc
    // - Include resolution time metrics
    const data: any[] = [];

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("GET /api/analyst/incidents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/analyst/incidents
 * Create a new incident
 *
 * Analyst can create incidents on behalf of tenants
 */
export async function POST(req: NextRequest) {
  try {
    const session = getProviderSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Analyst access required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validated = createIncidentSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real creation
    // Phase 2: Create incident in provider database
    // - Validate tenantOrgId exists
    // - Create incident with status "open"
    // - Send notifications based on severity
    // - Create audit log entry
    // - Return created incident
    const incident = {
      id: "stub-incident-id",
      ...validated,
      status: "open",
      createdBy: session.providerId || "system",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, incident }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/analyst/incidents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
