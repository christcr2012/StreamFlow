/**
 * Integration Detail API - [provider] route
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateIntegrationSchema = z.object({
  enabled: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * GET /api/integrations/[provider]
 * Get integration detail
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Find Integration by orgId and provider
    // TODO Phase 2: Mask access/refresh tokens in response
    // TODO Phase 2: Include last sync status and any errors
    // TODO Phase 2: Include available features for this provider

    return NextResponse.json({
      ok: true,
      integration: null,
      message: "TODO: Integration model not yet in schema",
    });
  } catch (err) {
    console.error("[integrations/[provider]] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/integrations/[provider]
 * Update integration settings
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateIntegrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Update Integration record
    // TODO Phase 2: If disabled, pause background syncs
    // TODO Phase 2: If enabled, trigger full resync
    // TODO Phase 2: Validate settings against provider schema

    return NextResponse.json({
      ok: true,
      integration: null,
      message: "TODO: Integration model not yet in schema",
    });
  } catch (err) {
    console.error("[integrations/[provider]] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/integrations/[provider]
 * Disconnect integration
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Find Integration by orgId and provider
    // TODO Phase 2: Revoke OAuth tokens with provider
    // TODO Phase 2: Delete Integration record (or soft delete with deletedAt)
    // TODO Phase 2: Stop background syncs
    // TODO Phase 2: Optionally delete synced data based on user preference
    // TODO Phase 2: Send disconnection confirmation email

    return NextResponse.json({
      ok: true,
      message: "TODO: Integration model not yet in schema",
    });
  } catch (err) {
    console.error("[integrations/[provider]] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
