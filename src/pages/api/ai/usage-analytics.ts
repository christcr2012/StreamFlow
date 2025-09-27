import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { UsagePatternAnalyzer } from '@/lib/ai/usage-pattern-analyzer';

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

    const analyzer = new UsagePatternAnalyzer();
    
    // Get usage patterns
    const usagePatterns = await analyzer.analyzeUsagePatterns(payload.orgId);
    
    // Calculate summary statistics
    const summary = {
      totalFeatures: usagePatterns.length,
      totalEvents: usagePatterns.reduce((sum, p) => sum + p.totalEvents, 0),
      activeUsers: new Set(usagePatterns.flatMap(p => 
        // This would need to be calculated differently with actual user data
        Array.from({ length: p.uniqueUsers }, (_, i) => `user_${i}`)
      )).size,
      mostUsedFeatures: usagePatterns
        .slice(0, 5)
        .map(p => ({ featureKey: p.featureKey, events: p.totalEvents })),
      trendingFeatures: usagePatterns
        .filter(p => p.trend === 'increasing')
        .slice(0, 5)
        .map(p => ({ featureKey: p.featureKey, trend: p.trend })),
    };

    res.status(200).json({
      success: true,
      summary,
      usagePatterns,
      metadata: {
        analyzedPeriod: '30 days',
        generatedAt: new Date().toISOString(),
        orgId: payload.orgId,
      },
    });
  } catch (error) {
    console.error('Error getting usage analytics:', error);
    res.status(500).json({ error: 'Failed to get usage analytics' });
  }
}