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

  // ENTERPRISE TODO: Replace simple cookie check with comprehensive JWT validation
  // Implementation needs:
  // 1. JWT token extraction from Authorization header or secure cookies
  // 2. Token signature validation and expiry checking
  // 3. User permission validation against required endpoint permissions
  // 4. Rate limiting enforcement per user/IP
  // 5. Request context enrichment with user data and security metrics
  
  // Protected prefixes: require ws_user cookie
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const cookie = req.cookies.get("ws_user")?.value;
    if (!cookie) {
      // ENTERPRISE TODO: Add rate limiting check before redirect
      // ENTERPRISE TODO: Log security event for unauthorized access attempt
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
