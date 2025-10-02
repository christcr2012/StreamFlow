import { prisma } from '@/lib/prisma';

export class RateLimitService {
  /**
   * Check if rate limit is exceeded
   */
  async checkLimit(
    orgId: string,
    key: string,
    buId?: string
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    // Get rate limit config
    const rateLimit = await prisma.rateLimit.findFirst({
      where: {
        orgId,
        key,
        buId: buId || null,
      },
    });

    if (!rateLimit) {
      // No limit configured, allow
      return {
        allowed: true,
        remaining: 999999,
        resetAt: new Date(Date.now() + 60000),
      };
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    // Count usage in different windows
    const [minuteCount, hourCount, dayCount] = await Promise.all([
      prisma.rateLimitUsage.count({
        where: {
          orgId,
          key,
          buId: buId || null,
          createdAt: { gte: oneMinuteAgo },
        },
      }),
      prisma.rateLimitUsage.count({
        where: {
          orgId,
          key,
          buId: buId || null,
          createdAt: { gte: oneHourAgo },
        },
      }),
      prisma.rateLimitUsage.count({
        where: {
          orgId,
          key,
          buId: buId || null,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ]);

    // Check limits
    const minuteLimit = rateLimit.limitPerMinute || 999999;
    const hourLimit = rateLimit.limitPerHour || 999999;
    const dayLimit = rateLimit.limitPerDay || 999999;

    if (minuteCount >= minuteLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now.getTime() + 60000),
      };
    }

    if (hourCount >= hourLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now.getTime() + 3600000),
      };
    }

    if (dayCount >= dayLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now.getTime() + 86400000),
      };
    }

    // Calculate remaining (use most restrictive limit)
    const remaining = Math.min(
      minuteLimit - minuteCount,
      hourLimit - hourCount,
      dayLimit - dayCount
    );

    return {
      allowed: true,
      remaining,
      resetAt: new Date(now.getTime() + 60000),
    };
  }

  /**
   * Record usage
   */
  async recordUsage(
    orgId: string,
    key: string,
    buId?: string,
    quantity: number = 1
  ): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (now.getTime() % 60000)); // Round to minute

    // Try to increment existing window
    const existing = await prisma.rateLimitUsage.findFirst({
      where: {
        orgId,
        key,
        buId: buId || null,
        windowStart,
        windowType: 'minute',
      },
    });

    if (existing) {
      await prisma.rateLimitUsage.update({
        where: { id: existing.id },
        data: { count: { increment: quantity } },
      });
    } else {
      await prisma.rateLimitUsage.create({
        data: {
          orgId,
          key,
          buId: buId || null,
          windowStart,
          windowType: 'minute',
          count: quantity,
        },
      });
    }
  }

  /**
   * Create or update rate limit
   */
  async setLimit(
    orgId: string,
    key: string,
    limits: {
      limitPerMinute?: number;
      limitPerHour?: number;
      limitPerDay?: number;
    },
    buId?: string
  ) {
    const existing = await prisma.rateLimit.findFirst({
      where: {
        orgId,
        key,
        buId: buId || null,
      },
    });

    if (existing) {
      return await prisma.rateLimit.update({
        where: { id: existing.id },
        data: limits,
      });
    }

    return await prisma.rateLimit.create({
      data: {
        orgId,
        key,
        buId: buId || null,
        ...limits,
      },
    });
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    orgId: string,
    key: string,
    buId?: string,
    since?: Date
  ) {
    const sinceDate = since || new Date(Date.now() - 86400000); // Default: last 24 hours

    const usage = await prisma.rateLimitUsage.findMany({
      where: {
        orgId,
        key,
        buId: buId || null,
        createdAt: { gte: sinceDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const totalQuantity = usage.reduce((sum, u) => sum + u.count, 0);

    // Group by hour
    const byHour: Record<string, number> = {};
    usage.forEach((u) => {
      const hour = new Date(u.createdAt).toISOString().slice(0, 13);
      byHour[hour] = (byHour[hour] || 0) + u.count;
    });

    return {
      total: totalQuantity,
      count: usage.length,
      byHour,
      since: sinceDate,
    };
  }

  /**
   * Clean up old usage records
   */
  async cleanup(olderThan: Date) {
    const result = await prisma.rateLimitUsage.deleteMany({
      where: {
        createdAt: { lt: olderThan },
      },
    });

    return result.count;
  }
}

export const rateLimitService = new RateLimitService();

