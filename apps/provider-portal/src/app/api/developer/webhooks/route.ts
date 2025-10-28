// apps/provider-portal/src/app/api/developer/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProviderSession } from "@cortiware/auth-service";

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  active: z.boolean().default(true),
});

/**
 * GET /api/developer/webhooks
 * List configured webhooks
 *
 * Developer-only endpoint for webhook management
 */
export async function GET(req: NextRequest) {
  try {
    const session = getProviderSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Developer access required" },
        { status: 401 },
      );
    }

    // PLACEHOLDER_block_phase2: Implement real query
    // Phase 2: Query webhooks from provider database
    // - Filter by developer/provider
    // - Include delivery statistics
    // - Show recent deliveries and failures
    const webhooks: any[] = [];

    return NextResponse.json({ ok: true, webhooks });
  } catch (error) {
    console.error("GET /api/developer/webhooks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/developer/webhooks
 * Register a new webhook
 *
 * Body:
 *   - url: Webhook endpoint URL
 *   - events: Array of event types to subscribe to
 *   - secret: Optional webhook secret for HMAC signing
 *   - active: Whether webhook is active (default: true)
 */
export async function POST(req: NextRequest) {
  try {
    const session = getProviderSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Developer access required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validated = webhookSchema.parse(body);

    // PLACEHOLDER_block_phase2: Implement real webhook registration
    // Phase 2: Create webhook in provider database
    // - Validate URL is accessible (send test ping)
    // - Generate webhook ID and signing secret if not provided
    // - Store webhook configuration
    // - Set up event listeners
    // - Return webhook details with secret
    const webhook = {
      id: "stub-webhook-id",
      ...validated,
      secret:
        validated.secret ||
        "whsec_" + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, webhook }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/developer/webhooks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
