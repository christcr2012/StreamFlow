// src/pages/api/auth/login.ts

/*
=== ENTERPRISE ROADMAP: AUTHENTICATION & SECURITY API ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Basic cookie-based authentication with bcrypt password hashing
- Simple form/JSON dual support for login requests
- Role-based redirection after successful authentication
- HttpOnly cookies with SameSite protection

ENTERPRISE API COMPARISON (Auth0, AWS Cognito, Okta, Firebase Auth):
1. Modern Authentication Standards:
   - JWT tokens with refresh token rotation
   - OAuth 2.0/OpenID Connect support
   - Multi-factor authentication (TOTP, SMS, Hardware keys)
   - Passwordless authentication (magic links, biometrics)
   - Social authentication providers (Google, Microsoft, LinkedIn)

2. Security Hardening:
   - Rate limiting with exponential backoff
   - Account lockout after failed attempts
   - CAPTCHA integration for bot protection
   - Device fingerprinting and risk assessment
   - Audit logging with security event correlation

3. Session Management:
   - Secure session tokens with automatic rotation
   - Concurrent session limits and management
   - Session revocation and "kill switches"
   - Device tracking and suspicious activity detection

IMPLEMENTATION ROADMAP:

🔥 Phase 1: Critical Security Improvements (Week 1-2)
1. JWT TOKEN AUTHENTICATION:
   - Replace cookie-based auth with JWT access/refresh tokens
   - Implement secure token storage (HttpOnly + Secure cookies)
   - Add token rotation and automatic renewal
   - Include user permissions and role claims in JWT payload
   
2. RATE LIMITING & DDoS PROTECTION:
   - Implement express-rate-limit with Redis backing store
   - Add progressive delays: 3 attempts (5 min), 6 attempts (1 hour), 10 attempts (24 hours)
   - CAPTCHA integration after 3 failed attempts
   - IP-based and account-based rate limiting

⚡ Phase 2: Advanced Authentication (Week 3-4)
3. MULTI-FACTOR AUTHENTICATION (MFA):
   - TOTP authenticator app support (Google Authenticator, Authy)
   - SMS backup codes with Twilio integration
   - Hardware security key support (FIDO2/WebAuthn)
   - Emergency backup codes with secure storage

4. OAUTH 2.0 & SOCIAL AUTHENTICATION (NEXT.JS/VERCEL OPTIMIZED):
   
   RECOMMENDED: Use NextAuth.js/Auth.js for production-ready OAuth implementation
   Installation: npm install next-auth @auth/prisma-adapter
   
   IMPLEMENTATION STRATEGY:
   
   A) Authorization Code + PKCE Flow (Most Secure):
   ```typescript
   // pages/api/auth/[...nextauth].ts
   import NextAuth from "next-auth"
   import GoogleProvider from "next-auth/providers/google"
   import AzureADProvider from "next-auth/providers/azure-ad"
   
   export default NextAuth({
     providers: [
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
         authorization: {
           params: {
             scope: "openid email profile",
             access_type: "offline",
             prompt: "consent",
           },
         },
       }),
       AzureADProvider({
         clientId: process.env.AZURE_AD_CLIENT_ID!,
         clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
         tenantId: process.env.AZURE_AD_TENANT_ID!,
       }),
     ],
     adapter: PrismaAdapter(prisma),
     session: { strategy: "jwt" },
     callbacks: {
       async jwt({ token, account, profile }) {
         if (account?.provider === "google" || account?.provider === "azure-ad") {
           token.accessToken = account.access_token
           token.refreshToken = account.refresh_token
         }
         return token
       },
     },
   })
   ```
   
   B) Enterprise SSO Configuration:
   - Microsoft Azure AD B2B/B2C integration
   - Google Workspace domain restrictions
   - LinkedIn authentication for professional networks
   - SAML 2.0 support via next-auth-saml provider
   
   C) Security Best Practices:
   - PKCE (Proof Key for Code Exchange) enabled by default in NextAuth.js
   - State parameter validation for CSRF protection
   - Secure token storage with HttpOnly cookies
   - JWT signature verification with rotating secrets

🚀 Phase 3: Enterprise Security Platform (Month 2)
5. ADVANCED THREAT PROTECTION:
   - Device fingerprinting and behavior analysis
   - Geolocation-based access controls
   - Risk-based authentication with adaptive policies
   - Integration with threat intelligence feeds

6. ENTERPRISE IDENTITY MANAGEMENT:
   - SCIM 2.0 provisioning for automated user management
   - Just-in-time (JIT) user provisioning from SAML/OIDC
   - Directory synchronization (Active Directory, LDAP)
   - Centralized policy management and compliance reporting

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: JWT Token Management
export interface JWTTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  scope: string[];
}

// ENTERPRISE FEATURE: Advanced login request with security context
export interface EnterpriseLoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
  deviceFingerprint?: string;
  challengeResponse?: string; // CAPTCHA or other challenge
  rememberDevice?: boolean;
  clientInfo: {
    userAgent: string;
    ipAddress: string;
    geolocation?: { latitude: number; longitude: number };
    platform: string;
  };
}

// ENTERPRISE FEATURE: Comprehensive authentication response
export interface EnterpriseLoginResponse {
  success: boolean;
  tokens?: JWTTokenPair;
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    profileComplete: boolean;
    mfaEnabled: boolean;
  };
  securityContext: {
    requiresMFA: boolean;
    deviceTrusted: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    lastLogin?: string;
    loginAttempts: number;
  };
  redirectUrl: string;
  sessionId: string;
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
    requiresCaptcha?: boolean;
  };
}

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function buildCookie(email: string) {
  let cookie = `ws_user=${encodeURIComponent(email)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  if (process.env.NODE_ENV === "production") cookie += "; Secure";
  return cookie;
}

// Tiny helper to detect form posts vs JSON
function isFormEncoded(req: NextApiRequest) {
  const ct = req.headers["content-type"] || "";
  return typeof ct === "string" && ct.includes("application/x-www-form-urlencoded");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }

    // Parse body (Next does it for us for JSON & urlencoded by default)
    // For forms, Next puts fields in req.body as an object too
    const body: Record<string, unknown> = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const emailInput = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();
    const explicitNext = (body.next || req.query.next)?.toString();
    // We'll determine the default redirect after we know the user's role

    if (!emailInput || !password) {
      if (isFormEncoded(req)) {
        // Redirect back to login with error
        res.setHeader("Location", `/login?error=missing`);
        return res.status(303).end();
      }
      return res.status(400).json({ ok: false, error: "Email and password required" });
    }

    const user = await db.user.findUnique({
      where: { email: emailInput },
      select: { email: true, passwordHash: true, status: true, role: true },
    });

    if (!user || user.status !== "active" || !user.passwordHash) {
      if (isFormEncoded(req)) {
        res.setHeader("Location", `/login?error=invalid`);
        return res.status(303).end();
      }
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // ENTERPRISE TODO: Replace console.log with structured audit logging
    // Implementation: Use Winston/Pino with correlation IDs and security event classification
    // audit.logSecurityEvent('authentication_attempt', { userId: user.id, email: emailInput, ipAddress: getClientIP(req) });
    console.log("DEBUG: Login attempt for", emailInput);
    console.log("DEBUG: Entered password:", password);
    console.log("DEBUG: Stored hash:", user.passwordHash);
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log("DEBUG: Password comparison result:", ok);
    
    if (!ok) {
      console.log("DEBUG: Password check failed, redirecting to login with error");
      if (isFormEncoded(req)) {
        res.setHeader("Location", `/login?error=invalid`);
        return res.status(303).end();
      }
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // Set cookie and determine redirect based on role
    res.setHeader("Set-Cookie", buildCookie(user.email));
    
    // Determine appropriate redirect URL based on user role
    let redirectUrl: string;
    if (explicitNext && explicitNext.startsWith("/")) {
      // If there's an explicit next URL, use it
      redirectUrl = explicitNext;
    } else {
      // Default redirect based on role
      switch (user.role) {
        case "STAFF":
          redirectUrl = "/worker/home";
          break;
        default:
          redirectUrl = "/dashboard";
          break;
      }
    }

    if (isFormEncoded(req)) {
      res.setHeader("Location", redirectUrl);
      return res.status(303).end();
    }

    return res.status(200).json({ ok: true, redirect: redirectUrl });
  } catch (e: unknown) {
    console.error("/api/auth/login error:", e);
    if (isFormEncoded(req)) {
      res.setHeader("Location", `/login?error=server`);
      return res.status(303).end();
    }
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}
