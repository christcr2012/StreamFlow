import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateProvider,
  authenticateDeveloper,
  buildCookieHeader,
  type AuthInput,
  type ProviderAuthConfig,
  type DeveloperAuthConfig,
} from '@cortiware/auth-service';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// In-memory rate limiting (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

function checkRateLimit(email: string): { allowed: boolean; lockedUntil?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts) {
    return { allowed: true };
  }

  // Check if account is locked
  if (attempts.lockedUntil && attempts.lockedUntil > now) {
    return { allowed: false, lockedUntil: attempts.lockedUntil };
  }

  // Reset if lock expired
  if (attempts.lockedUntil && attempts.lockedUntil <= now) {
    loginAttempts.delete(email);
    return { allowed: true };
  }

  // Allow if under limit
  return { allowed: attempts.count < 5 };
}

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0 };

  attempts.count += 1;

  // Lock account after 5 failed attempts for 15 minutes
  if (attempts.count >= 5) {
    attempts.lockedUntil = now + 15 * 60 * 1000; // 15 minutes
  }

  loginAttempts.set(email, attempts);
}

function clearAttempts(email: string) {
  loginAttempts.delete(email);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const contentType = req.headers.get('content-type') || '';

  // Parse form data or JSON
  let email = '';
  let password = '';
  let totpCode = '';

  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      email = (formData.get('email') as string || '').trim();
      password = (formData.get('password') as string || '').trim();
      totpCode = (formData.get('totpCode') as string || '').trim();
    } else {
      const body = await req.json().catch(() => ({}));
      email = (body.email || '').trim();
      password = (body.password || '').trim();
      totpCode = (body.totpCode || '').trim();
    }
  } catch (err) {
    return NextResponse.redirect(new URL('/login?error=invalid', url), 303);
  }

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=missing', url), 303);
  }

  // Check rate limit
  const rateLimitCheck = checkRateLimit(email);
  if (!rateLimitCheck.allowed) {
    console.log(`🔒 Account locked: ${email} (until ${new Date(rateLimitCheck.lockedUntil!).toISOString()})`);
    return NextResponse.redirect(new URL('/login?error=locked&locked=true', url), 303);
  }

  const authInput: AuthInput = {
    email,
    password,
    totpCode: totpCode || undefined,
  };

  // Provider config from environment
  const providerConfig: ProviderAuthConfig = {
    envEmail: process.env.PROVIDER_EMAIL || '',
    envPassword: process.env.PROVIDER_PASSWORD || '',
    breakglassEmail: process.env.PROVIDER_BREAKGLASS_EMAIL,
    breakglassPassword: process.env.PROVIDER_BREAKGLASS_PASSWORD,
  };

  // Developer config from environment
  const developerConfig: DeveloperAuthConfig = {
    envEmail: process.env.DEVELOPER_EMAIL || '',
    envPassword: process.env.DEVELOPER_PASSWORD || '',
    breakglassEmail: process.env.DEVELOPER_BREAKGLASS_EMAIL,
    breakglassPassword: process.env.DEVELOPER_BREAKGLASS_PASSWORD,
  };

  // Try provider authentication
  const providerResult = await authenticateProvider(authInput, providerConfig);
  if (providerResult.success) {
    // Check if MFA is enabled for this user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { totpEnabled: true, totpSecret: true, backupCodesHash: true },
    });

    if (user?.totpEnabled && user.totpSecret) {
      // MFA is enabled - require TOTP code
      if (!totpCode) {
        return NextResponse.redirect(new URL('/login?totp=required', url), 303);
      }

      // Verify TOTP code
      const { verifyTOTPCode, verifyBackupCode } = await import('@cortiware/auth-service');
      const isValidTOTP = verifyTOTPCode(totpCode, user.totpSecret);

      if (!isValidTOTP) {
        // Try backup code
        if (user.backupCodesHash) {
          const backupResult = await verifyBackupCode(totpCode, user.backupCodesHash);
          if (backupResult.valid) {
            // Update backup codes (remove used code)
            await prisma.user.update({
              where: { email },
              data: { backupCodesHash: backupResult.updatedJson },
            });
          } else {
            recordFailedAttempt(email);
            return NextResponse.redirect(new URL('/login?error=invalid&totp=required', url), 303);
          }
        } else {
          recordFailedAttempt(email);
          return NextResponse.redirect(new URL('/login?error=invalid&totp=required', url), 303);
        }
      }
    }

    console.log(`✅ Provider login: ${email}`);
    clearAttempts(email); // Clear failed attempts on success
    const res = NextResponse.redirect(new URL('/provider', url), 303);
    const cookieHeader = buildCookieHeader({
      name: 'rs_provider',
      value: email,
    });
    res.headers.append('Set-Cookie', cookieHeader);
    return res;
  }

  // Try developer authentication
  const developerResult = await authenticateDeveloper(authInput, developerConfig);
  if (developerResult.success) {
    // Check if MFA is enabled for this user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { totpEnabled: true, totpSecret: true, backupCodesHash: true },
    });

    if (user?.totpEnabled && user.totpSecret) {
      // MFA is enabled - require TOTP code
      if (!totpCode) {
        return NextResponse.redirect(new URL('/login?totp=required', url), 303);
      }

      // Verify TOTP code
      const { verifyTOTPCode, verifyBackupCode } = await import('@cortiware/auth-service');
      const isValidTOTP = verifyTOTPCode(totpCode, user.totpSecret);

      if (!isValidTOTP) {
        // Try backup code
        if (user.backupCodesHash) {
          const backupResult = await verifyBackupCode(totpCode, user.backupCodesHash);
          if (backupResult.valid) {
            // Update backup codes (remove used code)
            await prisma.user.update({
              where: { email },
              data: { backupCodesHash: backupResult.updatedJson },
            });
          } else {
            recordFailedAttempt(email);
            return NextResponse.redirect(new URL('/login?error=invalid&totp=required', url), 303);
          }
        } else {
          recordFailedAttempt(email);
          return NextResponse.redirect(new URL('/login?error=invalid&totp=required', url), 303);
        }
      }
    }

    console.log(`✅ Developer login: ${email}`);
    clearAttempts(email); // Clear failed attempts on success
    const res = NextResponse.redirect(new URL('/provider', url), 303);
    const cookieHeader = buildCookieHeader({
      name: 'rs_developer',
      value: email,
    });
    res.headers.append('Set-Cookie', cookieHeader);
    return res;
  }

  // Check if TOTP is required
  if (providerResult.requiresTOTP || developerResult.requiresTOTP) {
    return NextResponse.redirect(new URL('/login?totp=required', url), 303);
  }

  // Authentication failed - record attempt
  recordFailedAttempt(email);
  const attempts = loginAttempts.get(email);
  console.log(`❌ Login failed: ${email} (${attempts?.count || 0}/5 attempts)`);

  return NextResponse.redirect(new URL('/login?error=invalid', url), 303);
}

