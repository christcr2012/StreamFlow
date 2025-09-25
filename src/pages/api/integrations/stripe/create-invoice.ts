// src/pages/api/integrations/stripe/create-invoice.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const key = process.env.STRIPE_SECRET_KEY!;
    // FIX: pin to the latest supported type definition
    const stripe = await import("stripe").then(
      (m) => new m.default(key, { apiVersion: "2023-10-16" })
    );

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }

    const { customerId, amount, description } = req.body;
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount,
      currency: "usd",
      description,
    });
    const invoice = await stripe.invoices.create({ customer: customerId, auto_advance: true });

    return res.status(200).json({ ok: true, invoice, invoiceItem });
  } catch (err: unknown) {
    console.error("stripe create-invoice error:", err);
    const msg = (err as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
