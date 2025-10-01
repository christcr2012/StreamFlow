// src/server/services/adoptionDiscountService.ts
// Adoption-based discount system: 10% discount per 10% adoption, cap at 70%
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';

export { ServiceError };

// ===== ADOPTION DISCOUNT SERVICE =====

export class AdoptionDiscountService {
  /**
   * Calculate adoption rate for an organization
   */
  async calculateAdoptionRate(orgId: string): Promise<{
    totalUsers: number;
    aiActiveUsers: number;
    adoptionRate: number;
  }> {
    // Get total users in org
    const totalUsers = await prisma.user.count({
      where: { orgId },
    });

    if (totalUsers === 0) {
      return { totalUsers: 0, aiActiveUsers: 0, adoptionRate: 0 };
    }

    // Get users who have used AI in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const aiUsers = await prisma.aiTask.groupBy({
      by: ['userId'],
      where: {
        orgId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const aiActiveUsers = aiUsers.length;
    const adoptionRate = (aiActiveUsers / totalUsers) * 100;

    return {
      totalUsers,
      aiActiveUsers,
      adoptionRate: Math.round(adoptionRate * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Calculate discount percentage based on adoption
   * 10% discount per 10% adoption, capped at 70%
   */
  async calculateDiscount(orgId: string): Promise<{
    adoptionRate: number;
    discountPercent: number;
    nextTierAt: number;
    maxDiscount: boolean;
  }> {
    const { adoptionRate } = await this.calculateAdoptionRate(orgId);

    // 10% discount per 10% adoption
    const discountPercent = Math.min(Math.floor(adoptionRate / 10) * 10, 70);

    // Calculate next tier threshold
    const nextTierAt = discountPercent < 70 ? (Math.floor(adoptionRate / 10) + 1) * 10 : 100;

    return {
      adoptionRate,
      discountPercent,
      nextTierAt,
      maxDiscount: discountPercent >= 70,
    };
  }

  /**
   * Apply discount to a cost
   */
  async applyDiscount(
    orgId: string,
    baseCostCents: number
  ): Promise<{
    baseCostCents: number;
    discountPercent: number;
    discountCents: number;
    finalCostCents: number;
  }> {
    const { discountPercent } = await this.calculateDiscount(orgId);

    const discountCents = Math.round(baseCostCents * (discountPercent / 100));
    const finalCostCents = baseCostCents - discountCents;

    return {
      baseCostCents,
      discountPercent,
      discountCents,
      finalCostCents,
    };
  }

  /**
   * Get discount details for display
   */
  async getDiscountDetails(orgId: string) {
    const adoption = await this.calculateAdoptionRate(orgId);
    const discount = await this.calculateDiscount(orgId);

    // Calculate users needed for next tier
    const usersForNextTier = Math.ceil((discount.nextTierAt * adoption.totalUsers) / 100);
    const usersNeeded = usersForNextTier - adoption.aiActiveUsers;

    return {
      ...adoption,
      ...discount,
      usersNeeded: Math.max(0, usersNeeded),
      message: this.getDiscountMessage(discount.discountPercent, discount.maxDiscount, usersNeeded),
    };
  }

  /**
   * Get motivational message based on discount tier
   */
  private getDiscountMessage(discountPercent: number, maxDiscount: boolean, usersNeeded: number): string {
    if (maxDiscount) {
      return '🎉 Maximum discount achieved! Your team is fully engaged with AI features.';
    }

    if (discountPercent === 0) {
      return `Get ${usersNeeded} more team members using AI to unlock a 10% discount!`;
    }

    return `Great! You're saving ${discountPercent}%. Get ${usersNeeded} more users active to reach ${discountPercent + 10}% off!`;
  }

  /**
   * Get adoption leaderboard (provider view)
   */
  async getLeaderboard(limit: number = 10) {
    const orgs = await prisma.org.findMany({
      select: { id: true, name: true },
    });

    const leaderboard = [];

    for (const org of orgs) {
      const adoption = await this.calculateAdoptionRate(org.id);
      const discount = await this.calculateDiscount(org.id);

      leaderboard.push({
        orgId: org.id,
        orgName: org.name,
        ...adoption,
        ...discount,
      });
    }

    // Sort by adoption rate descending
    leaderboard.sort((a, b) => b.adoptionRate - a.adoptionRate);

    return leaderboard.slice(0, limit);
  }

  /**
   * Notify org when they reach a new discount tier
   */
  async checkAndNotifyTierChange(orgId: string, userId: string) {
    const discount = await this.calculateDiscount(orgId);

    // Check if this is a new tier (stored in org settings)
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { settings: true },
    });

    const settings = (org?.settings as any) || {};
    const lastDiscountTier = settings.lastDiscountTier || 0;

    if (discount.discountPercent > lastDiscountTier) {
      // New tier reached! Update and notify
      await prisma.org.update({
        where: { id: orgId },
        data: {
          settings: {
            ...settings,
            lastDiscountTier: discount.discountPercent,
          } as any,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          orgId,
          actorId: userId,
          action: 'adoption.tier_reached',
          entityType: 'org',
          entityId: orgId,
          delta: {
            oldTier: lastDiscountTier,
            newTier: discount.discountPercent,
            adoptionRate: discount.adoptionRate,
          },
        },
      });

      return {
        tierChanged: true,
        oldTier: lastDiscountTier,
        newTier: discount.discountPercent,
        message: `🎉 Congratulations! Your team reached ${discount.discountPercent}% discount!`,
      };
    }

    return { tierChanged: false };
  }

  /**
   * Get adoption trends over time
   */
  async getAdoptionTrends(orgId: string, months: number = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const totalUsers = await prisma.user.count({
        where: {
          orgId,
          createdAt: { lte: monthEnd },
        },
      });

      const aiUsers = await prisma.aiTask.groupBy({
        by: ['userId'],
        where: {
          orgId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const adoptionRate = totalUsers > 0 ? (aiUsers.length / totalUsers) * 100 : 0;
      const discountPercent = Math.min(Math.floor(adoptionRate / 10) * 10, 70);

      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM
        totalUsers,
        aiActiveUsers: aiUsers.length,
        adoptionRate: Math.round(adoptionRate * 100) / 100,
        discountPercent,
      });
    }

    return trends;
  }

  /**
   * Get non-adopters for targeted outreach
   */
  async getNonAdopters(orgId: string, limit: number = 50) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all users
    const allUsers = await prisma.user.findMany({
      where: { orgId },
      select: { id: true, email: true, name: true, role: true },
    });

    // Get AI active users
    const aiUsers = await prisma.aiTask.groupBy({
      by: ['userId'],
      where: {
        orgId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const aiUserIds = new Set(aiUsers.map((u) => u.userId));

    // Filter non-adopters
    const nonAdopters = allUsers
      .filter((u) => !aiUserIds.has(u.id))
      .slice(0, limit);

    return nonAdopters;
  }
}

export const adoptionDiscountService = new AdoptionDiscountService();

