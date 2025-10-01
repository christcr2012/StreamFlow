// src/server/services/auditService.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

// Re-export ServiceError for convenience
export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const ListAuditLogsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListAuditLogsInput = z.infer<typeof ListAuditLogsSchema>;

export interface AuditLogResult {
  id: string;
  orgId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  delta: any;
  createdAt: Date;
}

export interface ListAuditLogsResult {
  logs: AuditLogResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStatsResult {
  totalLogs: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byActor: Record<string, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

// ===== AUDIT SERVICE =====

export class AuditService {
  /**
   * List audit logs with filtering and pagination
   */
  async list(orgId: string, input: ListAuditLogsInput): Promise<ListAuditLogsResult> {
    // Validate input
    const validated = ListAuditLogsSchema.parse(input);

    // Build where clause
    const where: any = { orgId };

    if (validated.entityType) {
      where.entityType = validated.entityType;
    }

    if (validated.entityId) {
      where.entityId = validated.entityId;
    }

    if (validated.actorId) {
      where.actorId = validated.actorId;
    }

    if (validated.action) {
      where.action = validated.action;
    }

    // Date range filtering
    if (validated.fromDate || validated.toDate) {
      where.createdAt = {};
      if (validated.fromDate) {
        where.createdAt.gte = new Date(validated.fromDate);
      }
      if (validated.toDate) {
        where.createdAt.lte = new Date(validated.toDate);
      }
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: validated.sortOrder,
      },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    });

    return {
      logs,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    };
  }

  /**
   * Get audit log by ID
   */
  async getById(orgId: string, logId: string): Promise<AuditLogResult> {
    const log = await prisma.auditLog.findFirst({
      where: {
        id: logId,
        orgId,
      },
    });

    if (!log) {
      throw new ServiceError(
        'Audit log not found',
        'NOT_FOUND',
        404
      );
    }

    return log;
  }

  /**
   * Get audit statistics
   */
  async getStats(orgId: string): Promise<AuditStatsResult> {
    // Get total logs
    const totalLogs = await prisma.auditLog.count({ where: { orgId } });

    // Get logs for analysis
    const logs = await prisma.auditLog.findMany({
      where: { orgId },
      select: {
        action: true,
        entityType: true,
        actorId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Analyze last 1000 logs
    });

    // Count by action
    const byAction: Record<string, number> = {};
    logs.forEach(log => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
    });

    // Count by entity type
    const byEntityType: Record<string, number> = {};
    logs.forEach(log => {
      byEntityType[log.entityType] = (byEntityType[log.entityType] || 0) + 1;
    });

    // Count by actor
    const byActor: Record<string, number> = {};
    logs.forEach(log => {
      if (log.actorId) {
        byActor[log.actorId] = (byActor[log.actorId] || 0) + 1;
      }
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = logs.filter(log => log.createdAt >= sevenDaysAgo);

    // Group by date
    const activityByDate: Record<string, number> = {};
    recentLogs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    const recentActivity = Object.entries(activityByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLogs,
      byAction,
      byEntityType,
      byActor,
      recentActivity,
    };
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityTrail(
    orgId: string,
    entityType: string,
    entityId: string
  ): Promise<AuditLogResult[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        orgId,
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return logs;
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    orgId: string,
    userId: string,
    limit: number = 50
  ): Promise<AuditLogResult[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        orgId,
        actorId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs;
  }
}

// Export singleton instance
export const auditService = new AuditService();

