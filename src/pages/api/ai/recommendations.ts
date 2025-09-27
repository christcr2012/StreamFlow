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
    
    // Get query parameters
    const { limit = '10', category, priority } = req.query;
    
    // Generate recommendations
    let recommendations = await analyzer.generateRecommendations(payload.orgId);
    
    // Apply filters
    if (category) {
      recommendations = recommendations.filter(r => r.category === category);
    }
    
    if (priority) {
      recommendations = recommendations.filter(r => r.priority === priority);
    }
    
    // Apply limit
    const maxResults = Math.min(parseInt(limit as string, 10) || 10, 50);
    recommendations = recommendations.slice(0, maxResults);

    res.status(200).json({
      success: true,
      recommendations,
      metadata: {
        totalFound: recommendations.length,
        generatedAt: new Date().toISOString(),
        orgId: payload.orgId,
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}