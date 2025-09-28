/**
 * 🔗 FEDERATION SERVICE
 * Secure cross-client data access and analytics for provider system
 */

import crypto from 'crypto';
import { prisma } from './prisma';

interface FederationConfig {
  enabled: boolean;
  keys: Record<string, string>; // keyId -> secret
  clockSkewSec: number;
  useSha256: boolean;
}

interface FederatedRequest {
  orgId: string;
  endpoint: string;
  method: string;
  timestamp: number;
  keyId: string;
  signature: string;
  data?: any;
}

interface CrossClientAnalytics {
  totalOrganizations: number;
  totalUsers: number;
  totalLeads: number;
  totalRevenue: number;
  averageLeadsPerOrg: number;
  averageRevenuePerClient: number;
  topPerformingOrgs: Array<{
    orgId: string;
    orgName: string;
    leadCount: number;
    conversionRate: number;
    revenue: number;
  }>;
  industryBreakdown: Array<{
    industry: string;
    orgCount: number;
    leadCount: number;
    avgRevenue: number;
  }>;
  performanceMetrics: {
    avgResponseTime: number;
    systemUptime: number;
    aiUsageStats: {
      totalCreditsUsed: number;
      avgCreditsPerOrg: number;
      costSavings: number;
    };
  };
}

class FederationService {
  private config: FederationConfig;

  constructor() {
    this.config = {
      enabled: process.env.PROVIDER_FEDERATION_ENABLED === 'true',
      keys: this.parseKeys(process.env.PROVIDER_KEYS_JSON || '{}'),
      clockSkewSec: parseInt(process.env.PROVIDER_CLOCK_SKEW_SEC || '300'),
      useSha256: process.env.PROVIDER_FEDERATION_SIG_SHA256 === 'true'
    };
  }

  private parseKeys(keysJson: string): Record<string, string> {
    try {
      return JSON.parse(keysJson);
    } catch {
      return {};
    }
  }

  /**
   * Generate HMAC signature for federation request
   */
  private generateSignature(
    method: string,
    endpoint: string,
    timestamp: number,
    data: any,
    secret: string
  ): string {
    const payload = `${method}|${endpoint}|${timestamp}|${JSON.stringify(data || {})}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    
    return this.config.useSha256 ? `sha256:${signature}` : signature;
  }

  /**
   * Verify federation request signature
   */
  private verifySignature(request: FederatedRequest): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const { keyId, signature, method, endpoint, timestamp, data } = request;
    const secret = this.config.keys[keyId];
    
    if (!secret) {
      console.warn(`Federation: Unknown key ID: ${keyId}`);
      return false;
    }

    // Check timestamp to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    const requestTime = Math.floor(timestamp / 1000);
    
    if (Math.abs(now - requestTime) > this.config.clockSkewSec) {
      console.warn(`Federation: Request timestamp outside allowed skew: ${timestamp}`);
      return false;
    }

    // Verify signature
    const expectedSignature = this.generateSignature(method, endpoint, timestamp, data, secret);
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Create federation request with signature
   */
  createFederatedRequest(
    orgId: string,
    endpoint: string,
    method: string,
    data?: any,
    keyId: string = 'default'
  ): FederatedRequest | null {
    if (!this.config.enabled) {
      return null;
    }

    const secret = this.config.keys[keyId];
    if (!secret) {
      console.error(`Federation: No secret found for key ID: ${keyId}`);
      return null;
    }

    const timestamp = Date.now();
    const signature = this.generateSignature(method, endpoint, timestamp, data, secret);

    return {
      orgId,
      endpoint,
      method,
      timestamp,
      keyId,
      signature,
      data
    };
  }

  /**
   * Get cross-client analytics (provider-only access)
   */
  async getCrossClientAnalytics(): Promise<CrossClientAnalytics> {
    try {
      // Get basic organization stats
      const [orgStats, userStats, leadStats, aiUsageStats] = await Promise.all([
        prisma.org.aggregate({
          _count: { id: true }
        }),
        prisma.user.aggregate({
          _count: { id: true }
        }),
        prisma.lead.aggregate({
          _count: { id: true }
        }),
        prisma.aiUsageEvent.aggregate({
          _sum: { creditsUsed: true, costUsd: true }
        })
      ]);

      // Get top performing organizations
      const topOrgs = await prisma.org.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              leads: true,
              users: true
            }
          }
        },
        orderBy: {
          leads: {
            _count: 'desc'
          }
        },
        take: 10
      });

      // Calculate industry breakdown (mock data for now)
      const industryBreakdown = [
        { industry: 'Construction', orgCount: 5, leadCount: 1250, avgRevenue: 2500 },
        { industry: 'Cleaning Services', orgCount: 3, leadCount: 890, avgRevenue: 1800 },
        { industry: 'Home Services', orgCount: 4, leadCount: 670, avgRevenue: 1200 },
        { industry: 'Property Management', orgCount: 2, leadCount: 450, avgRevenue: 3200 }
      ];

      // Performance metrics
      const performanceMetrics = {
        avgResponseTime: 150, // ms
        systemUptime: 99.9, // %
        aiUsageStats: {
          totalCreditsUsed: aiUsageStats._sum.creditsUsed || 0,
          avgCreditsPerOrg: Math.round((aiUsageStats._sum.creditsUsed || 0) / (orgStats._count.id || 1)),
          costSavings: Math.round(Number(aiUsageStats._sum.costUsd || 0) * 15) // 15x savings vs GPT-4
        }
      };

      return {
        totalOrganizations: orgStats._count.id || 0,
        totalUsers: userStats._count.id || 0,
        totalLeads: leadStats._count.id || 0,
        totalRevenue: 0, // Would need billing integration
        averageLeadsPerOrg: Math.round((leadStats._count.id || 0) / (orgStats._count.id || 1)),
        averageRevenuePerClient: 2500, // Mock average revenue per client
        topPerformingOrgs: topOrgs.map(org => ({
          orgId: org.id,
          orgName: org.name,
          leadCount: org._count.leads,
          conversionRate: 0.15, // Mock conversion rate
          revenue: org._count.leads * 25 // Mock revenue calculation
        })),
        industryBreakdown,
        performanceMetrics
      };

    } catch (error) {
      console.error('Failed to get cross-client analytics:', error);
      throw new Error('Analytics generation failed');
    }
  }

  /**
   * Get organization performance comparison
   */
  async getOrgPerformanceComparison(orgId: string): Promise<{
    orgStats: any;
    industryAverage: any;
    ranking: number;
    recommendations: string[];
  }> {
    try {
      // Get specific org stats
      const orgStats = await prisma.org.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              leads: true,
              users: true
            }
          }
        }
      });

      if (!orgStats) {
        throw new Error('Organization not found');
      }

      // Mock industry averages and ranking
      const industryAverage = {
        leadsPerMonth: 85,
        conversionRate: 0.12,
        avgDealSize: 1500,
        userEngagement: 0.75
      };

      const ranking = Math.floor(Math.random() * 10) + 1; // Mock ranking

      const recommendations = [
        'Increase lead follow-up frequency to improve conversion rates',
        'Implement AI-powered lead scoring for better prioritization',
        'Consider expanding service offerings based on market demand',
        'Optimize pricing strategy based on competitive analysis'
      ];

      return {
        orgStats,
        industryAverage,
        ranking,
        recommendations
      };

    } catch (error) {
      console.error('Failed to get org performance comparison:', error);
      throw new Error('Performance comparison failed');
    }
  }

  /**
   * Validate federation access
   */
  validateFederationAccess(request: FederatedRequest): boolean {
    return this.verifySignature(request);
  }

  /**
   * Get federation status
   */
  getFederationStatus(): {
    enabled: boolean;
    keysConfigured: number;
    clockSkewSec: number;
    useSha256: boolean;
  } {
    return {
      enabled: this.config.enabled,
      keysConfigured: Object.keys(this.config.keys).length,
      clockSkewSec: this.config.clockSkewSec,
      useSha256: this.config.useSha256
    };
  }
}

// Export singleton instance
export const federationService = new FederationService();
export type { CrossClientAnalytics, FederatedRequest };
