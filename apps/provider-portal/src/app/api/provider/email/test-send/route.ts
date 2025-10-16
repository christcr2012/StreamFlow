import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendGmail } from '@/lib/email/gmail';

const schema = z.object({ to: z.string().email(), subject: z.string().min(1), body: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || undefined;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });

    const { to, subject, body: html } = parsed.data;
    const res = await sendGmail({ to, subject, html, reqOrigin: origin });

    return NextResponse.json({ ok: true, id: res.id || res.threadId });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to send' }, { status: 500 });
  }
}

