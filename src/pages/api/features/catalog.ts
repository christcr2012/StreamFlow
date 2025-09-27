import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { prisma as db } from '@/lib/prisma';

interface JWTPayload {
  userId: string;
  orgId: string;
  email: string;
  role: string;
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

    // Get query parameters
    const { category, enabled, search } = req.query;

    // Get all features from registry
    let whereClause: any = {};
    
    if (category) {
      whereClause.category = category;
    }

    const features = await db.featureRegistry.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get organization's feature states
    const orgFeatureStates = await db.orgFeatureState.findMany({
      where: { orgId: payload.orgId },
      include: { feature: true },
    });

    const enabledFeatureKeys = new Set(
      orgFeatureStates
        .filter(state => state.enabled)
        .map(state => state.feature.key)
    );

    // Create feature navigation mapping
    const featureHrefMapping: Record<string, string> = {
      'dashboard.home': '/dashboard',
      'dashboard.premium': '/dashboard/premium',
      'leads.list': '/leads',
      'leads.create': '/leads/new',
      'leads.convert': '/leads/conversion',
      'leads.ai-scoring': '/leads/scoring',
      'scheduling.board': '/scheduling',
      'scheduling.auto-assign': '/scheduling/auto-assign',
      'billing.invoices': '/billing/invoices',
      'billing.auto-invoice': '/billing/auto',
      'analytics.dashboard': '/analytics',
      'analytics.predictive': '/analytics/predictive',
      'clients.list': '/clients',
      'clients.segments': '/clients/segments',
      'mobile.field-ops': '/mobile/field-ops',
      'mobile.offline-sync': '/mobile/sync',
      'integration.accounting': '/integrations/accounting',
      'integration.payments': '/integrations/payments',
      'communication.sms': '/communication/sms',
      'communication.email-campaigns': '/communication/email',
      'advanced.api-access': '/settings/api',
      'advanced.custom-fields': '/settings/custom-fields',
    };

    // Transform features for API response
    let transformedFeatures = features.map(feature => ({
      id: feature.id,
      key: feature.key,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      enabled: enabledFeatureKeys.has(feature.key),
      defaultEnabled: feature.defaultEnabled,
      requiresPlan: feature.requiresPlan,
      dependencies: feature.dependencies,
      incompatible: feature.incompatible,
      discoverability: feature.discoverability,
      helpUrl: feature.helpUrl,
      href: featureHrefMapping[feature.key] || `/features/${feature.key}`,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
    }));

    // Apply filters
    if (enabled !== undefined) {
      const isEnabledFilter = enabled === 'true';
      transformedFeatures = transformedFeatures.filter(f => f.enabled === isEnabledFilter);
    }

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      transformedFeatures = transformedFeatures.filter(f =>
        f.name.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower) ||
        f.category.toLowerCase().includes(searchLower)
      );
    }

    // Calculate summary statistics
    const summary = {
      totalFeatures: features.length,
      enabledFeatures: transformedFeatures.filter(f => f.enabled).length,
      availableFeatures: transformedFeatures.filter(f => !f.enabled).length,
      categoryCounts: transformedFeatures.reduce((acc, feature) => {
        acc[feature.category] = (acc[feature.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.status(200).json({
      success: true,
      features: transformedFeatures,
      summary,
      metadata: {
        orgId: payload.orgId,
        totalResults: transformedFeatures.length,
        generatedAt: new Date().toISOString(),
        appliedFilters: {
          category: category || null,
          enabled: enabled || null,
          search: search || null,
        },
      },
    });
  } catch (error) {
    console.error('Error getting feature catalog:', error);
    res.status(500).json({ error: 'Failed to get feature catalog' });
  }
}