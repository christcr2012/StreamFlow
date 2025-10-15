// Provider Notifications Service
// Server-only service for in-app notifications for provider/developer audiences

import { prisma } from '@/lib/prisma';

export type NotificationItem = {
  id: string;
  orgId: string | null;
  audience: string;
  type: string;
  title: string;
  body: string;
  severity: string;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(params?: { audience?: string; orgId?: string | null; limit?: number }) {
  const { audience = 'provider', orgId = null, limit = 10 } = params || {};
  const items = await prisma.notification.findMany({
    where: { audience, ...(orgId === null ? {} : { orgId }) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return items.map((n: any) => ({
    id: n.id,
    orgId: n.orgId ?? null,
    audience: n.audience,
    type: n.type,
    title: n.title,
    body: n.body,
    severity: n.severity,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  })) as NotificationItem[];
}

export async function markNotificationRead(id: string) {
  await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
}

