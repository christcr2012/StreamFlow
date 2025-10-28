import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

// Twilio webhook handler with optional signature verification
// Verifies X-Twilio-Signature if TWILIO_AUTH_TOKEN is set

function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  // Sort params by key and build query string
  const sortedKeys = Object.keys(params).sort();
  const data = url + sortedKeys.map(k => `${k}${params[k]}`).join('');
  const expectedSignature = createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
  return signature === expectedSignature;
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  const twilioSignature = req.headers.get('X-Twilio-Signature');
  
  let body: any = {};
  let bodyText = '';
  
  if (contentType.includes('application/json')) {
    body = await req.json();
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    bodyText = await req.text();
    body = Object.fromEntries(new URLSearchParams(bodyText));
  }

  // Optional signature verification (if TWILIO_AUTH_TOKEN is set)
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken && twilioSignature) {
    const url = new URL(req.url).href;
    const isValid = validateTwilioSignature(authToken, twilioSignature, url, body);
    if (!isValid) {
      console.warn('Twilio webhook signature validation failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  }

  const messageSid = body.MessageSid || body.SmsSid || body.SmsMessageSid;
  const messageStatus = body.MessageStatus || body.SmsStatus;

  if (!messageSid) return NextResponse.json({ ok: true });

  try {
    // Update any communications matching this externalId
    await prisma.communication.updateMany({
      where: { externalId: String(messageSid) },
      data: { status: messageStatus || 'delivered', deliveredAt: new Date() },
    });
  } catch (err) {
    console.error('Twilio webhook update failed:', err);
  }

  return new NextResponse('OK', { status: 200 });
}
