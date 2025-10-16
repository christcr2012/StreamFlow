import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@cortiware/kv';
import { exchangeCodeForTokens, saveRefreshToken } from '@/lib/email/gmail';

function decodeIdTokenEmail(idToken?: string): string | null {
  try {
    if (!idToken) return null;
    const [, payload] = idToken.split('.');
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return json?.email || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const kv = getKVClient();
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return NextResponse.json({ error: 'Missing code/state' }, { status: 400 });

    const seen = await kv.get<string>(`oauth:state:${state}`);
    if (!seen) return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    await kv.del(`oauth:state:${state}`);

    const origin = request.headers.get('origin') || undefined;
    const tokens = await exchangeCodeForTokens(code, origin);
    const email = decodeIdTokenEmail(tokens.id_token || undefined) || undefined;

    if (tokens.refresh_token) {
      await saveRefreshToken(tokens.refresh_token, email);
    }

    const redirect = new URL('/provider/settings/email?connected=1', url.origin);
    return NextResponse.redirect(redirect.toString());
  } catch (err: any) {
    console.error('Gmail OAuth callback error:', err);
    return NextResponse.json({ error: err?.message || 'OAuth callback failed' }, { status: 500 });
  }
}

