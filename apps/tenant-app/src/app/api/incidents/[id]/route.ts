/**
 * Incident Detail API - [id] route
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateIncidentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  severity: z.enum(["P1", "P2", "P3"]).optional(),
  status: z
    .enum(["OPEN", "ACK", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .optional(),
  assigneeUserId: z.string().optional().nullable(),
});

/**
 * GET /api/incidents/[id]
 * Get incident detail
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const incident = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      select: {
        id: true,
        orgId: true,
        severity: true,
        status: true,
        title: true,
        description: true,
        assigneeUserId: true,
        slaResponseDeadline: true,
        slaResolveDeadline: true,
        acknowledgedAt: true,
        resolvedAt: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 },
      );
    }

    // TODO Phase 2: Include related data (comments, timeline, affected services)
    // TODO Phase 2: Include assignee user details
    // TODO Phase 2: Calculate time-to-acknowledge, time-to-resolve

    return NextResponse.json({ ok: true, incident });
  } catch (err) {
    console.error("[incidents/[id]] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/incidents/[id]
 * Update incident
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify incident exists and belongs to org
    const existing = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 },
      );
    }

    // TODO Phase 2: Add status transition validation (e.g., can't go from CLOSED to OPEN)
    // TODO Phase 2: Auto-set acknowledgedAt when status changes to ACK
    // TODO Phase 2: Auto-set resolvedAt when status changes to RESOLVED
    // TODO Phase 2: Auto-set closedAt when status changes to CLOSED
    // TODO Phase 2: Log status changes to audit log
    // TODO Phase 2: Send notifications on assignment or status change

    const updateData: any = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      updateData.description = parsed.data.description;
    if (parsed.data.severity !== undefined)
      updateData.severity = parsed.data.severity;
    if (parsed.data.status !== undefined)
      updateData.status = parsed.data.status;
    if (parsed.data.assigneeUserId !== undefined)
      updateData.assigneeUserId = parsed.data.assigneeUserId;

    const updated = await prisma.incident.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        severity: true,
        status: true,
        title: true,
        description: true,
        assigneeUserId: true,
        slaResponseDeadline: true,
        slaResolveDeadline: true,
        acknowledgedAt: true,
        resolvedAt: true,
        closedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, incident: updated });
  } catch (err) {
    console.error("[incidents/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/incidents/[id]
 * Delete incident (soft delete recommended)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify incident exists and belongs to org
    const existing = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 },
      );
    }

    // TODO Phase 2: Implement soft delete (add deletedAt field to schema)
    // TODO Phase 2: Prevent deletion of P1 incidents (require admin approval)
    // TODO Phase 2: Archive incident data before deletion
    // TODO Phase 2: Log deletion to audit log

    await prisma.incident.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: "Incident deleted" });
  } catch (err) {
    console.error("[incidents/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
