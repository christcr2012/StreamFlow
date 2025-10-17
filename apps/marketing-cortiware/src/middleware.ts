import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';

  // Redirect apex -> www for production domain
  if (host === 'cortiware.com') {
    const url = new URL(req.nextUrl.toString());
    url.hostname = 'www.cortiware.com';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

