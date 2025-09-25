// API endpoint for purchasing packs via Stripe Checkout
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Initialize Stripe with the provided secret key and API version. Cast the version string to the
// Stripe.LatestApiVersion type via unknown to avoid using `any`.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia" as unknown as Stripe.LatestApiVersion,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  try {
    // Parse body from string or object
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const body = rawBody as Record<string, unknown>;
    const qty = Number(body.quantity ?? 1);
    const unitAmount = Number(body.unitAmount ?? 1000); // cents, e.g., $10/lead

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Hot Leads Pack" },
            unit_amount: unitAmount,
          },
          quantity: qty,
        },
      ],
      metadata: { kind: "PACK_PURCHASE" },
      success_url: `${process.env.APP_URL}/?purchase=success`,
      cancel_url: `${process.env.APP_URL}/?purchase=cancel`,
    });
    return res.status(200).json({ url: session.url });
  } catch (e: unknown) {
    console.error("Stripe error", e);
    const msg = (e as { message?: string } | undefined)?.message || "Unknown error";
    return res.status(500).json({ error: msg });
  }
}