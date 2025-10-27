/**
 * Integration API
 * Phase 1: Scaffold with TODO placeholders
 * Manage third-party integrations (per-org OAuth connections)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  provider: z.string().optional(),
  status: z.enum(["connected", "error", "disconnected"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

const createIntegrationSchema = z.object({
  provider: z.enum([
    "google",
    "microsoft",
    "slack",
    "salesforce",
    "hubspot",
    "quickbooks",
  ]),
  authCode: z.string().min(1).optional(),
  redirectUri: z.string().url().optional(),
});

/**
 * GET /api/integrations
 * List integrations for org
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

    const { provider, status, cursor, limit } = parsed.data;

    const where: any = { orgId: auth.orgId };

    if (provider) {
      where.provider = provider;
    }
    if (status) {
      where.status = status;
    }
    if (cursor) {
      where.id = { lt: cursor };
    }

    // TODO Phase 2: Integration model doesn't exist in schema
    // TODO Phase 2: Create migration for Integration table
    // TODO Phase 2: Add fields: id, orgId, provider, status, accessToken (encrypted), refreshToken (encrypted), expiresAt, scopes, metadata, lastSyncAt, errorMessage

    return NextResponse.json({
      ok: true,
      integrations: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      message: "TODO: Integration model not yet in schema",
    });
  } catch (err) {
    console.error("[integrations] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/integrations
 * Connect integration via OAuth
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createIntegrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { provider, authCode, redirectUri } = parsed.data;

    // TODO Phase 2: Exchange authCode for access/refresh tokens via provider OAuth
    // TODO Phase 2: Validate token scopes match required permissions
    // TODO Phase 2: Create Integration record with encrypted tokens
    // TODO Phase 2: Test connection by making API call to provider
    // TODO Phase 2: Trigger initial data sync in background job
    // TODO Phase 2: Send success notification to user

    return NextResponse.json(
      {
        ok: true,
        integration: null,
        message: "TODO: Integration model not yet in schema",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[integrations] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
