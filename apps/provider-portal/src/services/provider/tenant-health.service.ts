/**
 * Tenant Health Monitoring Service
 * 
 * Calculates composite health scores based on:
 * - Active user count and growth rate
 * - Feature adoption percentage
 * - Payment status and billing health
 * - Support ticket volume and resolution time
 * - API usage patterns and trends
 */

import { prisma } from '@/lib/prisma';

export interface TenantHealthScore {
  tenantId: string;
  tenantName: string;
  overallScore: number; // 0-100
  healthGrade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  churnRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  lifecycleStage: 'Onboarding' | 'Active' | 'At-Risk' | 'Churned';
  
  // Component scores
  userEngagement: {
    score: number;
    activeUsers: number;
    totalUsers: number;
    growthRate: number; // percentage
    lastLoginDays: number;
  };
  
  featureAdoption: {
    score: number;
    featuresUsed: number;
    totalFeatures: number;
    adoptionRate: number; // percentage
  };
  
  billingHealth: {
    score: number;
    status: 'Current' | 'Overdue' | 'Failed' | 'Cancelled';
    daysPastDue: number;
    mrr: number; // Monthly Recurring Revenue in cents
  };
  
  supportMetrics: {
    score: number;
    openTickets: number;
    avgResolutionDays: number;
    satisfactionScore: number; // 0-5
  };
  
  apiUsage: {
    score: number;
    requestsLast30Days: number;
    errorRate: number; // percentage
    trend: 'Increasing' | 'Stable' | 'Decreasing';
  };
  
  lastUpdated: Date;
}

/**
 * Calculate user engagement score
 */
async function calculateUserEngagement(tenantId: string): Promise<TenantHealthScore['userEngagement']> {
  // Get all users for tenant
  const users = await prisma.user.findMany({
    where: { orgId: tenantId },
    select: {
      id: true,
      lastSuccessfulLogin: true,
      createdAt: true,
    },
  });

  const totalUsers = users.length;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Active users (logged in within 30 days)
  const activeUsers = users.filter(u => u.lastSuccessfulLogin && u.lastSuccessfulLogin > thirtyDaysAgo).length;

  // Growth rate (users created in last 30 days vs previous 30 days)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const recentUsers = users.filter(u => u.createdAt > thirtyDaysAgo).length;
  const previousUsers = users.filter(u => u.createdAt > sixtyDaysAgo && u.createdAt <= thirtyDaysAgo).length;
  const growthRate = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;

  // Last login (most recent)
  const lastLogins = users.map(u => u.lastSuccessfulLogin).filter(Boolean) as Date[];
  const mostRecentLogin = lastLogins.length > 0 ? Math.max(...lastLogins.map(d => d.getTime())) : 0;
  const lastLoginDays = mostRecentLogin > 0 ? Math.floor((now.getTime() - mostRecentLogin) / (1000 * 60 * 60 * 24)) : 999;
  
  // Calculate score (0-100)
  let score = 0;
  if (totalUsers > 0) {
    const activeRate = (activeUsers / totalUsers) * 100;
    score += activeRate * 0.5; // 50% weight on active user rate
    score += Math.min(growthRate, 50); // 50% weight on growth (capped at 50%)
    score -= Math.min(lastLoginDays, 30); // Penalty for inactivity
    score = Math.max(0, Math.min(100, score));
  }
  
  return {
    score,
    activeUsers,
    totalUsers,
    growthRate,
    lastLoginDays,
  };
}

/**
 * Calculate feature adoption score
 */
async function calculateFeatureAdoption(tenantId: string): Promise<TenantHealthScore['featureAdoption']> {
  // Define core features to track
  const coreFeatures = [
    'leads',
    'contacts',
    'invoices',
    'analytics',
    'federation',
    'monetization',
    'audit_log',
    'notifications',
  ];
  
  // Check which features have been used (simplified - in production, track actual usage)
  // For now, we'll use a heuristic based on data existence
  let featuresUsed = 0;
  
  // Check leads
  const leadsCount = await prisma.lead.count({ where: { orgId: tenantId } });
  if (leadsCount > 0) featuresUsed++;
  
  // Check invoices (using Customer as proxy)
  const customersCount = await prisma.customer.count({ where: { orgId: tenantId } });
  if (customersCount > 0) featuresUsed++;
  
  // Check users (if > 1, they're using user management)
  const usersCount = await prisma.user.count({ where: { orgId: tenantId } });
  if (usersCount > 1) featuresUsed++;
  
  // Add more feature checks as needed
  // For now, estimate based on data activity
  featuresUsed += Math.min(3, Math.floor(Math.random() * 4)); // Placeholder
  
  const totalFeatures = coreFeatures.length;
  const adoptionRate = (featuresUsed / totalFeatures) * 100;
  
  // Score: higher adoption = higher score
  const score = adoptionRate;
  
  return {
    score,
    featuresUsed,
    totalFeatures,
    adoptionRate,
  };
}

/**
 * Calculate billing health score
 */
async function calculateBillingHealth(tenantId: string): Promise<TenantHealthScore['billingHealth']> {
  // In production, check actual billing records
  // For now, use placeholder logic

  type BillingStatus = 'Current' | 'Overdue' | 'Failed' | 'Cancelled';
  const status: BillingStatus = 'Current';
  const daysPastDue = 0;
  const mrr = 9900; // $99.00 in cents

  // Score: Current = 100, Overdue = 50, Failed = 25, Cancelled = 0
  let score = 100;
  if (status === 'Overdue' as BillingStatus) score = 50;
  if (status === 'Failed' as BillingStatus) score = 25;
  if (status === 'Cancelled' as BillingStatus) score = 0;

  return {
    score,
    status,
    daysPastDue,
    mrr,
  };
}

/**
 * Calculate support metrics score
 */
async function calculateSupportMetrics(tenantId: string): Promise<TenantHealthScore['supportMetrics']> {
  // Check incidents as proxy for support tickets
  const incidents = await prisma.incident.findMany({
    where: { orgId: tenantId },
    select: {
      status: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  const openTickets = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  
  // Calculate average resolution time
  const resolvedIncidents = incidents.filter(i => i.resolvedAt);
  const avgResolutionMs = resolvedIncidents.length > 0
    ? resolvedIncidents.reduce((sum: any, i: any) => sum + (i.resolvedAt!.getTime() - i.createdAt.getTime()), 0) / resolvedIncidents.length
    : 0;
  const avgResolutionDays = avgResolutionMs / (1000 * 60 * 60 * 24);
  
  // Satisfaction score (placeholder - in production, track actual CSAT)
  const satisfactionScore = 4.2;
  
  // Score: fewer open tickets + faster resolution + higher satisfaction = higher score
  let score = 100;
  score -= Math.min(openTickets * 10, 50); // Penalty for open tickets
  score -= Math.min(avgResolutionDays * 5, 30); // Penalty for slow resolution
  score += (satisfactionScore - 3) * 10; // Bonus for high satisfaction
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    openTickets,
    avgResolutionDays,
    satisfactionScore,
  };
}

/**
 * Calculate API usage score
 */
async function calculateApiUsage(tenantId: string): Promise<TenantHealthScore['apiUsage']> {
  // In production, query actual API logs
  // For now, use placeholder data
  
  const requestsLast30Days = Math.floor(Math.random() * 10000) + 1000;
  const errorRate = Math.random() * 5; // 0-5%
  const trend: 'Increasing' | 'Stable' | 'Decreasing' = 'Stable';
  
  // Score: more requests + low error rate = higher score
  let score = 50;
  score += Math.min(requestsLast30Days / 100, 40); // Bonus for usage
  score -= errorRate * 2; // Penalty for errors
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    requestsLast30Days,
    errorRate,
    trend,
  };
}

/**
 * Calculate overall tenant health score
 */
export async function calculateTenantHealth(tenantId: string, tenantName: string): Promise<TenantHealthScore> {
  const [userEngagement, featureAdoption, billingHealth, supportMetrics, apiUsage] = await Promise.all([
    calculateUserEngagement(tenantId),
    calculateFeatureAdoption(tenantId),
    calculateBillingHealth(tenantId),
    calculateSupportMetrics(tenantId),
    calculateApiUsage(tenantId),
  ]);
  
  // Weighted overall score
  const overallScore = Math.round(
    userEngagement.score * 0.25 +
    featureAdoption.score * 0.20 +
    billingHealth.score * 0.25 +
    supportMetrics.score * 0.15 +
    apiUsage.score * 0.15
  );
  
  // Determine health grade
  let healthGrade: TenantHealthScore['healthGrade'];
  if (overallScore >= 80) healthGrade = 'Excellent';
  else if (overallScore >= 60) healthGrade = 'Good';
  else if (overallScore >= 40) healthGrade = 'Fair';
  else if (overallScore >= 20) healthGrade = 'Poor';
  else healthGrade = 'Critical';
  
  // Determine churn risk
  let churnRisk: TenantHealthScore['churnRisk'];
  if (overallScore >= 70) churnRisk = 'Low';
  else if (overallScore >= 50) churnRisk = 'Medium';
  else if (overallScore >= 30) churnRisk = 'High';
  else churnRisk = 'Critical';
  
  // Determine lifecycle stage
  let lifecycleStage: TenantHealthScore['lifecycleStage'];
  const daysSinceCreation = userEngagement.totalUsers > 0 ? 30 : 0; // Simplified
  if (daysSinceCreation < 30) lifecycleStage = 'Onboarding';
  else if (overallScore >= 50) lifecycleStage = 'Active';
  else if (overallScore >= 20) lifecycleStage = 'At-Risk';
  else lifecycleStage = 'Churned';
  
  return {
    tenantId,
    tenantName,
    overallScore,
    healthGrade,
    churnRisk,
    lifecycleStage,
    userEngagement,
    featureAdoption,
    billingHealth,
    supportMetrics,
    apiUsage,
    lastUpdated: new Date(),
  };
}

/**
 * Get health scores for all tenants
 */
export async function getAllTenantHealthScores(): Promise<TenantHealthScore[]> {
  const orgs = await prisma.customer.findMany({
    select: {
      id: true,
      company: true,
    },
  });
  
  const scores = await Promise.all(
    orgs.map(org => calculateTenantHealth(org.id, org.company || 'Unknown'))
  );
  
  return scores.sort((a, b) => a.overallScore - b.overallScore); // Sort by score (worst first)
}

