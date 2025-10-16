import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@cortiware/kv';
import { buildAuthUrl } from '@/lib/email/gmail';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const kv = getKVClient();
    const state = crypto.randomUUID();
    await kv.set(`oauth:state:${state}`, '1', { ex: 600 });
    const origin = request.headers.get('origin') || undefined;
    const url = buildAuthUrl(state, origin);
    return NextResponse.redirect(url);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to start OAuth' }, { status: 500 });
  }
}

