/**
 * Incidents API - Critical incident management
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  severity: z.enum(["P1", "P2", "P3"]).optional(),
  status: z
    .enum(["OPEN", "ACK", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  severity: z.enum(["P1", "P2", "P3"]).default("P2"),
  assigneeUserId: z.string().optional(),
});

/**
 * GET /api/incidents
 * List incidents with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parse = listQuerySchema.safeParse({
      severity: searchParams.get("severity") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parse.error.flatten() },
        { status: 400 },
      );
    }

    const { severity, status, cursor, limit } = parse.data;

    const where: any = { orgId: auth.orgId };
    if (severity) where.severity = severity;
    if (status) where.status = status;

    // TODO Phase 2: Add date range filters (createdAfter, createdBefore)
    // TODO Phase 2: Add assignedTo filter
    // TODO Phase 2: Add search by title/description

    const results = await prisma.incident.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: (limit ?? 50) + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        assigneeUserId: true,
        slaResponseDeadline: true,
        slaResolveDeadline: true,
        acknowledgedAt: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        closedAt: true,
      },
    });

    const hasMore = results.length > (limit ?? 50);
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ ok: true, items, nextCursor, hasMore });
  } catch (err) {
    console.error("[incidents] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/incidents
 * Create a new incident
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { title, description, severity, assigneeUserId } = parsed.data;

    // TODO Phase 2: Auto-assign to on-call engineer based on severity
    // TODO Phase 2: Create escalation ticket if P1
    // TODO Phase 2: Send notifications to relevant team members
    // TODO Phase 2: Log to external incident management system (PagerDuty, Opsgenie)
    // TODO Phase 2: Calculate SLA deadlines based on severity

    const incident = await prisma.incident.create({
      data: {
        orgId: auth.orgId,
        title,
        description,
        severity,
        status: "OPEN",
        assigneeUserId: assigneeUserId || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        assigneeUserId: true,
        slaResponseDeadline: true,
        slaResolveDeadline: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, incident }, { status: 201 });
  } catch (err) {
    console.error("[incidents] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
