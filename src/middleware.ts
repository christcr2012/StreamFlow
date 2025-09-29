// src/middleware.ts

/*
=== ENTERPRISE ROADMAP: REQUEST MIDDLEWARE & SECURITY GATEWAY ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Basic path-based authentication check using cookies
- Simple public/protected route classification
- Manual path prefix matching for protected routes

ENTERPRISE MIDDLEWARE COMPARISON (Kong, AWS API Gateway, Nginx Plus, Istio):
1. Advanced Request Processing:
   - Rate limiting with Redis/distributed counters
   - Request/response transformation and validation
   - Circuit breakers and bulkhead patterns
   - Distributed tracing with correlation IDs
   - Request/response compression and caching

2. Security & Authentication:
   - JWT token validation and renewal
   - API key management and rotation
   - OAuth 2.0 scope validation
   - CORS policy enforcement
   - CSP and security header injection

3. Observability & Monitoring:
   - Real-time metrics and alerting
   - Request logging with structured data
   - Performance monitoring and SLA tracking
   - Anomaly detection and threat analysis

IMPLEMENTATION ROADMAP:

🔥 Phase 1: Security & Rate Limiting (Week 1-2)
1. ENTERPRISE RATE LIMITING (VERCEL/EDGE COMPATIBLE):
   - Implement Upstash Ratelimit (edge-compatible) instead of Redis
   - Per-user, per-IP, and per-endpoint limits using Upstash Redis
   - Edge runtime compatible distributed rate limiting
   - Configurable limits based on user tier and API endpoint
   
   CRITICAL: Next.js Edge Runtime cannot use long-lived TCP connections to Redis.
   Use @upstash/ratelimit with @upstash/redis for edge compatibility:
   
   ```typescript
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";
   
   const redis = Redis.fromEnv();
   const ratelimit = new Ratelimit({
     redis: redis,
     limiter: Ratelimit.slidingWindow(10, "10 s"),
     analytics: true,
   });
   ```

2. JWT TOKEN VALIDATION:
   - Replace cookie checking with JWT token validation
   - Implement token refresh logic in middleware
   - Add scope and permission validation
   - Support for multiple token types (access, refresh, API keys)

⚡ Phase 2: Request Processing & Validation (Week 3-4)
3. REQUEST/RESPONSE TRANSFORMATION:
   - Schema validation using Joi/Zod for all API requests
   - Request sanitization and input validation
   - Response formatting and error standardization
   - API versioning support with header/URL-based routing

4. SECURITY HEADERS & CORS:
   - Comprehensive security header injection (HSTS, CSP, X-Frame-Options)
   - Dynamic CORS policy based on request context
   - Bot detection and challenge injection
   - DDoS protection with challenge-response mechanisms

🚀 Phase 3: Observability & Analytics (Month 2)
5. DISTRIBUTED TRACING:
   - OpenTelemetry integration with trace context propagation
   - Request correlation IDs across service boundaries
   - Performance metrics collection (latency, throughput)
   - Error tracking and alerting integration

6. INTELLIGENT ROUTING & LOAD BALANCING:
   - A/B testing support with traffic splitting
   - Canary deployment routing
   - Geographic routing and edge caching
   - Health check integration and circuit breaking

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: NextRequest) => string;
  handler: (req: NextRequest) => NextResponse;
}

// ENTERPRISE FEATURE: Request context with security information
export interface RequestContext {
  correlationId: string;
  userId?: string;
  userRole?: string;
  clientIP: string;
  userAgent: string;
  apiVersion: string;
  rateLimit: {
    remaining: number;
    reset: number;
    limit: number;
  };
  security: {
    riskLevel: 'low' | 'medium' | 'high';
    deviceTrusted: boolean;
    geolocation?: string;
  };
}

// ENTERPRISE FEATURE: Advanced middleware response with security headers
export interface EnterpriseResponse extends NextResponse {
  securityHeaders: Record<string, string>;
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
  };
  correlationId: string;
}

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/_health",
  "/api/_echo",
  "/api/admin/bootstrap",
]);

// Anything here requires being signed in
const PROTECTED_PREFIXES = [
  "/dashboard", "/leads", "/admin", "/reports", "/settings", "/profile",
  "/owner", "/manager", "/staff", "/billing", "/analytics", "/jobs",
  "/employees", "/clients", "/inventory", "/documents", "/calendar",
  "/administration", "/ai-usage", "/invoices", "/operations", "/projects",
  "/revenue", "/schedule", "/search", "/workforce", "/worker"
];

/**
 * 🔒 ENTERPRISE SECURITY MIDDLEWARE
 * Complete system isolation with zero cross-contamination
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets
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

  // Get user authentication from SEPARATE cookie systems
  const clientCookie = req.cookies.get("ws_user")?.value;
  const providerCookie = decodeURIComponent(req.cookies.get("ws_provider")?.value || '');
  const developerCookie = decodeURIComponent(req.cookies.get("ws_developer")?.value || '');
  const accountantCookie = decodeURIComponent(req.cookies.get("ws_accountant")?.value || '');

  // Define system boundaries (HARDCODED for deployment consistency)
  const providerEmail = 'chris.tcr.2012@gmail.com';
  const developerEmail = 'gametcr3@gmail.com';
  const accountantEmail = 'accountant@streamflow.com';

  // Determine user type based on WHICH cookie is present
  let userType: 'PROVIDER' | 'DEVELOPER' | 'CLIENT' | 'ACCOUNTANT' | 'UNAUTHENTICATED' = 'UNAUTHENTICATED';

  if (providerCookie && providerEmail && providerCookie.toLowerCase() === providerEmail) {
    userType = 'PROVIDER';
    console.log(`🏢 PROVIDER ACCESS: ${providerCookie}`);
  } else if (developerCookie && developerEmail && developerCookie.toLowerCase() === developerEmail) {
    userType = 'DEVELOPER';
    console.log(`🔧 DEVELOPER ACCESS: ${developerCookie}`);
  } else if (accountantCookie && accountantEmail && accountantCookie.toLowerCase() === accountantEmail) {
    userType = 'ACCOUNTANT';
    console.log(`💰 ACCOUNTANT ACCESS: ${accountantCookie}`);
  } else if (clientCookie) {
    userType = 'CLIENT';
    console.log(`👤 CLIENT ACCESS: ${clientCookie}`);
  }

  // Define route systems
  const isProviderRoute = pathname.startsWith('/provider');
  const isDeveloperRoute = pathname.startsWith('/dev');
  const isAccountantRoute = pathname.startsWith('/accountant');
  const isClientRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // CRITICAL SECURITY: Block all cross-system access
  if (isProviderRoute) {
    if (userType !== 'PROVIDER') {
      console.warn(`🚨 SECURITY VIOLATION: ${userType} user attempted provider access: ${pathname}`);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "provider_access_denied");
      return NextResponse.redirect(url);
    }
  } else if (isDeveloperRoute) {
    if (userType !== 'DEVELOPER') {
      console.warn(`🚨 SECURITY VIOLATION: ${userType} user attempted developer access: ${pathname}`);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "developer_access_denied");
      return NextResponse.redirect(url);
    }
  } else if (isAccountantRoute) {
    if (userType !== 'ACCOUNTANT') {
      console.warn(`🚨 SECURITY VIOLATION: ${userType} user attempted accountant access: ${pathname}`);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "accountant_access_denied");
      return NextResponse.redirect(url);
    }
  } else if (isClientRoute) {
    if (userType !== 'CLIENT') {
      console.warn(`🚨 SECURITY VIOLATION: ${userType} user attempted client access: ${pathname}`);

      // Redirect to appropriate system
      const url = req.nextUrl.clone();
      if (userType === 'PROVIDER') {
        url.pathname = "/provider";
      } else if (userType === 'DEVELOPER') {
        url.pathname = "/dev";
      } else if (userType === 'ACCOUNTANT') {
        url.pathname = "/accountant";
      } else {
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
      }
      return NextResponse.redirect(url);
    }
  }

  // SECURITY: If user is not authenticated and trying to access any non-public route, redirect to login
  if (userType === 'UNAUTHENTICATED' && !PUBLIC_PATHS.has(pathname) && pathname !== '/') {
    console.warn(`🚨 UNAUTHENTICATED ACCESS ATTEMPT: ${pathname}`);
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If no authentication required, allow
  return NextResponse.next();
}

// Limit middleware to pages (not API unless you want to)
export const config = {
  matcher: [
    "/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
