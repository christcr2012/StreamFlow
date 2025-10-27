/**
 * MonetizationConfig API
 * Phase 1: Scaffold with TODO placeholders
 * Global monetization configuration (payment gateways, currencies, tax settings)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateConfigSchema = z.object({
  stripePublishableKey: z.string().optional(),
  stripeTaxRates: z.array(z.string()).optional(),
  enabledCurrencies: z.array(z.string()).optional(),
  defaultCurrency: z.string().length(3).optional(),
  taxCalculationMode: z.enum(["inclusive", "exclusive"]).optional(),
  trialPeriodDays: z.number().int().min(0).max(365).optional(),
  gracePeriodDays: z.number().int().min(0).max(90).optional(),
});

/**
 * GET /api/monetization/config
 * Get monetization configuration (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check (only platform admins can view config)

    // TODO Phase 2: MonetizationConfig model doesn't exist in schema
    // TODO Phase 2: Create migration for MonetizationConfig table (singleton pattern)
    // TODO Phase 2: Add fields: id, stripePublishableKey, stripeSecretKey (encrypted), stripeTaxRates, enabledCurrencies, defaultCurrency, taxCalculationMode, trialPeriodDays, gracePeriodDays
    // TODO Phase 2: Mask sensitive keys in response (show last 4 characters only)

    return NextResponse.json({
      ok: true,
      config: {
        stripePublishableKey: "pk_test_****",
        stripeTaxRates: [],
        enabledCurrencies: ["USD", "EUR", "GBP"],
        defaultCurrency: "USD",
        taxCalculationMode: "exclusive",
        trialPeriodDays: 14,
        gracePeriodDays: 7,
      },
      message:
        "TODO: MonetizationConfig model not yet in schema (placeholder data)",
    });
  } catch (err) {
    console.error("[monetization/config] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/monetization/config
 * Update monetization configuration (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Add admin role check

    const body = await req.json().catch(() => ({}));
    const parsed = updateConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // TODO Phase 2: Update MonetizationConfig record (upsert for singleton)
    // TODO Phase 2: Encrypt sensitive keys before storing
    // TODO Phase 2: Validate Stripe keys by making test API call
    // TODO Phase 2: Log configuration changes to audit log
    // TODO Phase 2: Trigger webhook to notify billing system of config update

    return NextResponse.json({
      ok: true,
      config: null,
      message: "TODO: MonetizationConfig model not yet in schema",
    });
  } catch (err) {
    console.error("[monetization/config] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
