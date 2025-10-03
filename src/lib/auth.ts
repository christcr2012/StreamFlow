import type { NextApiRequest } from 'next';

export async function logoutAndRedirect() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
  window.location.href = "/login";
}

/**
 * Verify token from request for audience middleware
 * Returns token payload with aud (audience) and tenant_id
 */
export async function verifyToken(req: NextApiRequest): Promise<any> {
  // Check for provider session
  if (req.cookies['provider-session'] || req.headers['x-provider-session']) {
    return { aud: 'provider', tenant_id: null };
  }

  // Check for developer session
  if (req.cookies['developer-session'] || req.headers['x-developer-session']) {
    return { aud: 'portal', tenant_id: null };
  }

  // Check for accountant session
  if (req.cookies['accountant-session'] || req.headers['x-accountant-session']) {
    return { aud: 'portal', tenant_id: null };
  }

  // Check for client session (tenant)
  if (req.cookies['next-auth.session-token'] || req.headers['authorization']) {
    const tenantId = req.headers['x-org-id'] as string || req.query.orgId as string || 'org_test';
    return { aud: 'tenant', tenant_id: tenantId };
  }

  throw new Error('No valid token found');
}
