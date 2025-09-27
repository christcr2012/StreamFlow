import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { prisma as db } from '@/lib/prisma';

interface JWTPayload {
  userId: string;
  orgId: string;
  email: string;
  role: string;
}

interface NavItem {
  key: string;
  name: string;
  href: string;
  icon?: string;
  usageCount: number;
  lastUsed: Date;
  category: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const sessionCookie = req.cookies.ws_user;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify and decode the session
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      return res.status(500).json({ error: 'Session secret not configured' });
    }

    let payload: JWTPayload;
    try {
      payload = verify(sessionCookie, sessionSecret) as JWTPayload;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get usage data for the last 30 days to determine active features
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get feature usage patterns from events
    const usageData = await db.appEvent.groupBy({
      by: ['featureKey'],
      where: {
        orgId: payload.orgId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Map feature keys to navigation items
    const featureNavMapping: Record<string, { name: string; href: string; category: string }> = {
      'dashboard.home': { name: 'Dashboard', href: '/dashboard', category: 'core' },
      'dashboard.premium': { name: 'Premium Dashboard', href: '/dashboard/premium', category: 'analytics' },
      'leads.list': { name: 'Leads', href: '/leads', category: 'core' },
      'leads.create': { name: 'New Lead', href: '/leads/new', category: 'core' },
      'leads.convert': { name: 'Lead Conversion', href: '/leads/conversion', category: 'core' },
      'leads.ai-scoring': { name: 'AI Lead Scoring', href: '/leads/scoring', category: 'ai' },
      'scheduling.board': { name: 'Schedule Board', href: '/scheduling', category: 'operations' },
      'scheduling.auto-assign': { name: 'Auto-Assignment', href: '/scheduling/auto-assign', category: 'ai' },
      'billing.invoices': { name: 'Invoices', href: '/billing/invoices', category: 'finance' },
      'billing.auto-invoice': { name: 'Auto-Invoicing', href: '/billing/auto', category: 'automation' },
      'analytics.dashboard': { name: 'Analytics', href: '/analytics', category: 'analytics' },
      'analytics.predictive': { name: 'Predictive Analytics', href: '/analytics/predictive', category: 'ai' },
      'clients.list': { name: 'Clients', href: '/clients', category: 'core' },
      'clients.segments': { name: 'Client Segments', href: '/clients/segments', category: 'analytics' },
      'mobile.field-ops': { name: 'Field Operations', href: '/mobile/field-ops', category: 'mobile' },
      'mobile.offline-sync': { name: 'Mobile Sync', href: '/mobile/sync', category: 'mobile' },
      'integration.accounting': { name: 'Accounting Integration', href: '/integrations/accounting', category: 'integration' },
      'integration.payments': { name: 'Payment Processing', href: '/integrations/payments', category: 'integration' },
      'communication.sms': { name: 'SMS Notifications', href: '/communication/sms', category: 'communication' },
      'communication.email-campaigns': { name: 'Email Marketing', href: '/communication/email', category: 'marketing' },
      'advanced.api-access': { name: 'API Access', href: '/settings/api', category: 'developer' },
      'advanced.custom-fields': { name: 'Custom Fields', href: '/settings/custom-fields', category: 'customization' },
    };

    // Convert usage data to navigation items
    const activeNavItems: NavItem[] = usageData
      .filter(usage => featureNavMapping[usage.featureKey])
      .filter(usage => usage._count.id >= 5) // Minimum 5 interactions to be considered "active"
      .slice(0, 15) // Limit to top 15 most used features
      .map(usage => ({
        key: usage.featureKey,
        name: featureNavMapping[usage.featureKey].name,
        href: featureNavMapping[usage.featureKey].href,
        category: featureNavMapping[usage.featureKey].category,
        usageCount: usage._count.id,
        lastUsed: usage._max.createdAt || new Date(),
      }));

    res.status(200).json({
      success: true,
      items: activeNavItems,
      metadata: {
        totalFeatures: usageData.length,
        activeFeatures: activeNavItems.length,
        orgId: payload.orgId,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting active nav features:', error);
    res.status(500).json({ error: 'Failed to get active navigation features' });
  }
}