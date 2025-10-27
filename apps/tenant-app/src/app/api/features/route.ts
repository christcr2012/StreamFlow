// apps/tenant-app/src/app/api/features/route.ts
// Feature flags management API - Phase 2 (Global flags + Org overrides)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

type OrgFlagOverride = {
  enabled?: boolean;
  rolloutPercentage?: number;
  enabledForUsers?: string[];
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const enabled = searchParams.get('enabled');

    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });

    const org = await prisma.org.findUnique({
      where: { id: auth.orgId },
      select: { featureFlags: true },
    });

    const overrides = (org?.featureFlags as any) || {};

    const merged = flags.map((f) => {
      const ov: OrgFlagOverride = overrides[f.key] || {};
      const effectiveEnabled = typeof ov.enabled === 'boolean' ? ov.enabled : f.enabled;
      const effectiveRollout = typeof ov.rolloutPercentage === 'number' ? ov.rolloutPercentage : 100;
      const effectiveUsers = Array.isArray(ov.enabledForUsers) ? ov.enabledForUsers : [];

      return {
        id: f.id,
        key: f.key,
        name: f.name,
        description: f.description,
        enabled: effectiveEnabled,
        enabledForUsers: effectiveUsers,
        rolloutPercentage: effectiveRollout,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      };
    }).filter((item) => {
      if (enabled === 'true') return item.enabled;
      if (enabled === 'false') return !item.enabled;
      return true;
    });

    return NextResponse.json({ featureFlags: merged, total: merged.length });
  } catch (error) {
    console.error('GET /api/features error:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, name, description, enabled } = body as {
      key: string; name: string; description?: string; enabled?: boolean;
    };

    if (!key || !name) {
      return NextResponse.json({ error: 'key and name are required' }, { status: 400 });
    }

    const created = await prisma.featureFlag.create({
      data: {
        key,
        name,
        description: description || '',
        enabled: !!enabled,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/features error:', error);
    return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, enabled, rolloutPercentage, enabledForUsers } = body as {
      key: string; enabled?: boolean; rolloutPercentage?: number; enabledForUsers?: string[];
    };

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    const org = await prisma.org.findUnique({ where: { id: auth.orgId }, select: { featureFlags: true } });
    const current = (org?.featureFlags as any) || {};

    const next: Record<string, OrgFlagOverride> = {
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...(typeof enabled === 'boolean' ? { enabled } : {}),
        ...(typeof rolloutPercentage === 'number' ? { rolloutPercentage } : {}),
        ...(Array.isArray(enabledForUsers) ? { enabledForUsers } : {}),
      },
    };

    await prisma.org.update({
      where: { id: auth.orgId },
      data: { featureFlags: next as any },
    });

    return NextResponse.json({ key, updated: true });
  } catch (error) {
    console.error('PATCH /api/features error:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}
