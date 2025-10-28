/**
 * ImportJob API
 * Phase 1: Scaffold with TODO placeholders
 * Track CSV/Excel import jobs and their status
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  entityType: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(30),
});

const createImportSchema = z.object({
  entityType: z.enum([
    "leads",
    "customers",
    "contacts",
    "opportunities",
    "products",
  ]),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  mappingId: z.string().optional(),
  options: z.record(z.any()).optional(),
});

/**
 * GET /api/import/jobs
 * List import jobs for org
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

    const { status, entityType, cursor, limit } = parsed.data;

    const where: any = { orgId: auth.orgId };

    if (status) {
      where.status = status;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    // TODO Phase 2: ImportJob model doesn't exist in schema
    // TODO Phase 2: Create migration for ImportJob table
    // TODO Phase 2: Add fields: id, orgId, entityType, fileName, fileUrl, mappingId, status, totalRows, processedRows, successCount, errorCount, errors (JSON), startedAt, completedAt

    return NextResponse.json({
      ok: true,
      jobs: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: ImportJob model not yet in schema",
    });
  } catch (err) {
    console.error("[import/jobs] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/import/jobs
 * Create import job (uploads file and starts processing)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { entityType, fileName, fileUrl, mappingId, options } = parsed.data;

    // TODO Phase 2: Download file from fileUrl (or accept multipart/form-data upload)
    // TODO Phase 2: Validate file format (CSV, XLSX)
    // TODO Phase 2: Parse headers and detect column mappings
    // TODO Phase 2: Create ImportJob record with status 'pending'
    // TODO Phase 2: Queue background job to process rows
    // TODO Phase 2: Return job ID for polling status

    return NextResponse.json(
      {
        ok: true,
        job: null,
        message: "TODO: ImportJob model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[import/jobs] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
