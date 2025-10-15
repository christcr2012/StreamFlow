import { prisma } from "@/lib/prisma";
import { isStripeConfigured, getStripe } from "@/services/provider/stripe.service";

// Select invoices that are past_due (or open for too long) to retry
export async function getDunningCandidates(limit = 20) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["past_due", "open"] }, issuedAt: { gte: since } },
    orderBy: { issuedAt: "asc" },
    take: limit,
    select: { id: true, orgId: true, amount: true, status: true },
  });
  return invoices.map((i: any) => ({ invoiceId: i.id, orgId: i.orgId, amountCents: Math.round(Number(i.amount) * 100), status: i.status }));
}

export async function runDunningCycle(limit = 10) {
  const stripeOK = isStripeConfigured();
  const stripe = stripeOK ? getStripe() : null;
  const candidates = await getDunningCandidates(limit);
  const results: Array<{ invoiceId: string; attempted: boolean; ok: boolean; reason?: string }>=[];

  for (const c of candidates) {
    try {
      // Track an attempted retry via Payment row
      const payment = await prisma.payment.create({
        data: {
          orgId: c.orgId,
          invoiceId: c.invoiceId,
          amount: (c.amountCents / 100) as any,
          method: "stripe",
          status: "pending",
          reference: `retry-${Date.now()}`,
          lastRetryAt: new Date(),
        },
      });

      if (!stripe) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: "stripe_not_configured", retryCount: { increment: 1 }, lastRetryAt: new Date() } });
        results.push({ invoiceId: c.invoiceId, attempted: false, ok: false, reason: "stripe_not_configured" });
        continue;
      }

      // Attempt an off-session charge using saved default payment method (if any)
      try {
        const org = await prisma.org.findUnique({ where: { id: c.orgId }, select: { stripeCustomerId: true } });
        if (!org?.stripeCustomerId) throw new Error("no_customer");

        const pi = await stripe.paymentIntents.create({
          amount: c.amountCents,
          currency: "usd",
          customer: org.stripeCustomerId,
          confirm: true,
          off_session: true,
          automatic_payment_methods: { enabled: true },
          metadata: { orgId: c.orgId, invoiceId: c.invoiceId },
        });

        const status = pi.status;
        if (status === "succeeded" || status === "requires_capture" || status === "processing") {
          await prisma.payment.update({ where: { id: payment.id }, data: { status: "succeeded", stripePaymentIntentId: pi.id } });
          await prisma.invoice.update({ where: { id: c.invoiceId }, data: { status: "paid" } });
          results.push({ invoiceId: c.invoiceId, attempted: true, ok: true });
        } else {
          await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: status, stripePaymentIntentId: pi.id, retryCount: { increment: 1 }, lastRetryAt: new Date() } });
          results.push({ invoiceId: c.invoiceId, attempted: true, ok: false, reason: status });
        }
      } catch (err: any) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: String(err?.code || err?.message || err), retryCount: { increment: 1 }, lastRetryAt: new Date() } });
        results.push({ invoiceId: c.invoiceId, attempted: true, ok: false, reason: String(err?.code || err?.message || err) });
      }
    } catch (e: any) {
      results.push({ invoiceId: c.invoiceId, attempted: false, ok: false, reason: String(e?.message || e) });
    }
  }

  return { count: candidates.length, results };
}

