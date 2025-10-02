/**
 * 🎯 AI-POWERED LEAD SCORING API
 * Enhanced lead analysis with cost controls and intelligent classification
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { assertPermission, getOrgIdFromReq, getEmailFromReq, PERMS } from "@/lib/rbac";
import { withAudienceAndCostGuard, AUDIENCE, COST_GUARD } from "@/middleware/withCostGuard";
import { leadScoringService, LeadData } from "@/lib/leadScoringService";
import { aiService } from "@/lib/aiService";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication and authorization
    const orgId = await getOrgIdFromReq(req);
    const userEmail = getEmailFromReq(req);

    if (!orgId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await assertPermission(req, res, PERMS.LEAD_READ);

    const { 
      lead, 
      leads, 
      includeAI = false,
      batchMode = false 
    } = req.body;

    // Validate input
    if (!lead && !leads) {
      return res.status(400).json({ 
        error: 'Either "lead" or "leads" array must be provided' 
      });
    }

    if (batchMode && !leads) {
      return res.status(400).json({ 
        error: 'Batch mode requires "leads" array' 
      });
    }

    // Get AI usage stats for the organization
    const usageStats = await aiService.getUsageStats(orgId);

    // Check if AI is requested but budget is insufficient
    if (includeAI && usageStats.dailyRemaining < 2000) {
      return res.status(429).json({
        error: 'Insufficient AI budget for enhanced analysis',
        usageStats,
        suggestion: 'Try without AI enhancement or contact support for budget increase'
      });
    }

    const scoringOptions = {
      orgId,
      userId: userEmail || undefined,
      includeAI
    };

    let results;
    let totalCreditsUsed = 0;

    if (batchMode && leads) {
      // Batch processing
      const startTime = Date.now();
      results = await leadScoringService.scoreLeads(leads, scoringOptions);
      const processingTime = Date.now() - startTime;

      // Estimate credits used (rough calculation for batch)
      if (includeAI) {
        totalCreditsUsed = leads.length * 2000; // Approximate
      }

      return res.status(200).json({
        success: true,
        results,
        metadata: {
          totalLeads: leads.length,
          processingTimeMs: processingTime,
          aiEnhanced: includeAI,
          creditsUsed: totalCreditsUsed,
          usageStats: await aiService.getUsageStats(orgId)
        }
      });

    } else if (lead) {
      // Single lead processing
      const startTime = Date.now();
      const result = await leadScoringService.scoreLead(lead, scoringOptions);
      const processingTime = Date.now() - startTime;

      if (includeAI) {
        totalCreditsUsed = 2000; // Approximate
      }

      return res.status(200).json({
        success: true,
        result,
        metadata: {
          processingTimeMs: processingTime,
          aiEnhanced: includeAI,
          creditsUsed: totalCreditsUsed,
          usageStats: await aiService.getUsageStats(orgId)
        }
      });
    }

    return res.status(400).json({ 
      error: 'Invalid request format' 
    });

  } catch (error) {
    console.error('Lead scoring API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'Basic lead scoring available without AI enhancement'
    });
  }
}

// Export with cost guard protection
export default withAudienceAndCostGuard(AUDIENCE.CLIENT_ONLY, COST_GUARD.AI_LEAD_SCORING, handler);

/**
 * Example request bodies:
 * 
 * Single lead with AI:
 * {
 *   "lead": {
 *     "title": "Office cleaning services needed",
 *     "description": "Looking for daily cleaning for 50,000 sq ft office building",
 *     "company": "TechCorp Inc",
 *     "location": "Denver, CO",
 *     "budget": 25000,
 *     "timeline": "Start within 2 weeks",
 *     "contactInfo": {
 *       "email": "facilities@techcorp.com",
 *       "phone": "(555) 123-4567",
 *       "name": "John Smith"
 *     },
 *     "source": "website form",
 *     "industry": "technology",
 *     "projectSize": "large"
 *   },
 *   "includeAI": true
 * }
 * 
 * Batch processing:
 * {
 *   "leads": [
 *     { "title": "Lead 1", ... },
 *     { "title": "Lead 2", ... }
 *   ],
 *   "batchMode": true,
 *   "includeAI": false
 * }
 */
