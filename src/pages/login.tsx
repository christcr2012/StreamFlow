// src/pages/login.tsx
/*
=== ENTERPRISE UI/UX ROADMAP: AUTHENTICATION & SECURITY UX ===

🏢 CURRENT vs ENTERPRISE STANDARDS COMPARISON:
Current: Basic login form with error handling | Enterprise Standard: Comprehensive authentication experience
SCORE: 6/10 - Functional but needs enterprise security UX enhancements

🎯 ENTERPRISE AUTHENTICATION UX ROADMAP:

🔥 HIGH PRIORITY (Q1 2025):
1. ADVANCED AUTHENTICATION EXPERIENCE
   - Multi-factor authentication with biometric support
   - Social login integration (SSO, SAML, OIDC)
   - Progressive authentication with risk assessment
   - Password strength indicators and real-time validation
   - Competitor: Auth0 Universal Login, Okta Sign-In Widget

2. SECURITY-FIRST UX PATTERNS
   - CAPTCHA integration with accessibility alternatives
   - Account lockout protection with progressive delays
   - Breach notification and forced password reset flows
   - Session management with device tracking
   - Competitor: Microsoft Azure AD B2C, Firebase Auth

3. ACCESSIBILITY & MOBILE OPTIMIZATION
   - Screen reader optimized form labels and instructions
   - Touch-friendly form controls with proper spacing
   - Voice authentication and accessibility features
   - High contrast and reduced motion support
   - Competitor: Apple Sign-In accessibility, Google Identity

⚡ MEDIUM PRIORITY (Q2 2025):
4. INTELLIGENT AUTHENTICATION
   - Risk-based authentication with behavioral analysis
   - Adaptive authentication challenges
   - Automated account recovery workflows
   - Enterprise SSO federation and just-in-time provisioning
   - Competitor: Ping Identity, CyberArk Identity

5. PASSWORDLESS AUTHENTICATION
   - WebAuthn/FIDO2 support for hardware keys
   - Magic link authentication with email/SMS
   - Biometric authentication (fingerprint, face ID)
   - Enterprise certificate-based authentication
   - Competitor: Microsoft Passwordless, Duo Security

🛠️ TECHNICAL IMPLEMENTATION:
- WebAuthn API for passwordless authentication
- Crypto API for secure credential storage
- Web Workers for non-blocking authentication processing
- Secure session management with HTTP-only cookies (never cache credentials)
- Service Workers limited to static assets only (authentication data strictly forbidden)
- Real-time validation with debounced API calls
*/

import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

/**
 * ENTERPRISE ROADMAP: Authentication Component Enhancement
 * 
 * IMPROVEMENTS NEEDED:
 * - Add progressive authentication with risk assessment
 * - Implement biometric and hardware key support
 * - Add social login and enterprise SSO integration
 * - Include accessibility features and screen reader support
 * - Add password strength validation and breach protection
 * - Implement mobile-optimized touch interactions
 * - Add voice authentication capabilities
 * 
 * CURRENT: Basic email/password login
 * TARGET: Enterprise-grade authentication experience
 * COMPETITORS: Auth0, Okta, Microsoft Azure AD B2C
 */
export default function Login() {
  const r = useRouter();
  const { error, next } = r.query as { error?: string; next?: string };

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="glass-card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Welcome Back</h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Sign in to your WorkStream account
          </p>
        </div>

        {error === "missing" && (
          <div className="mb-6 p-4 rounded-lg" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)' 
          }}>
            <p className="text-sm" style={{ color: 'var(--accent-error)' }}>
              ⚠️ Please enter email and password.
            </p>
          </div>
        )}
        
        {error === "invalid" && (
          <div className="mb-6 p-4 rounded-lg" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)' 
          }}>
            <p className="text-sm" style={{ color: 'var(--accent-error)' }}>
              ❌ Invalid email or password.
            </p>
          </div>
        )}
        
        {error === "server" && (
          <div className="mb-6 p-4 rounded-lg" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)' 
          }}>
            <p className="text-sm" style={{ color: 'var(--accent-error)' }}>
              🔧 Server error. Please try again.
            </p>
          </div>
        )}

        <form method="POST" action="/api/auth/login" className="space-y-6">
          <input type="hidden" name="next" value={next || "/dashboard"} />

          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              htmlFor="email"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              required
              type="email"
              className="input-field"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              htmlFor="password"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              autoComplete="current-password"
              required
              type="password"
              className="input-field"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3">
            <span>Sign In</span>
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Mountain Vista Lead Management System
          </p>
        </div>
      </div>
    </div>
  );
}

// If already signed in, bounce to dashboard.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (ctx.req.cookies?.ws_user) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
};
