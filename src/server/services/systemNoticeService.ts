// src/server/services/systemNoticeService.ts
// System-wide notices for all tenants
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';
import { z } from 'zod';

export { ServiceError };

// ===== SCHEMAS =====

const CreateNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['info', 'warning', 'critical', 'maintenance']),
  targetAll: z.boolean().default(true),
  targetOrgs: z.array(z.string()).optional(),
  dismissible: z.boolean().default(true),
  priority: z.number().int().min(0).max(10).default(0),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
});

const UpdateNoticeSchema = CreateNoticeSchema.partial();

// ===== SYSTEM NOTICE SERVICE =====

export class SystemNoticeService {
  /**
   * Create system notice (provider only)
   */
  async createNotice(createdBy: string, input: z.infer<typeof CreateNoticeSchema>) {
    const validated = CreateNoticeSchema.parse(input);

    // Validate targeting
    if (!validated.targetAll && (!validated.targetOrgs || validated.targetOrgs.length === 0)) {
      throw new ServiceError(
        'Must target all or specify target orgs',
        'INVALID_TARGETING',
        400
      );
    }

    const notice = await prisma.systemNotice.create({
      data: {
        title: validated.title,
        message: validated.message,
        type: validated.type,
        targetAll: validated.targetAll,
        targetOrgs: validated.targetOrgs as any,
        dismissible: validated.dismissible,
        priority: validated.priority,
        startAt: new Date(validated.startAt),
        endAt: validated.endAt ? new Date(validated.endAt) : null,
        createdBy,
        active: true,
      },
    });

    return notice;
  }

  /**
   * Update system notice (provider only)
   */
  async updateNotice(
    noticeId: string,
    input: z.infer<typeof UpdateNoticeSchema>
  ) {
    const validated = UpdateNoticeSchema.parse(input);

    const existing = await prisma.systemNotice.findUnique({
      where: { id: noticeId },
    });

    if (!existing) {
      throw new ServiceError('Notice not found', 'NOTICE_NOT_FOUND', 404);
    }

    const updateData: any = {};

    if (validated.title) updateData.title = validated.title;
    if (validated.message) updateData.message = validated.message;
    if (validated.type) updateData.type = validated.type;
    if (validated.targetAll !== undefined) updateData.targetAll = validated.targetAll;
    if (validated.targetOrgs) updateData.targetOrgs = validated.targetOrgs as any;
    if (validated.dismissible !== undefined) updateData.dismissible = validated.dismissible;
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.startAt) updateData.startAt = new Date(validated.startAt);
    if (validated.endAt) updateData.endAt = new Date(validated.endAt);

    const updated = await prisma.systemNotice.update({
      where: { id: noticeId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Deactivate notice (provider only)
   */
  async deactivateNotice(noticeId: string) {
    const notice = await prisma.systemNotice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) {
      throw new ServiceError('Notice not found', 'NOTICE_NOT_FOUND', 404);
    }

    const updated = await prisma.systemNotice.update({
      where: { id: noticeId },
      data: { active: false },
    });

    return updated;
  }

  /**
   * Get active notices for a tenant
   */
  async getActiveNotices(orgId: string) {
    const now = new Date();

    const notices = await prisma.systemNotice.findMany({
      where: {
        active: true,
        startAt: { lte: now },
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } },
            ],
          },
          {
            OR: [
              { targetAll: true },
              { targetOrgs: { array_contains: orgId } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { startAt: 'desc' },
      ],
    });

    return notices;
  }

  /**
   * List all notices (provider only)
   */
  async listNotices(filters: {
    active?: boolean;
    type?: string;
    limit?: number;
  } = {}) {
    const where: any = {};

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const notices = await prisma.systemNotice.findMany({
      where,
      take: filters.limit || 100,
      orderBy: [
        { priority: 'desc' },
        { startAt: 'desc' },
      ],
    });

    return notices;
  }

  /**
   * Delete notice (provider only)
   */
  async deleteNotice(noticeId: string) {
    const notice = await prisma.systemNotice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) {
      throw new ServiceError('Notice not found', 'NOTICE_NOT_FOUND', 404);
    }

    await prisma.systemNotice.delete({
      where: { id: noticeId },
    });

    return { success: true };
  }

  /**
   * Get notice statistics (provider only)
   */
  async getStatistics() {
    const now = new Date();

    const total = await prisma.systemNotice.count();
    const active = await prisma.systemNotice.count({
      where: {
        active: true,
        startAt: { lte: now },
        OR: [
          { endAt: null },
          { endAt: { gte: now } },
        ],
      },
    });

    const byType = await prisma.systemNotice.groupBy({
      by: ['type'],
      _count: true,
      where: { active: true },
    });

    return {
      total,
      active,
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
    };
  }
}

export const systemNoticeService = new SystemNoticeService();

