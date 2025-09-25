// src/lib/stripeHelpers.ts
/**
 * Stripe helpers
 * --------------
 * - ensureStripeCustomerForOrg(orgId): idempotently ensures each Org has a Stripe Customer.
 * - Keeps the Stripe customer id in Org.settingsJson.stripeCustomerId
 *
 * Notes:
 * - Requires STRIPE_SECRET_KEY in the server environment.
 * - Safe to call repeatedly; if the id already exists, returns it.
 */
import Stripe from "stripe";
import { prisma as db } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export async function ensureStripeCustomerForOrg(orgId: string): Promise<string> {
  // Load org and check if we already have a customer id
  const org = await db.org.findUnique({ where: { id: orgId } });
  const s = (org?.settingsJson as Record<string, unknown> | null) || {};
  const existing = typeof s["stripeCustomerId"] === "string" ? (s["stripeCustomerId"] as string) : null;
  if (existing) return existing;

  // Create a new customer in Stripe
  const customer = await stripe.customers.create({
    name: org?.name || "Customer",
    metadata: { orgId },
  });

  // Persist to Org.settingsJson (idempotent; merges prior settingsJson fields)
  await db.org.update({
    where: { id: orgId },
    data: {
      settingsJson: {
        ...(org?.settingsJson as Record<string, unknown> | null),
        stripeCustomerId: customer.id,
      },
    },
  });

  return customer.id;
}
