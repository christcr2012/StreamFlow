// Comprehensive business metrics provider for intelligent AI recommendations

import { prisma as db } from '@/lib/prisma';

export interface BusinessMetrics {
  // Lead & Conversion Metrics
  leadCount: number;
  conversionRate: number;
  avgLeadsPerMonth: number;
  leadVelocity: number;

  // Job & Service Metrics
  jobCount: number;
  completedJobs: number;
  jobsPerDay: number;
  jobsPerWeek: number;
  avgJobValue: number;

  // Financial Metrics
  monthlyRevenue: number;
  totalRevenue: number;
  revenueGrowthRate: number;
  revenueDiversity: number;
  avgInvoiceValue: number;
  monthlyInvoices: number;
  manualInvoices: number;
  paymentDelaysDays: number;
  cashPaymentsPercent: number;

  // Customer Metrics
  clientCount: number;
  customerCount: number;
  repeatRate: number;
  noShowRate: number;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;

  // Team & Operations Metrics
  totalUsers: number;
  activeUsers: number;
  technicianCount: number;
  fieldTechnicians: number;
  employeeCount: number;

  // Usage & Engagement Metrics
  dataHistoryMonths: number;
  accountAge: number;
  dailyActiveUsers: number;
  featureAdoptionRate: number;

  // Technology & Integration Flags
  accountingSoftware: boolean;
  technicalTeam: boolean;
  customIntegrations: boolean;
  mobileAppUsage: boolean;

  // Industry-Specific Metrics
  industryType?: string;
  seasonalityFactor: number;
  serviceComplexity: 'low' | 'medium' | 'high';
}

export class BusinessMetricsProvider {
  /**
   * Calculate comprehensive business metrics for an organization
   */
  async calculateMetrics(orgId: string): Promise<BusinessMetrics> {
    // Run all metric calculations in parallel for performance
    const [
      org,
      leadMetrics,
      jobMetrics,
      financialMetrics,
      customerMetrics,
      teamMetrics,
      usageMetrics,
      integrationFlags,
    ] = await Promise.all([
      this.getOrgInfo(orgId),
      this.calculateLeadMetrics(orgId),
      this.calculateJobMetrics(orgId),
      this.calculateFinancialMetrics(orgId),
      this.calculateCustomerMetrics(orgId),
      this.calculateTeamMetrics(orgId),
      this.calculateUsageMetrics(orgId),
      this.calculateIntegrationFlags(orgId),
    ]);

    const accountAge = org ? Math.floor((Date.now() - org.createdAt.getTime()) / (24 * 60 * 60 * 1000)) : 0;
    const dataHistoryMonths = Math.floor(accountAge / 30);

    return {
      // Lead & Conversion Metrics
      leadCount: leadMetrics.count,
      conversionRate: leadMetrics.conversionRate,
      avgLeadsPerMonth: leadMetrics.avgPerMonth,
      leadVelocity: leadMetrics.velocity,

      // Job & Service Metrics
      jobCount: jobMetrics.count,
      completedJobs: jobMetrics.completed,
      jobsPerDay: jobMetrics.perDay,
      jobsPerWeek: jobMetrics.perWeek,
      avgJobValue: jobMetrics.avgValue,

      // Financial Metrics
      monthlyRevenue: financialMetrics.monthlyRevenue,
      totalRevenue: financialMetrics.totalRevenue,
      revenueGrowthRate: financialMetrics.growthRate,
      revenueDiversity: financialMetrics.diversity,
      avgInvoiceValue: financialMetrics.avgInvoiceValue,
      monthlyInvoices: financialMetrics.monthlyInvoices,
      manualInvoices: financialMetrics.manualInvoices,
      paymentDelaysDays: financialMetrics.avgPaymentDelays,
      cashPaymentsPercent: financialMetrics.cashPercent,

      // Customer Metrics
      clientCount: customerMetrics.count,
      customerCount: customerMetrics.count, // Same as clientCount
      repeatRate: customerMetrics.repeatRate,
      noShowRate: customerMetrics.noShowRate,
      customerLifetimeValue: customerMetrics.lifetimeValue,
      customerAcquisitionCost: customerMetrics.acquisitionCost,

      // Team & Operations Metrics
      totalUsers: teamMetrics.total,
      activeUsers: teamMetrics.active,
      technicianCount: teamMetrics.technicians,
      fieldTechnicians: teamMetrics.fieldTechnicians,
      employeeCount: teamMetrics.total,

      // Usage & Engagement Metrics
      dataHistoryMonths,
      accountAge,
      dailyActiveUsers: usageMetrics.dailyActive,
      featureAdoptionRate: usageMetrics.adoptionRate,

      // Technology & Integration Flags
      accountingSoftware: integrationFlags.accounting,
      technicalTeam: integrationFlags.technical,
      customIntegrations: integrationFlags.customIntegrations,
      mobileAppUsage: integrationFlags.mobileUsage,

      // Industry-Specific Metrics
      industryType: org?.industryType || undefined,
      seasonalityFactor: this.calculateSeasonalityFactor(org?.industryType),
      serviceComplexity: this.assessServiceComplexity(jobMetrics.avgValue, leadMetrics.conversionRate),
    };
  }

  private async getOrgInfo(orgId: string) {
    return await db.org.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        createdAt: true,
        industryType: true,
      },
    });
  }

  private async calculateLeadMetrics(orgId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [totalLeads, recentLeads, convertedLeads, recentConverted] = await Promise.all([
      db.lead.count({ where: { orgId } }),
      db.lead.count({ where: { orgId, createdAt: { gte: thirtyDaysAgo } } }),
      db.lead.count({ where: { orgId, status: 'CONVERTED' } }),
      db.lead.count({ where: { orgId, status: 'CONVERTED', createdAt: { gte: ninetyDaysAgo } } }),
    ]);

    const conversionRate = totalLeads > 0 ? convertedLeads / totalLeads : 0;
    const avgPerMonth = recentLeads; // Approximation for 30-day period
    const velocity = recentLeads - (recentLeads * 0.8); // Simple velocity calculation

    return {
      count: totalLeads,
      conversionRate,
      avgPerMonth,
      velocity,
    };
  }

  private async calculateJobMetrics(orgId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Note: Using available Invoice data as proxy for jobs since Job model might not exist yet
    const [totalInvoices, recentInvoices, weeklyInvoices] = await Promise.all([
      db.invoice.count({ where: { orgId } }),
      db.invoice.count({ where: { orgId, issuedAt: { gte: thirtyDaysAgo } } }),
      db.invoice.count({ where: { orgId, issuedAt: { gte: sevenDaysAgo } } }),
    ]);

    // Calculate average invoice value as proxy for job value
    const invoicesWithAmounts = await db.invoice.findMany({
      where: { orgId },
      select: { amount: true },
    });

    const avgValue = invoicesWithAmounts.length > 0 
      ? invoicesWithAmounts.reduce((sum, inv) => sum + Number(inv.amount), 0) / invoicesWithAmounts.length
      : 0;

    return {
      count: totalInvoices,
      completed: Math.floor(totalInvoices * 0.85), // Estimate 85% completion rate
      perDay: weeklyInvoices / 7,
      perWeek: weeklyInvoices,
      avgValue,
    };
  }

  private async calculateFinancialMetrics(orgId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [invoices, payments, recentInvoices, oldInvoices] = await Promise.all([
      db.invoice.findMany({
        where: { orgId },
        select: { amount: true, issuedAt: true, status: true },
      }),
      db.payment.findMany({
        where: { orgId },
        select: { amount: true, receivedAt: true, method: true },
      }),
      db.invoice.findMany({
        where: { orgId, issuedAt: { gte: thirtyDaysAgo } },
        select: { amount: true },
      }),
      db.invoice.findMany({
        where: { orgId, issuedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        select: { amount: true },
      }),
    ]);

    const monthlyRevenue = recentInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const previousMonthRevenue = oldInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const growthRate = previousMonthRevenue > 0 ? (monthlyRevenue - previousMonthRevenue) / previousMonthRevenue : 0;

    // Calculate revenue diversity (coefficient of variation)
    const monthlyRevenues = this.groupByMonth(invoices.map(inv => ({ 
      amount: Number(inv.amount), 
      createdAt: inv.issuedAt 
    })));
    const avgMonthly = monthlyRevenues.reduce((sum, rev) => sum + rev, 0) / monthlyRevenues.length;
    const variance = monthlyRevenues.reduce((sum, rev) => sum + Math.pow(rev - avgMonthly, 2), 0) / monthlyRevenues.length;
    const diversity = avgMonthly > 0 ? Math.sqrt(variance) / avgMonthly : 0;

    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const monthlyInvoices = recentInvoices.length;
    const manualInvoices = Math.floor(monthlyInvoices * 0.7); // Estimate 70% manual

    // Payment delay calculation
    const avgPaymentDelays = this.calculateAveragePaymentDelays(invoices, payments);
    
    // Cash payment percentage
    const cashPayments = payments.filter(p => p.method === 'cash' || p.method === 'check').length;
    const cashPercent = payments.length > 0 ? cashPayments / payments.length : 0;

    return {
      monthlyRevenue,
      totalRevenue,
      growthRate,
      diversity,
      avgInvoiceValue,
      monthlyInvoices,
      manualInvoices,
      avgPaymentDelays,
      cashPercent,
    };
  }

  private async calculateCustomerMetrics(orgId: string) {
    const [totalCustomers, customerWithInvoices] = await Promise.all([
      db.customer.count({ where: { orgId } }),
      // Get customer invoice counts via separate query since direct relation might not exist
      db.invoice.groupBy({
        by: ['customerId'],
        where: { orgId, customerId: { not: null } },
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    // Calculate repeat rate
    const customersWithMultipleInvoices = customerWithInvoices.filter(c => c._count.id > 1);
    const repeatRate = totalCustomers > 0 ? customersWithMultipleInvoices.length / totalCustomers : 0;

    // Estimate no-show rate (would need actual appointment data)
    const noShowRate = 0.1; // Conservative 10% estimate

    // Calculate customer lifetime value
    const totalCustomerRevenue = customerWithInvoices.reduce((sum, c) => 
      sum + (Number(c._sum.amount) || 0), 0);
    const lifetimeValue = totalCustomers > 0 ? totalCustomerRevenue / totalCustomers : 0;

    // Simple CAC estimation
    const acquisitionCost = 50; // Placeholder - would need marketing spend data

    return {
      count: totalCustomers,
      repeatRate,
      noShowRate,
      lifetimeValue,
      acquisitionCost,
    };
  }

  private async calculateTeamMetrics(orgId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUserIds] = await Promise.all([
      db.user.count({ where: { orgId } }),
      db.appEvent.groupBy({
        by: ['userId'],
        where: { 
          orgId,
          userId: { not: null },
          createdAt: { gte: sevenDaysAgo },
        },
      }).then(results => results.length),
    ]);

    // Estimate technician counts based on role or usage patterns
    const technicians = Math.floor(totalUsers * 0.6); // Estimate 60% are technicians
    const fieldTechnicians = Math.floor(technicians * 0.8); // Estimate 80% work in field

    return {
      total: totalUsers,
      active: activeUserIds,
      technicians,
      fieldTechnicians,
    };
  }

  private async calculateUsageMetrics(orgId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [dailyActive, totalFeatures, enabledFeatures] = await Promise.all([
      db.appEvent.groupBy({
        by: ['userId'],
        where: { 
          orgId,
          userId: { not: null },
          createdAt: { gte: oneDayAgo },
        },
      }).then(results => results.length),
      db.featureRegistry.count(),
      db.orgFeatureState.count({ where: { orgId, enabled: true } }),
    ]);

    const adoptionRate = totalFeatures > 0 ? enabledFeatures / totalFeatures : 0;

    return {
      dailyActive,
      adoptionRate,
    };
  }

  private async calculateIntegrationFlags(orgId: string) {
    // Check for integration usage patterns in events or settings
    const mobileEvents = await db.appEvent.count({
      where: {
        orgId,
        featureKey: { startsWith: 'mobile.' },
      },
    });

    return {
      accounting: false, // Would check for accounting integration events
      technical: false,  // Would check for API usage or custom field usage
      customIntegrations: false, // Would check for webhook or API events
      mobileUsage: mobileEvents > 0,
    };
  }

  private groupByMonth(invoices: { amount: number; createdAt: Date }[]): number[] {
    const monthlyMap = new Map<string, number>();
    
    for (const invoice of invoices) {
      const monthKey = `${invoice.createdAt.getFullYear()}-${invoice.createdAt.getMonth()}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + invoice.amount);
    }
    
    return Array.from(monthlyMap.values());
  }

  private calculateAveragePaymentDelays(
    invoices: { issuedAt: Date; status: string }[], 
    payments: { receivedAt: Date }[]
  ): number {
    // Simplified calculation - would need invoice-payment matching in real system
    return 25; // Placeholder: 25 days average
  }

  private calculateSeasonalityFactor(industryType?: string): number {
    const seasonalIndustries: Record<string, number> = {
      'landscaping': 0.8,
      'roofing': 0.7,
      'pool-service': 0.9,
      'hvac': 0.6,
      'cleaning': 0.3,
      'plumbing': 0.2,
    };

    return seasonalIndustries[industryType || ''] || 0.4;
  }

  private assessServiceComplexity(avgJobValue: number, conversionRate: number): 'low' | 'medium' | 'high' {
    if (avgJobValue > 5000 || conversionRate < 0.2) return 'high';
    if (avgJobValue > 1000 || conversionRate < 0.4) return 'medium';
    return 'low';
  }
}