/**
 * ImportMapping API
 * Phase 1: Scaffold with TODO placeholders
 * Save and reuse CSV column mappings
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  entityType: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

const createMappingSchema = z.object({
  name: z.string().min(1).max(100),
  entityType: z.enum([
    "leads",
    "customers",
    "contacts",
    "opportunities",
    "products",
  ]),
  mappings: z.record(z.string()), // { csvColumn: dbField }
  transformations: z.record(z.any()).optional(),
});

/**
 * GET /api/import/mappings
 * List import mappings for org
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { entityType, cursor, limit } = parsed.data;

    const where: any = { orgId: auth.orgId };

    if (entityType) {
      where.entityType = entityType;
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    // TODO Phase 2: ImportMapping model doesn't exist in schema
    // TODO Phase 2: Create migration for ImportMapping table
    // TODO Phase 2: Add fields: id, orgId, name, entityType, mappings (JSON), transformations (JSON), isDefault, lastUsedAt

    return NextResponse.json({
      ok: true,
      mappings: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: ImportMapping model not yet in schema",
    });
  } catch (err) {
    console.error("[import/mappings] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/import/mappings
 * Create import mapping
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createMappingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, entityType, mappings, transformations } = parsed.data;

    // TODO Phase 2: Validate mappings (db fields exist for entityType)
    // TODO Phase 2: Validate transformations (supported transform functions)
    // TODO Phase 2: Create ImportMapping record
    // TODO Phase 2: Set as default if org has no existing mappings for this entityType

    return NextResponse.json(
      {
        ok: true,
        mapping: null,
        message: "TODO: ImportMapping model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[import/mappings] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
