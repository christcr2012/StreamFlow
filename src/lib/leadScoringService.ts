/**
 * 🎯 ENHANCED LEAD SCORING SERVICE
 * AI-powered lead classification with confidence metrics and automated routing
 */

import { aiService } from "./aiService";

export interface LeadData {
  title: string;
  description?: string;
  company?: string;
  location?: string;
  budget?: number;
  timeline?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    name?: string;
  };
  source?: string;
  industry?: string;
  projectSize?: string;
}

export interface LeadScore {
  score: number; // 0-100
  classification: 'HOT' | 'WARM' | 'COLD';
  confidence: number; // 0-1
  reasons: string[];
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedValue: string;
  recommendedAction: string;
  aiAnalysis?: {
    keyOpportunities: string[];
    potentialChallenges: string[];
    competitiveFactors: string[];
  };
}

export interface LeadScoringOptions {
  orgId: string;
  userId?: string;
  includeAI?: boolean;
}

class LeadScoringService {
  /**
   * Calculate base score using rule-based logic (fast, no AI cost)
   */
  private calculateBaseScore(lead: LeadData): {
    score: number;
    reasons: string[];
    urgency: LeadScore['urgency'];
  } {
    let score = 0;
    const reasons: string[] = [];

    // Budget indicators
    if (lead.budget) {
      if (lead.budget >= 50000) {
        score += 25;
        reasons.push('High budget project ($50K+)');
      } else if (lead.budget >= 10000) {
        score += 15;
        reasons.push('Medium budget project ($10K+)');
      } else if (lead.budget >= 5000) {
        score += 10;
        reasons.push('Qualified budget ($5K+)');
      }
    }

    // Timeline urgency
    if (lead.timeline) {
      const timeline = lead.timeline.toLowerCase();
      if (timeline.includes('immediate') || timeline.includes('asap') || timeline.includes('urgent')) {
        score += 20;
        reasons.push('Immediate timeline requirement');
      } else if (timeline.includes('week') || timeline.includes('month')) {
        score += 15;
        reasons.push('Near-term timeline');
      }
    }

    // Contact completeness
    if (lead.contactInfo?.email && lead.contactInfo?.phone) {
      score += 10;
      reasons.push('Complete contact information');
    } else if (lead.contactInfo?.email || lead.contactInfo?.phone) {
      score += 5;
      reasons.push('Partial contact information');
    }

    // Company/organization indicators
    if (lead.company) {
      if (lead.company.toLowerCase().includes('government') || 
          lead.company.toLowerCase().includes('federal') ||
          lead.company.toLowerCase().includes('state')) {
        score += 15;
        reasons.push('Government/institutional client');
      } else if (lead.company.toLowerCase().includes('corp') ||
                 lead.company.toLowerCase().includes('inc') ||
                 lead.company.toLowerCase().includes('llc')) {
        score += 10;
        reasons.push('Established business entity');
      }
    }

    // Location factors
    if (lead.location) {
      // Add location-specific scoring logic here
      score += 5;
      reasons.push('Location specified');
    }

    // Project size indicators
    if (lead.projectSize) {
      const size = lead.projectSize.toLowerCase();
      if (size.includes('large') || size.includes('enterprise')) {
        score += 15;
        reasons.push('Large-scale project');
      } else if (size.includes('medium') || size.includes('commercial')) {
        score += 10;
        reasons.push('Commercial-scale project');
      }
    }

    // Source quality
    if (lead.source) {
      const source = lead.source.toLowerCase();
      if (source.includes('referral') || source.includes('recommendation')) {
        score += 15;
        reasons.push('Referral source (high quality)');
      } else if (source.includes('rfp') || source.includes('bid')) {
        score += 20;
        reasons.push('RFP/Bid opportunity (active procurement)');
      } else if (source.includes('website') || source.includes('form')) {
        score += 8;
        reasons.push('Direct website inquiry');
      }
    }

    // Determine urgency
    let urgency: LeadScore['urgency'] = 'LOW';
    if (score >= 80) urgency = 'IMMEDIATE';
    else if (score >= 60) urgency = 'HIGH';
    else if (score >= 40) urgency = 'MEDIUM';

    return {
      score: Math.min(100, Math.max(0, score)),
      reasons,
      urgency
    };
  }

  /**
   * Generate AI-enhanced analysis (costs credits)
   */
  private async generateAIAnalysis(lead: LeadData, orgId: string, userId?: string): Promise<{
    aiScore: number;
    aiAnalysis: LeadScore['aiAnalysis'];
    confidence: number;
    estimatedValue: string;
    recommendedAction: string;
  }> {
    const prompt = `Analyze this business lead for a cleaning/janitorial service company:

LEAD DETAILS:
- Title: ${lead.title}
- Description: ${lead.description || 'Not provided'}
- Company: ${lead.company || 'Not provided'}
- Location: ${lead.location || 'Not provided'}
- Budget: ${lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified'}
- Timeline: ${lead.timeline || 'Not specified'}
- Industry: ${lead.industry || 'Not specified'}
- Project Size: ${lead.projectSize || 'Not specified'}
- Source: ${lead.source || 'Not specified'}

Provide a comprehensive analysis focusing on:
1. Lead quality and conversion probability
2. Key business opportunities and value drivers
3. Potential challenges or red flags
4. Competitive positioning factors
5. Recommended next steps

Respond with JSON in this exact format:
{
  "qualityScore": number (0-100),
  "confidence": number (0-1),
  "keyOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "potentialChallenges": ["challenge 1", "challenge 2"],
  "competitiveFactors": ["factor 1", "factor 2"],
  "estimatedValue": "value range with reasoning",
  "recommendedAction": "specific next step with timeline"
}`;

    const fallback = {
      aiScore: 50,
      aiAnalysis: {
        keyOpportunities: ['Standard cleaning opportunity'],
        potentialChallenges: ['Competition from established providers'],
        competitiveFactors: ['Price competitiveness required']
      },
      confidence: 0.5,
      estimatedValue: 'Unable to estimate - requires manual review',
      recommendedAction: 'Contact lead within 24 hours for qualification'
    };

    const result = await aiService.executeWithControls(
      {
        orgId,
        userId,
        feature: 'LEAD_ANALYSIS'
      },
      async () => {
        const openai = (aiService as any).openai;
        return await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 1000
        });
      },
      fallback
    );

    if (result.success && !result.fallback) {
      const analysis = result.result as any;
      return {
        aiScore: analysis.qualityScore || 50,
        aiAnalysis: {
          keyOpportunities: analysis.keyOpportunities || [],
          potentialChallenges: analysis.potentialChallenges || [],
          competitiveFactors: analysis.competitiveFactors || []
        },
        confidence: analysis.confidence || 0.5,
        estimatedValue: analysis.estimatedValue || 'Requires manual assessment',
        recommendedAction: analysis.recommendedAction || 'Follow up within 24 hours'
      };
    }

    return fallback;
  }

  /**
   * Score a lead with optional AI enhancement
   */
  async scoreLead(lead: LeadData, options: LeadScoringOptions): Promise<LeadScore> {
    // Calculate base score (always runs)
    const baseResult = this.calculateBaseScore(lead);
    
    let finalScore = baseResult.score;
    let confidence = 0.7; // Base confidence for rule-based scoring
    let aiAnalysis: LeadScore['aiAnalysis'] | undefined;
    let estimatedValue = 'Manual assessment required';
    let recommendedAction = 'Contact lead for qualification';

    // Add AI enhancement if requested and budget allows
    if (options.includeAI) {
      try {
        const aiResult = await this.generateAIAnalysis(lead, options.orgId, options.userId);
        
        // Blend AI score with base score (weighted average)
        finalScore = Math.round((baseResult.score * 0.4) + (aiResult.aiScore * 0.6));
        confidence = aiResult.confidence;
        aiAnalysis = aiResult.aiAnalysis;
        estimatedValue = aiResult.estimatedValue;
        recommendedAction = aiResult.recommendedAction;
      } catch (error) {
        console.warn('AI analysis failed, using base scoring:', error);
      }
    }

    // Determine classification
    let classification: LeadScore['classification'] = 'COLD';
    if (finalScore >= 75) classification = 'HOT';
    else if (finalScore >= 50) classification = 'WARM';

    return {
      score: finalScore,
      classification,
      confidence,
      reasons: baseResult.reasons,
      urgency: baseResult.urgency,
      estimatedValue,
      recommendedAction,
      aiAnalysis
    };
  }

  /**
   * Batch score multiple leads efficiently
   */
  async scoreLeads(leads: LeadData[], options: LeadScoringOptions): Promise<LeadScore[]> {
    const results: LeadScore[] = [];
    
    for (const lead of leads) {
      const score = await this.scoreLead(lead, options);
      results.push(score);
    }

    return results;
  }
}

// Export singleton instance
export const leadScoringService = new LeadScoringService();
