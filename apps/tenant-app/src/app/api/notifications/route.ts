// apps/tenant-app/src/app/api/notifications/route.ts
// Notifications API - Phase 2 (Prisma-backed)

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const read = searchParams.get('read'); // 'true' | 'false'
    const type = searchParams.get('type'); // e.g., 'job', 'system', etc.

    const where: any = { orgId: auth.orgId };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (read === 'true') {
      where.readAt = { not: null };
    } else if (read === 'false') {
      where.readAt = null;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.notification.count({ where: { orgId: auth.orgId, readAt: null } }),
    ]);

    // Map to client shape
    const items = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.body,
      priority: n.severity,
      read: !!n.readAt,
      userId: null,
      createdAt: n.createdAt,
      actionUrl: null,
    }));

    return NextResponse.json({
      notifications: items,
      total: items.length,
      unreadCount,
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, read } = body as { id: string; read: boolean };

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: read ? new Date() : null },
    });

    return NextResponse.json({
      id: updated.id,
      read: !!updated.readAt,
      updatedAt: updated.readAt ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
