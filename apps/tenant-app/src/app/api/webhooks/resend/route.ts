import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

// Resend webhook handler with optional signature verification
// Verifies svix-signature header if RESEND_WEBHOOK_SECRET is set

function validateResendSignature(
  secret: string,
  signature: string,
  timestamp: string,
  payload: string
): boolean {
  // Resend uses Svix for webhooks, format: t=<timestamp>,v1=<signature>
  const parts = signature.split(',');
  const sigMap = Object.fromEntries(parts.map(p => p.split('=', 2) as [string, string]));
  
  if (!sigMap.v1) return false;
  
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');
  
  return sigMap.v1 === expectedSignature;
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  const svixSignature = req.headers.get('svix-signature');
  const svixTimestamp = req.headers.get('svix-timestamp');
  
  let body: any = {};
  let bodyText = '';
  
  if (contentType.includes('application/json')) {
    bodyText = await req.text();
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = {};
    }
  } else {
    bodyText = await req.text();
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = {};
    }
  }

  // Optional signature verification (if RESEND_WEBHOOK_SECRET is set)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret && svixSignature && svixTimestamp) {
    const isValid = validateResendSignature(webhookSecret, svixSignature, svixTimestamp, bodyText);
    if (!isValid) {
      console.warn('Resend webhook signature validation failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  }

  const emailId = body?.data?.id || body?.id || body?.email?.id;
  const event = body?.type || body?.event;

  if (!emailId) return NextResponse.json({ ok: true });

  try {
    const status = event === 'email.delivered' ? 'delivered' : event === 'email.opened' ? 'read' : 'sent';
    await prisma.communication.updateMany({
      where: { externalId: String(emailId) },
      data: { 
        status, 
        deliveredAt: status === 'delivered' ? new Date() : undefined, 
        readAt: status === 'read' ? new Date() : undefined 
      },
    });
  } catch (err) {
    console.error('Resend webhook update failed:', err);
  }

  return new NextResponse('OK', { status: 200 });
}
