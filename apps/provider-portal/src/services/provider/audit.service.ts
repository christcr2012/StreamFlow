// Provider Audit Service
// Server-only service for audit log querying and event feed
// Note: AuditLog model uses entity/entityId/field structure, not actor/action/resource

import { prisma } from '@/lib/prisma';

export type AuditSummary = {
  totalEvents: number;
  recentEvents: number;
  topEntities: Array<{ entity: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
};

export type AuditEventItem = {
  id: string;
  actorUserId: string | null;
  entity: string;
  entityId: string | null;
  field: string | null;
  oldValue: any;
  newValue: any;
  reason: string | null;
  orgId: string;
  orgName: string | null;
  createdAt: string;
};

/**
 * Get audit summary
 */
export async function getAuditSummary(): Promise<AuditSummary> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalEvents, recentEvents, entities, users] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.auditLog.findMany({
        select: { entity: true },
        distinct: ['entity'],
        take: 5,
      }),
      prisma.auditLog.findMany({
        where: { actorUserId: { not: null } },
        select: { actorUserId: true },
        distinct: ['actorUserId'],
        take: 5,
      }),
    ]);

    // Count occurrences
    const entityCounts = await Promise.all(
      entities.map(async (e) => ({
        entity: e.entity,
        count: await prisma.auditLog.count({ where: { entity: e.entity } }),
      }))
    );

    const userCounts = await Promise.all(
      users.map(async (u) => ({
        userId: u.actorUserId!,
        count: await prisma.auditLog.count({ where: { actorUserId: u.actorUserId } }),
      }))
    );

    return {
      totalEvents,
      recentEvents,
      topEntities: entityCounts.sort((a, b) => b.count - a.count),
      topUsers: userCounts.sort((a, b) => b.count - a.count),
    };
  } catch (error) {
    console.error('Error in getAuditSummary:', error);
    return {
      totalEvents: 0,
      recentEvents: 0,
      topEntities: [],
      topUsers: [],
    };
  }
}

/**
 * List audit events with pagination and filtering
 */
export async function listAuditEvents(params: {
  cursor?: string;
  limit?: number;
  userId?: string;
  entity?: string;
  orgId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ items: AuditEventItem[]; nextCursor: string | null }> {
  const { cursor, limit = 50, userId, entity, orgId, startDate, endDate } = params;

  const where: any = {};
  if (userId) where.actorUserId = userId;
  if (entity) where.entity = entity;
  if (orgId) where.orgId = orgId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const events = await prisma.auditLog.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items: items.map((evt: any) => ({
      id: evt.id,
      actorUserId: evt.actorUserId,
      entity: evt.entity,
      entityId: evt.entityId,
      field: evt.field,
      oldValue: evt.oldValue,
      newValue: evt.newValue,
      reason: evt.reason,
      orgId: evt.orgId,
      orgName: evt.org.name,
      createdAt: evt.createdAt.toISOString(),
    })),
    nextCursor,
  };
}

/**
 * Get audit events for a specific entity
 */
export async function getEntityAuditTrail(params: {
  entity: string;
  entityId: string;
}): Promise<AuditEventItem[]> {
  const { entity, entityId } = params;

  const events = await prisma.auditLog.findMany({
    where: {
      entity,
      entityId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  return events.map((evt: any) => ({
    id: evt.id,
    actorUserId: evt.actorUserId,
    entity: evt.entity,
    entityId: evt.entityId,
    field: evt.field,
    oldValue: evt.oldValue,
    newValue: evt.newValue,
    reason: evt.reason,
    orgId: evt.orgId,
    orgName: evt.org.name,
    createdAt: evt.createdAt.toISOString(),
  }));
}

/**
 * Get activity timeline for an organization
 */
export async function getOrgActivityTimeline(orgId: string, limit: number = 50): Promise<AuditEventItem[]> {
  const events = await prisma.auditLog.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  return events.map((evt: any) => ({
    id: evt.id,
    actorUserId: evt.actorUserId,
    entity: evt.entity,
    entityId: evt.entityId,
    field: evt.field,
    oldValue: evt.oldValue,
    newValue: evt.newValue,
    reason: evt.reason,
    orgId: evt.orgId,
    orgName: evt.org.name,
    createdAt: evt.createdAt.toISOString(),
  }));
}

/**
 * Search audit logs by text
 */
export async function searchAuditLogs(params: {
  query: string;
  limit?: number;
}): Promise<AuditEventItem[]> {
  const { query, limit = 50 } = params;

  // Search in entity and field
  const events = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity: { contains: query, mode: 'insensitive' } },
        { field: { contains: query, mode: 'insensitive' } },
        { entityId: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  return events.map((evt: any) => ({
    id: evt.id,
    actorUserId: evt.actorUserId,
    entity: evt.entity,
    entityId: evt.entityId,
    field: evt.field,
    oldValue: evt.oldValue,
    newValue: evt.newValue,
    reason: evt.reason,
    orgId: evt.orgId,
    orgName: evt.org.name,
    createdAt: evt.createdAt.toISOString(),
  }));
}

/**
 * Get audit statistics by time period
 */
export async function getAuditStatsByPeriod(days: number = 7): Promise<Array<{
  date: string;
  count: number;
  uniqueUsers: number;
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      actorUserId: true,
    },
  });

  // Group by date
  const grouped = events.reduce((acc: any, evt: any) => {
    const date = evt.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { count: 0, users: new Set<string>() };
    }
    acc[date].count += 1;
    if (evt.actorUserId) acc[date].users.add(evt.actorUserId);
    return acc;
  }, {} as Record<string, { count: number; users: Set<string> }>);

  return (Object.entries(grouped) as [string, { count: number; users: Set<string> }][])
    .map(([date, data]) => ({
      date,
      count: data.count,
      uniqueUsers: data.users.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

