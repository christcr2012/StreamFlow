import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const clientTheme = cookieStore.get('rs_client_theme')?.value;

    return NextResponse.json({ client: clientTheme || null, current: clientTheme || 'futuristic-green' });
  } catch (error) {
    console.error('[Tenant Theme API] GET error:', error);
    return NextResponse.json({ error: 'server-error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { scope, theme } = await req.json();

    // Default to client scope in tenant app
    const cookieName = scope === 'admin' ? 'rs_admin_theme' : 'rs_client_theme';

    const cookieStore = await cookies();
    cookieStore.set(cookieName, theme, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const verifyValue = cookieStore.get(cookieName)?.value;

    return NextResponse.json({ success: true, theme, scope: 'client', cookieName, verified: verifyValue === theme });
  } catch (error) {
    console.error('[Tenant Theme API] POST error:', error);
    return NextResponse.json({ error: 'bad-json' }, { status: 400 });
  }
}

