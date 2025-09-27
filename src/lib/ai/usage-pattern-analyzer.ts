// AI-powered usage pattern analysis and feature recommendation engine

import { prisma as db } from '@/lib/prisma';
import { BusinessMetricsProvider, type BusinessMetrics } from './business-metrics-provider';

interface UsagePattern {
  featureKey: string;
  totalEvents: number;
  uniqueUsers: number;
  avgEventsPerUser: number;
  eventTypes: Record<string, number>;
  lastUsed: Date;
  firstUsed: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface FeatureRecommendation {
  featureId: string;
  featureKey: string;
  featureName: string;
  confidence: number; // 0-1 scale
  reason: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedBenefit: string;
  prerequisites: string[];
  metadata?: Record<string, any>;
}

// Using BusinessMetrics from the comprehensive provider
// OrganizationMetrics interface is now replaced by BusinessMetrics

export class UsagePatternAnalyzer {
  /**
   * Analyze usage patterns for an organization over the last 30 days
   */
  async analyzeUsagePatterns(orgId: string): Promise<UsagePattern[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get usage events for the org in the last 30 days
    const events = await db.appEvent.findMany({
      where: {
        orgId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        featureKey: true,
        eventType: true,
        userId: true,
        createdAt: true,
      },
    });

    // Group events by feature key
    const featureUsage = new Map<string, {
      events: typeof events,
      users: Set<string>,
      eventTypes: Map<string, number>,
      firstUsed: Date,
      lastUsed: Date,
    }>();

    for (const event of events) {
      if (!featureUsage.has(event.featureKey)) {
        featureUsage.set(event.featureKey, {
          events: [],
          users: new Set(),
          eventTypes: new Map(),
          firstUsed: event.createdAt,
          lastUsed: event.createdAt,
        });
      }

      const usage = featureUsage.get(event.featureKey)!;
      usage.events.push(event);
      if (event.userId) usage.users.add(event.userId);
      usage.eventTypes.set(event.eventType, (usage.eventTypes.get(event.eventType) || 0) + 1);
      
      if (event.createdAt < usage.firstUsed) usage.firstUsed = event.createdAt;
      if (event.createdAt > usage.lastUsed) usage.lastUsed = event.createdAt;
    }

    // Convert to usage patterns with trend analysis
    const patterns: UsagePattern[] = [];
    
    for (const [featureKey, usage] of featureUsage) {
      const trend = await this.calculateTrend(orgId, featureKey, thirtyDaysAgo);
      
      patterns.push({
        featureKey,
        totalEvents: usage.events.length,
        uniqueUsers: usage.users.size,
        avgEventsPerUser: usage.users.size > 0 ? usage.events.length / usage.users.size : 0,
        eventTypes: Object.fromEntries(usage.eventTypes),
        lastUsed: usage.lastUsed,
        firstUsed: usage.firstUsed,
        trend,
      });
    }

    return patterns.sort((a, b) => b.totalEvents - a.totalEvents);
  }

  /**
   * Calculate trending direction for a feature
   */
  private async calculateTrend(
    orgId: string, 
    featureKey: string, 
    since: Date
  ): Promise<'increasing' | 'stable' | 'decreasing'> {
    const midpoint = new Date((since.getTime() + Date.now()) / 2);

    // Count events in first half vs second half
    const [firstHalf, secondHalf] = await Promise.all([
      db.appEvent.count({
        where: {
          orgId,
          featureKey,
          createdAt: { gte: since, lt: midpoint },
        },
      }),
      db.appEvent.count({
        where: {
          orgId,
          featureKey,
          createdAt: { gte: midpoint, lte: new Date() },
        },
      }),
    ]);

    if (secondHalf > firstHalf * 1.2) return 'increasing';
    if (secondHalf < firstHalf * 0.8) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate feature recommendations based on usage patterns and org metrics
   */
  async generateRecommendations(orgId: string): Promise<FeatureRecommendation[]> {
    const metricsProvider = new BusinessMetricsProvider();
    
    // Gather org metrics with comprehensive business data
    const [usagePatterns, orgMetrics, features, enabledFeatures] = await Promise.all([
      this.analyzeUsagePatterns(orgId),
      metricsProvider.calculateMetrics(orgId),
      this.getAllFeatures(),
      this.getEnabledFeatures(orgId),
    ]);

    const enabledFeatureKeys = new Set(enabledFeatures.map(f => f.feature.key));
    const availableFeatures = features.filter(f => !enabledFeatureKeys.has(f.key));

    const recommendations: FeatureRecommendation[] = [];

    for (const feature of availableFeatures) {
      const recommendation = await this.evaluateFeatureRecommendation(
        feature,
        usagePatterns,
        orgMetrics
      );

      if (recommendation.confidence > 0.3) { // Only recommend if confidence > 30%
        recommendations.push(recommendation);
      }
    }

    // Sort by confidence and priority
    return recommendations
      .sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        return (priorityScore[b.priority] - priorityScore[a.priority]) || 
               (b.confidence - a.confidence);
      })
      .slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Evaluate a specific feature for recommendation
   */
  private async evaluateFeatureRecommendation(
    feature: any,
    usagePatterns: UsagePattern[],
    orgMetrics: BusinessMetrics
  ): Promise<FeatureRecommendation> {
    let confidence = 0;
    let reason = '';
    let priority: 'high' | 'medium' | 'low' = 'low';
    let estimatedBenefit = '';

    // Check if feature has specific recommendation conditions
    if (feature.recommendWhen && feature.recommendWhen.conditions) {
      const conditionResults = this.evaluateRecommendationConditions(
        feature.recommendWhen.conditions,
        orgMetrics,
        usagePatterns
      );
      
      if (conditionResults.matches > 0) {
        confidence += 0.4 * (conditionResults.matches / conditionResults.total);
        reason += conditionResults.reasons.join('; ');
      }
    }

    // Analyze usage patterns for related features
    if (feature.dependencies && feature.dependencies.length > 0) {
      const dependencyUsage = usagePatterns.filter(p => 
        feature.dependencies.includes(p.featureKey)
      );
      
      if (dependencyUsage.length > 0) {
        const avgUsage = dependencyUsage.reduce((sum, p) => sum + p.totalEvents, 0) / dependencyUsage.length;
        if (avgUsage > 10) {
          confidence += 0.3;
          reason += `Heavy usage of related features (${dependencyUsage.map(p => p.featureKey).join(', ')})`;
        }
      }
    }

    // Industry-specific recommendations
    if (orgMetrics.industryType) {
      const industryBonus = this.getIndustrySpecificBonus(feature.key, orgMetrics.industryType);
      confidence += industryBonus.confidence;
      if (industryBonus.reason) {
        reason += industryBonus.reason;
      }
    }

    // Account maturity factor
    if (orgMetrics.accountAge > 30) { // Account older than 30 days
      confidence += 0.1;
    }

    // Set priority based on confidence and feature category
    if (confidence > 0.7) priority = 'high';
    else if (confidence > 0.5) priority = 'medium';
    else priority = 'low';

    // Generate estimated benefit
    estimatedBenefit = this.generateBenefitEstimate(feature, orgMetrics);

    return {
      featureId: feature.id,
      featureKey: feature.key,
      featureName: feature.name,
      confidence: Math.min(confidence, 1.0), // Cap at 1.0
      reason: reason || 'Based on similar organization usage patterns',
      priority,
      category: feature.category,
      estimatedBenefit,
      prerequisites: feature.dependencies || [],
      metadata: {
        accountAge: orgMetrics.accountAge,
        industryType: orgMetrics.industryType,
        evaluationDate: new Date().toISOString(),
      },
    };
  }

  /**
   * Evaluate specific recommendation conditions with full business metrics support
   */
  private evaluateRecommendationConditions(
    conditions: any[],
    orgMetrics: BusinessMetrics,
    usagePatterns: UsagePattern[]
  ): { matches: number; total: number; reasons: string[] } {
    let matches = 0;
    const reasons: string[] = [];

    for (const condition of conditions) {
      let conditionMet = false;
      let reason = '';

      switch (condition.type) {
        // Lead & Conversion Metrics
        case 'lead_volume':
          conditionMet = this.evaluateNumericCondition(orgMetrics.leadCount, condition);
          reason = `Lead volume: ${orgMetrics.leadCount} ${condition.operator} ${condition.value}`;
          break;
        case 'conversion_rate':
          conditionMet = this.evaluateNumericCondition(orgMetrics.conversionRate, condition);
          reason = `Conversion rate: ${(orgMetrics.conversionRate * 100).toFixed(1)}% ${condition.operator} ${condition.value * 100}%`;
          break;
        
        // Job & Service Metrics
        case 'job_volume':
        case 'completed_jobs':
          conditionMet = this.evaluateNumericCondition(orgMetrics.completedJobs, condition);
          reason = `Completed jobs: ${orgMetrics.completedJobs} ${condition.operator} ${condition.value}`;
          break;
        case 'jobs_per_day':
          conditionMet = this.evaluateNumericCondition(orgMetrics.jobsPerDay, condition);
          reason = `Jobs per day: ${orgMetrics.jobsPerDay.toFixed(1)} ${condition.operator} ${condition.value}`;
          break;
        case 'jobs_per_week':
          conditionMet = this.evaluateNumericCondition(orgMetrics.jobsPerWeek, condition);
          reason = `Jobs per week: ${orgMetrics.jobsPerWeek} ${condition.operator} ${condition.value}`;
          break;
        
        // Team Metrics
        case 'employee_count':
          conditionMet = this.evaluateNumericCondition(orgMetrics.totalUsers, condition);
          reason = `Employee count: ${orgMetrics.totalUsers} ${condition.operator} ${condition.value}`;
          break;
        case 'technician_count':
          conditionMet = this.evaluateNumericCondition(orgMetrics.technicianCount, condition);
          reason = `Technician count: ${orgMetrics.technicianCount} ${condition.operator} ${condition.value}`;
          break;
        case 'field_technicians':
          conditionMet = this.evaluateNumericCondition(orgMetrics.fieldTechnicians, condition);
          reason = `Field technicians: ${orgMetrics.fieldTechnicians} ${condition.operator} ${condition.value}`;
          break;
        
        // Customer Metrics
        case 'client_count':
        case 'customer_count':
          conditionMet = this.evaluateNumericCondition(orgMetrics.clientCount, condition);
          reason = `Client count: ${orgMetrics.clientCount} ${condition.operator} ${condition.value}`;
          break;
        case 'no_show_rate':
          conditionMet = this.evaluateNumericCondition(orgMetrics.noShowRate, condition);
          reason = `No-show rate: ${(orgMetrics.noShowRate * 100).toFixed(1)}% ${condition.operator} ${condition.value * 100}%`;
          break;
        case 'repeat_rate':
          conditionMet = this.evaluateNumericCondition(orgMetrics.repeatRate, condition);
          reason = `Repeat rate: ${(orgMetrics.repeatRate * 100).toFixed(1)}% ${condition.operator} ${condition.value * 100}%`;
          break;
        
        // Financial Metrics
        case 'revenue_monthly':
          conditionMet = this.evaluateNumericCondition(orgMetrics.monthlyRevenue, condition);
          reason = `Monthly revenue: $${orgMetrics.monthlyRevenue.toLocaleString()} ${condition.operator} $${condition.value.toLocaleString()}`;
          break;
        case 'revenue_diversity':
          conditionMet = this.evaluateNumericCondition(orgMetrics.revenueDiversity, condition);
          reason = `Revenue diversity score: ${orgMetrics.revenueDiversity.toFixed(2)} ${condition.operator} ${condition.value}`;
          break;
        case 'monthly_invoices':
          conditionMet = this.evaluateNumericCondition(orgMetrics.monthlyInvoices, condition);
          reason = `Monthly invoices: ${orgMetrics.monthlyInvoices} ${condition.operator} ${condition.value}`;
          break;
        case 'manual_invoices':
          conditionMet = this.evaluateNumericCondition(orgMetrics.manualInvoices, condition);
          reason = `Manual invoices: ${orgMetrics.manualInvoices} ${condition.operator} ${condition.value}`;
          break;
        case 'payment_delays_days':
          conditionMet = this.evaluateNumericCondition(orgMetrics.paymentDelaysDays, condition);
          reason = `Payment delays: ${orgMetrics.paymentDelaysDays} days ${condition.operator} ${condition.value} days`;
          break;
        case 'cash_payments_percent':
          conditionMet = this.evaluateNumericCondition(orgMetrics.cashPaymentsPercent, condition);
          reason = `Cash payments: ${(orgMetrics.cashPaymentsPercent * 100).toFixed(1)}% ${condition.operator} ${condition.value * 100}%`;
          break;
        
        // Time & Data Metrics
        case 'data_history_months':
          conditionMet = this.evaluateNumericCondition(orgMetrics.dataHistoryMonths, condition);
          reason = `${orgMetrics.dataHistoryMonths} months of data history available`;
          break;
        
        // Boolean/Existence Conditions
        case 'accounting_software':
          conditionMet = this.evaluateExistenceCondition(orgMetrics.accountingSoftware, condition);
          reason = orgMetrics.accountingSoftware ? 'Uses accounting software' : 'No accounting software detected';
          break;
        case 'technical_team':
          conditionMet = this.evaluateExistenceCondition(orgMetrics.technicalTeam, condition);
          reason = orgMetrics.technicalTeam ? 'Has technical team' : 'No technical team detected';
          break;
        case 'custom_integrations':
          conditionMet = this.evaluateExistenceCondition(orgMetrics.customIntegrations, condition);
          reason = orgMetrics.customIntegrations ? 'Uses custom integrations' : 'No custom integrations';
          break;
        
        default:
          console.warn(`Unknown condition type: ${condition.type}`);
          continue;
      }

      if (conditionMet) {
        matches++;
        reasons.push(reason);
      }
    }

    return {
      matches,
      total: conditions.length,
      reasons: reasons.filter(r => r),
    };
  }

  /**
   * Evaluate existence-based conditions (exists, requested, etc.)
   */
  private evaluateExistenceCondition(value: boolean, condition: any): boolean {
    switch (condition.operator) {
      case 'exists': return value === condition.value;
      case 'requested': return value === true; // Treat as exists for now
      default: return false;
    }
  }

  /**
   * Evaluate numeric conditions (gte, lt, eq, etc.)
   */
  private evaluateNumericCondition(value: number, condition: any): boolean {
    switch (condition.operator) {
      case 'gte': return value >= condition.value;
      case 'gt': return value > condition.value;
      case 'lte': return value <= condition.value;
      case 'lt': return value < condition.value;
      case 'eq': return value === condition.value;
      default: return false;
    }
  }

  /**
   * Get industry-specific recommendation bonus
   */
  private getIndustrySpecificBonus(featureKey: string, industryType: string): {
    confidence: number;
    reason: string;
  } {
    const industryRecommendations: Record<string, Record<string, { confidence: number; reason: string }>> = {
      'cleaning': {
        'scheduling.board': { confidence: 0.3, reason: 'Essential for cleaning service coordination' },
        'mobile.field-ops': { confidence: 0.4, reason: 'Critical for on-site cleaning operations' },
        'communication.sms': { confidence: 0.2, reason: 'Customer notifications improve satisfaction' },
      },
      'hvac': {
        'scheduling.auto-assign': { confidence: 0.4, reason: 'HVAC jobs require skill-based matching' },
        'mobile.offline-sync': { confidence: 0.3, reason: 'Basement/attic work often has poor connectivity' },
        'integration.accounting': { confidence: 0.2, reason: 'Large HVAC jobs require detailed financial tracking' },
      },
      'fencing': {
        'analytics.predictive': { confidence: 0.2, reason: 'Seasonal fencing demand patterns' },
        'billing.auto-invoice': { confidence: 0.3, reason: 'Large fencing projects benefit from automated billing' },
        'clients.segments': { confidence: 0.2, reason: 'Residential vs commercial fencing clients' },
      },
    };

    return industryRecommendations[industryType]?.[featureKey] || { confidence: 0, reason: '' };
  }

  /**
   * Generate benefit estimate for a feature
   */
  private generateBenefitEstimate(feature: any, orgMetrics: BusinessMetrics): string {
    const benefits: Record<string, string> = {
      'leads.ai-scoring': `Could improve conversion rate by 15-25% (${Math.round(orgMetrics.leadCount * 0.2)} more conversions/month)`,
      'scheduling.auto-assign': `Save 2-3 hours/week on scheduling with ${orgMetrics.totalUsers} team members`,
      'billing.auto-invoice': `Reduce billing time by 70% and improve cash flow`,
      'analytics.predictive': `Identify 10-20% revenue growth opportunities`,
      'mobile.field-ops': `Increase field productivity by 15-30%`,
      'communication.sms': `Reduce no-shows by 20-35%`,
      'integration.accounting': `Save 4-6 hours/month on bookkeeping`,
      'clients.segments': `Increase repeat business by 15-25%`,
    };

    return benefits[feature.key] || 'Streamline operations and improve efficiency';
  }

  /**
   * Get all available features from registry
   */
  private async getAllFeatures() {
    return await db.featureRegistry.findMany({
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Get enabled features for an organization
   */
  private async getEnabledFeatures(orgId: string) {
    return await db.orgFeatureState.findMany({
      where: { orgId, enabled: true },
      include: { feature: true },
    });
  }

  // Note: getOrganizationMetrics is replaced by BusinessMetricsProvider.calculateMetrics
  // This method is no longer needed as we use the comprehensive metrics provider
}