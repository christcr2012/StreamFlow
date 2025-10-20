import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/services/provider/stripe.service";
import { enqueue } from "@/lib/queue/enqueue";
import { QUEUE_NAMES } from "@cortiware/queue";
import type { StripeFanoutJob } from "@cortiware/queue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe Webhook Handler (Refactored for Queue System)
 *
 * This endpoint now:
 * 1. Verifies the Stripe signature (fast)
 * 2. Enqueues the event for async processing
 * 3. Returns 200 OK immediately
 *
 * The actual event processing happens in the worker service.
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false, error: "Stripe not configured" }, { status: 501 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await req.text();

  try {
    // Verify signature (this is fast and must happen in Vercel)
    const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET as string);

    // Extract orgId from event metadata (if available)
    const orgId = (event.data as any)?.object?.metadata?.orgId || 'unknown';

    // Enqueue for async processing in worker
    const job: StripeFanoutJob = {
      orgId,
      idempotencyKey: event.id, // Stripe event ID is naturally idempotent
      webhookId: event.id,
      eventType: event.type,
      payload: event.data.object as any,
    };

    await enqueue(QUEUE_NAMES.STRIPE, 'stripe.fanout', job);

    console.log(`[stripe-webhook] Event ${event.id} (${event.type}) enqueued for processing`);

    // Return 200 OK immediately (Stripe requires fast response)
    return NextResponse.json({ ok: true, queued: true, eventId: event.id });
  } catch (err: any) {
    console.error('[stripe-webhook] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Invalid signature" }, { status: 400 });
  }
}

