import { NextRequest, NextResponse } from 'next/server';
import { hasRefreshToken, getConnectedEmail } from '@/lib/email/gmail';

export async function GET(_request: NextRequest) {
  try {
    const connected = await hasRefreshToken();
    const email = connected ? await getConnectedEmail() : null;
    return NextResponse.json({ connected, email });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

