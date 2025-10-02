// AI Pricing Intelligence API
// Smart pricing recommendations based on project details, market conditions, and competitive factors
import type { NextApiRequest, NextApiResponse } from "next";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { generatePricingAdvice } from "@/lib/aiHelper";
import { withAudienceAndCostGuard, AUDIENCE, COST_GUARD } from "@/middleware/withCostGuard";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check permissions and prevent abuse
    const orgId = await getOrgIdFromReq(req);
    await assertPermission(req, res, PERMS.LEAD_READ);
    
    const {
      serviceType = 'janitorial',
      squareFootage,
      frequency = 'daily',
      location = 'Northern Colorado',
      specialRequirements = '',
      timeline = 'standard',
      clientType = 'commercial',
      projectDuration,
      competitorCount = 'moderate'
    } = req.body;

    // Generate AI-powered pricing intelligence
    const pricingAdvice = await generatePricingAdvice({
      serviceType,
      squareFootage,
      frequency,
      location,
      specialRequirements,
      timeline,
      clientType
    });

    // Enhance with additional business intelligence
    const enhancedAnalysis = {
      pricingAdvice,
      marketIntelligence: generateMarketIntelligence(location, clientType, serviceType),
      competitiveStrategy: generateCompetitiveStrategy(squareFootage, location, competitorCount),
      riskAssessment: assessPricingRisks(pricingAdvice, specialRequirements, clientType),
      profitabilityAnalysis: analyzeProfitability(pricingAdvice.suggestedRange, squareFootage, frequency),
      recommendedPositioning: getPositioningStrategy(pricingAdvice, location, clientType)
    };

    res.status(200).json({
      success: true,
      analysis: enhancedAnalysis,
      projectDetails: {
        serviceType,
        squareFootage,
        frequency,
        location,
        clientType,
        specialRequirements
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pricing intelligence error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Pricing analysis failed'
    });
  }
}

// Generate market intelligence based on location and client type
function generateMarketIntelligence(location: string, clientType: string, serviceType: string) {
  const intel = {
    marketConditions: 'moderate',
    competitionLevel: 'medium',
    pricingTrends: 'stable',
    seasonalFactors: [] as string[],
    regionalAdvantages: [] as string[]
  };

  // Location-specific analysis
  if (location?.toLowerCase().includes('denver')) {
    intel.competitionLevel = 'high';
    intel.regionalAdvantages.push('Access to large commercial market', 'Higher budget tolerance');
  } else if (location?.toLowerCase().includes('greeley') || location?.toLowerCase().includes('sterling')) {
    intel.competitionLevel = 'low';
    intel.regionalAdvantages.push('Local market knowledge', 'Reduced travel costs', 'Community relationships');
  }

  // Client type analysis
  if (clientType === 'government') {
    intel.pricingTrends = 'competitive';
    intel.seasonalFactors.push('Budget cycles affect timing', 'Q4 spending rushes');
  } else if (clientType === 'healthcare') {
    intel.marketConditions = 'premium';
    intel.seasonalFactors.push('Infection control drives demand', 'Higher standards required');
  }

  return intel;
}

// Generate competitive positioning strategy
function generateCompetitiveStrategy(squareFootage: number, location: string, competitorCount: string) {
  const strategy = {
    positioningApproach: 'value-based',
    keyDifferentiators: [] as string[],
    pricingTactic: 'competitive',
    winProbability: 'medium'
  };

  // Size-based strategy
  if (squareFootage && squareFootage > 100000) {
    strategy.positioningApproach = 'capability-focused';
    strategy.keyDifferentiators.push('Large facility expertise', 'Operational efficiency at scale');
  } else if (squareFootage && squareFootage < 25000) {
    strategy.positioningApproach = 'service-focused';
    strategy.keyDifferentiators.push('Personal attention', 'Flexible scheduling');
  }

  // Location-based advantages
  if (location?.toLowerCase().includes('sterling') || location?.toLowerCase().includes('greeley')) {
    strategy.keyDifferentiators.push('Local presence reduces costs', 'Faster emergency response');
    strategy.winProbability = 'high';
  }

  // Competition-based tactics
  if (competitorCount === 'low') {
    strategy.pricingTactic = 'premium';
  } else if (competitorCount === 'high') {
    strategy.pricingTactic = 'aggressive';
  }

  return strategy;
}

// Assess pricing risks and mitigation strategies
function assessPricingRisks(pricingAdvice: any, specialRequirements: string, clientType: string) {
  const risks = [];

  if (pricingAdvice.suggestedRange.min < 0.08) {
    risks.push({
      risk: 'Low margin risk',
      impact: 'medium',
      mitigation: 'Emphasize value-added services to justify pricing'
    });
  }

  if (specialRequirements?.toLowerCase().includes('security')) {
    risks.push({
      risk: 'Security clearance costs',
      impact: 'high',
      mitigation: 'Build clearance costs into pricing, highlight as differentiator'
    });
  }

  if (clientType === 'government') {
    risks.push({
      risk: 'Payment delays',
      impact: 'medium',
      mitigation: 'Factor cash flow considerations into pricing and terms'
    });
  }

  return risks;
}

// Analyze profitability metrics
function analyzeProfitability(suggestedRange: any, squareFootage: number, frequency: string) {
  const avgPrice = (suggestedRange.min + suggestedRange.max) / 2;
  const sqft = squareFootage || 50000;
  
  let frequencyMultiplier = 1;
  if (frequency?.includes('daily')) frequencyMultiplier = 250; // work days per year
  else if (frequency?.includes('weekly')) frequencyMultiplier = 52;
  else if (frequency?.includes('monthly')) frequencyMultiplier = 12;

  const annualRevenue = avgPrice * sqft * frequencyMultiplier;
  const estimatedMargin = 0.15; // 15% typical margin

  return {
    projectedAnnualRevenue: Math.round(annualRevenue),
    estimatedGrossProfit: Math.round(annualRevenue * estimatedMargin),
    marginAnalysis: estimatedMargin,
    profitabilityRating: annualRevenue > 100000 ? 'high' : annualRevenue > 25000 ? 'medium' : 'low'
  };
}

// Get positioning strategy recommendations
function getPositioningStrategy(pricingAdvice: any, location: string, clientType: string) {
  const avgPrice = (pricingAdvice.suggestedRange.min + pricingAdvice.suggestedRange.max) / 2;
  
  let positioning = 'value';
  if (avgPrice > 0.12) positioning = 'premium';
  else if (avgPrice < 0.08) positioning = 'cost-leader';

  const strategies = {
    value: 'Position as best value with strong local presence and reliable service',
    premium: 'Emphasize quality, compliance, and specialized expertise',
    'cost-leader': 'Focus on efficiency and competitive pricing'
  };

  return {
    recommendedPositioning: positioning,
    strategy: strategies[positioning as keyof typeof strategies],
    keyMessages: generateKeyMessages(positioning, location, clientType)
  };
}

// Generate key positioning messages
function generateKeyMessages(positioning: string, location: string, clientType: string) {
  const baseMessages = {
    value: ['Reliable local service', 'Competitive pricing', 'Proven track record'],
    premium: ['Industry expertise', 'Compliance excellence', 'Superior quality'],
    'cost-leader': ['Most competitive rates', 'Efficient operations', 'No hidden fees']
  };

  let messages = baseMessages[positioning as keyof typeof baseMessages] || baseMessages.value;

  // Add location-specific messages
  if (location?.toLowerCase().includes('sterling') || location?.toLowerCase().includes('greeley')) {
    messages.push('Local Northern Colorado presence');
  }

  // Add client-specific messages
  if (clientType === 'government') {
    messages.push('Federal contracting experience');
  } else if (clientType === 'healthcare') {
    messages.push('Healthcare facility expertise');
  }

  return messages;
}

// Export with cost guard protection
export default withAudienceAndCostGuard(AUDIENCE.CLIENT_ONLY, COST_GUARD.AI_ESTIMATE_DRAFT, handler);