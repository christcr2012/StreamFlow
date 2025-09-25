// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/_health",
  "/api/_echo",
  "/api/admin/bootstrap",
]);

// Anything here requires being signed in
const PROTECTED_PREFIXES = ["/dashboard", "/leads", "/admin", "/reports", "/settings", "/profile"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow _next (assets), static files, favicon, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Public routes pass through
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Protected prefixes: require mv_user cookie
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const cookie = req.cookies.get("mv_user")?.value;
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      // Keep original destination so we could return later if desired
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Limit middleware to pages (not API unless you want to)
export const config = {
  matcher: [
    "/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
