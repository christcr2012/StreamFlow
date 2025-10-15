import type { NextApiRequest, NextApiResponse } from 'next';

export type MinimalUser = {
  id: string;
  email: string;
  orgId: string;
  name?: string;
};

/**
 * Minimal requireAuth shim for legacy Pages API during App Router migration.
 * - Extracts user email from rs_user (or legacy mv_user) cookie/header.
 * - Responds 401 and returns null if unauthenticated.
 * - Populates a placeholder orgId; replace with real lookup later.
 */
export async function requireAuth(req: NextApiRequest, res: NextApiResponse): Promise<MinimalUser | null> {
  const fromCookie = (req.cookies?.rs_user || req.cookies?.mv_user) as string | undefined;
  const fromHeader = (req.headers['x-rs-user'] || req.headers['x-mv-user']) as string | undefined;
  const email = (fromCookie || fromHeader || '').toString().trim();
  if (!email) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const fallbackOrg = (req.headers['x-org-id'] as string) || 'org_placeholder';
  return { id: 'user_placeholder', email, orgId: fallbackOrg };
}

export async function auditLog(_req: NextApiRequest, _entry: Record<string, any>): Promise<void> {
  try { console.log('[auth:audit]', _entry); } catch {}
}

export function generateTemporaryPassword(length = 12): string {
  // Simple random hex password (placeholder)
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(length)));
  return bytes.map((b: any) => (b % 16).toString(16)).join('');
}

