// src/server/services/providerProfitabilityService.ts
// Provider-side profitability tracking and analytics
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';
import { aiTaskService } from './aiTaskService';

export { ServiceError };

// ===== PROVIDER PROFITABILITY SERVICE =====

export class ProviderProfitabilityService {
  /**
   * Calculate profitability for a tenant
   */
  async calculateProfitability(orgId: string, periodStart: Date, periodEnd: Date) {
    // Get credit purchases (revenue)
    const creditLedger = await prisma.creditLedger.findMany({
      where: {
        orgId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        type: 'purchase',
      },
    });

    const monthlyRevenueCents = creditLedger.reduce(
      (sum, entry) => sum + (entry.amountCents || 0),
      0
    );

    const creditsPurchased = creditLedger.reduce(
      (sum, entry) => sum + (entry.balanceAfter - entry.balanceBefore),
      0
    );

    // Get AI costs
    const aiTasks = await prisma.aiTask.findMany({
      where: {
        orgId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const aiCostCents = aiTasks.reduce(
      (sum, task) => sum + (task.rawCostCents || 0),
      0
    );

    // Get usage meters for infra costs
    const usageMeters = await prisma.usageMeter.findMany({
      where: {
        orgId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Estimate infra costs (simplified)
    const storageCostCents = usageMeters
      .filter((m) => m.meterType === 'storage_gb_month')
      .reduce((sum, m) => sum + m.value * 10, 0); // $0.10 per GB

    const egressCostCents = usageMeters
      .filter((m) => m.meterType === 'egress_gb')
      .reduce((sum, m) => sum + m.value * 5, 0); // $0.05 per GB

    const infraCostCents = storageCostCents + egressCostCents;

    // Calculate metrics
    const totalCostCents = aiCostCents + infraCostCents;
    const marginCents = monthlyRevenueCents - totalCostCents;
    const marginPercent = monthlyRevenueCents > 0
      ? (marginCents / monthlyRevenueCents) * 100
      : 0;

    // Get user adoption
    const totalUsers = await prisma.user.count({
      where: { orgId },
    });

    const aiUsers = await prisma.aiTask.groupBy({
      by: ['userId'],
      where: {
        orgId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const adoptionRate = totalUsers > 0
      ? (aiUsers.length / totalUsers) * 100
      : 0;

    const avgCreditsPerUser = totalUsers > 0
      ? creditsPurchased / totalUsers
      : 0;

    return {
      orgId,
      periodStart,
      periodEnd,
      monthlyRevenueCents,
      creditsPurchased,
      aiCostCents,
      infraCostCents,
      storageCostCents,
      totalCostCents,
      marginCents,
      marginPercent,
      adoptionRate,
      avgCreditsPerUser,
      totalUsers,
      aiUsers: aiUsers.length,
    };
  }

  /**
   * Generate AI recommendations for profitability
   */
  async generateRecommendations(orgId: string, profitability: any) {
    const recommendations: any[] = [];

    // Low margin recommendations
    if (profitability.marginPercent < 20) {
      recommendations.push({
        type: 'pricing',
        action: 'Increase credit pack prices by 10-15%',
        impact: `+${Math.round(profitability.monthlyRevenueCents * 0.1 / 100)} margin`,
        priority: 'high',
      });
    }

    // Low adoption recommendations
    if (profitability.adoptionRate < 30) {
      recommendations.push({
        type: 'adoption',
        action: 'Offer trial credits to non-AI users',
        impact: `Potential +${Math.round((100 - profitability.adoptionRate) / 10)}% adoption`,
        priority: 'medium',
      });
    }

    // High AI cost recommendations
    if (profitability.aiCostCents > profitability.monthlyRevenueCents * 0.7) {
      recommendations.push({
        type: 'cost',
        action: 'Migrate to cheaper AI provider or optimize prompts',
        impact: `-${Math.round(profitability.aiCostCents * 0.2 / 100)} AI costs`,
        priority: 'high',
      });
    }

    // Low usage recommendations
    if (profitability.avgCreditsPerUser < 100) {
      recommendations.push({
        type: 'engagement',
        action: 'Promote AI features via in-app notifications',
        impact: `Potential +${Math.round(profitability.totalUsers * 50)} credits/month`,
        priority: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Save profitability record
   */
  async saveProfitability(data: any) {
    const existing = await prisma.tenantProfitability.findFirst({
      where: {
        orgId: data.orgId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      },
    });

    if (existing) {
      return prisma.tenantProfitability.update({
        where: { id: existing.id },
        data: {
          monthlyRevenueCents: data.monthlyRevenueCents,
          creditsPurchased: data.creditsPurchased,
          aiCostCents: data.aiCostCents,
          infraCostCents: data.infraCostCents,
          storageCostCents: data.storageCostCents,
          marginPercent: data.marginPercent,
          adoptionRate: data.adoptionRate,
          avgCreditsPerUser: data.avgCreditsPerUser,
          aiRecommendations: data.aiRecommendations as any,
          lastAnalyzedAt: new Date(),
        },
      });
    }

    return prisma.tenantProfitability.create({
      data: {
        orgId: data.orgId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        monthlyRevenueCents: data.monthlyRevenueCents,
        creditsPurchased: data.creditsPurchased,
        aiCostCents: data.aiCostCents,
        infraCostCents: data.infraCostCents,
        storageCostCents: data.storageCostCents,
        marginPercent: data.marginPercent,
        adoptionRate: data.adoptionRate,
        avgCreditsPerUser: data.avgCreditsPerUser,
        aiRecommendations: data.aiRecommendations as any,
        lastAnalyzedAt: new Date(),
      },
    });
  }

  /**
   * Get profitability dashboard data
   */
  async getDashboard(orgId?: string) {
    const where = orgId ? { orgId } : {};

    const profitability = await prisma.tenantProfitability.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      take: 12, // Last 12 months
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate totals
    const totals = profitability.reduce(
      (acc, p) => ({
        revenue: acc.revenue + p.monthlyRevenueCents,
        aiCost: acc.aiCost + p.aiCostCents,
        infraCost: acc.infraCost + p.infraCostCents,
        margin: acc.margin + (p.monthlyRevenueCents - p.aiCostCents - p.infraCostCents),
      }),
      { revenue: 0, aiCost: 0, infraCost: 0, margin: 0 }
    );

    const avgMarginPercent = profitability.length > 0
      ? profitability.reduce((sum, p) => sum + p.marginPercent, 0) / profitability.length
      : 0;

    return {
      profitability,
      totals,
      avgMarginPercent,
      count: profitability.length,
    };
  }

  /**
   * Recompute profitability for all tenants (provider action)
   */
  async recomputeAll() {
    const orgs = await prisma.org.findMany({
      select: { id: true },
    });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const results = [];

    for (const org of orgs) {
      try {
        const profitability = await this.calculateProfitability(
          org.id,
          periodStart,
          periodEnd
        );

        const recommendations = await this.generateRecommendations(
          org.id,
          profitability
        );

        const saved = await this.saveProfitability({
          ...profitability,
          aiRecommendations: recommendations,
        });

        results.push({ orgId: org.id, success: true, data: saved });
      } catch (error) {
        results.push({ orgId: org.id, success: false, error: String(error) });
      }
    }

    return results;
  }
}

export const providerProfitabilityService = new ProviderProfitabilityService();

