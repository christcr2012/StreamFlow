// src/pages/api/webhooks/stripe.ts
/**
 * Stripe Webhook (Next.js API Route)
 * ----------------------------------
 * - Verifies Stripe signatures using raw body (bodyParser disabled).
 * - On invoice.payment_succeeded/failed, updates LeadInvoice.status accordingly.
 * - Idempotent: updating the same invoice status repeatedly is safe.
 *
 * Env:
 *   STRIPE_SECRET_KEY        - required to instantiate Stripe client
 *   STRIPE_WEBHOOK_SECRET    - required to verify signatures (live or test endpoint secret)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { prisma as db } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false, // Important: we need the raw body for signature verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

function readRawBody(req: NextApiRequest): Promise<Buffer> {
  // Use standard Node stream events to accumulate the raw body.
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!webhookSecret) {
    // Do not hard-fail the build/runtime; log and accept to avoid blocking non-configured envs.
    // You may switch this to a 500 once secrets are deployed everywhere.
    // eslint-disable-next-line no-console
    console.warn("[stripe webhook] STRIPE_WEBHOOK_SECRET not set; skipping verification.");
    return res.status(200).json({ ok: true, skipped: true });
  }

  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) return res.status(400).json({ ok: false, error: "Missing stripe-signature header" });

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = (err as { message?: string })?.message || "Invalid signature";
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] Signature verification failed:", msg);
    return res.status(400).json({ ok: false, error: "Signature verification failed" });
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        const leadInvoiceId = String(inv.metadata?.leadInvoiceId || "");
        if (leadInvoiceId) {
          await db.leadInvoice.update({
            where: { id: leadInvoiceId },
            data: { status: "paid" },
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const leadInvoiceId = String(inv.metadata?.leadInvoiceId || "");
        if (leadInvoiceId) {
          await db.leadInvoice.update({
            where: { id: leadInvoiceId },
            data: { status: "uncollectible" },
          });
        }
        break;
      }
      default:
        // no-op for other events
        break;
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    const msg = (e as { message?: string })?.message || "Internal Error";
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] handler error:", e);
    return res.status(500).json({ ok: false, error: msg });
  }
}
