// AI Helper Functions with Integrated Cost Control
// Wraps existing AI functions with metering, budget enforcement, and fallbacks

import { aiMeter, checkAiBudget, AiMeterOptions } from './aiMeter';
import { 
  analyzeLead, 
  analyzeRFP, 
  generatePricingAdvice,
  LeadAnalysis,
  RFPStrategy,
  PricingAdvice
} from './aiHelper';

/**
 * Metered Lead Analysis with Budget Control
 * Provides high-quality lead analysis when within budget, basic scoring fallback when exhausted
 */
export async function meteredAnalyzeLead(
  leadData: Parameters<typeof analyzeLead>[0],
  orgId: string,
  userId?: string
): Promise<{ 
  analysis?: LeadAnalysis; 
  fallback?: { qualityScore: number; recommendedAction: string };
  success: boolean;
  reason?: string;
  creditsUsed: number;
}> {
  
  // Basic scoring fallback for when AI budget is exhausted
  const fallbackAnalysis = {
    qualityScore: calculateBasicScore(leadData),
    recommendedAction: getBasicAction(leadData)
  };

  const result = await aiMeter(
    {
      feature: 'lead_analysis',
      orgId,
      userId,
      maxCredits: 2000, // ~$2 worth of credits
      fallbackValue: fallbackAnalysis
    },
    async () => {
      const analysis = await analyzeLead(leadData);
      // Note: Real usage data should come from OpenAI response
      // This is a temporary implementation until aiHelper.ts is updated to return usage
      return { 
        result: analysis,
        usage: { prompt_tokens: 500, completion_tokens: 300, total_tokens: 800 }
      };
    }
  );

  return {
    analysis: result.result,
    fallback: result.fallback,
    success: result.success,
    reason: result.reason,
    creditsUsed: result.creditsUsed
  };
}

/**
 * Metered RFP Strategy Analysis with Budget Control
 */
export async function meteredAnalyzeRFP(
  rfpData: Parameters<typeof analyzeRFP>[0],
  orgId: string,
  userId?: string
): Promise<{
  strategy?: RFPStrategy;
  fallback?: { competitiveLandscape: string; pricingStrategy: string };
  success: boolean;
  reason?: string;
  creditsUsed: number;
}> {

  const fallbackStrategy = {
    competitiveLandscape: "Market analysis temporarily unavailable - check back later",
    pricingStrategy: "Standard competitive pricing recommended - review market rates manually"
  };

  const result = await aiMeter(
    {
      feature: 'rfp_strategy',
      orgId,
      userId,
      maxCredits: 3000, // ~$3 worth for complex analysis
      fallbackValue: fallbackStrategy
    },
    async () => {
      const strategy = await analyzeRFP(rfpData);
      // Note: Real usage data should come from OpenAI response
      return {
        result: strategy,
        usage: { prompt_tokens: 800, completion_tokens: 600, total_tokens: 1400 }
      };
    }
  );

  return {
    strategy: result.result,
    fallback: result.fallback,
    success: result.success,
    reason: result.reason,
    creditsUsed: result.creditsUsed
  };
}

/**
 * Metered Pricing Intelligence with Budget Control
 */
export async function meteredGeneratePricingAdvice(
  pricingData: Parameters<typeof generatePricingAdvice>[0],
  orgId: string,
  userId?: string
): Promise<{
  advice?: PricingAdvice;
  fallback?: { suggestedRange: { min: number; max: number }; priceJustification: string };
  success: boolean;
  reason?: string;
  creditsUsed: number;
}> {

  const fallbackAdvice = {
    suggestedRange: { 
      min: Math.max(0.08, (pricingData.squareFootage || 1000) * 0.00008), 
      max: Math.max(0.15, (pricingData.squareFootage || 1000) * 0.00015)
    },
    priceJustification: "Market rate pricing based on square footage - AI analysis temporarily unavailable"
  };

  const result = await aiMeter(
    {
      feature: 'pricing',
      orgId,
      userId,
      maxCredits: 2500,
      fallbackValue: fallbackAdvice
    },
    async () => {
      const advice = await generatePricingAdvice(pricingData);
      // Note: Real usage data should come from OpenAI response
      return {
        result: advice,
        usage: { prompt_tokens: 600, completion_tokens: 400, total_tokens: 1000 }
      };
    }
  );

  return {
    advice: result.result,
    fallback: result.fallback,
    success: result.success,
    reason: result.reason,
    creditsUsed: result.creditsUsed
  };
}

// Basic scoring fallbacks when AI is unavailable
function calculateBasicScore(leadData: any): number {
  let score = 50; // Base score
  
  // Source type bonuses
  if (leadData.sourceType === 'RFP') score += 20;
  if (leadData.sourceType === 'HOT') score += 15;
  
  // Value bonuses
  if (leadData.estimatedValue) {
    if (leadData.estimatedValue > 100000) score += 20;
    else if (leadData.estimatedValue > 50000) score += 10;
    else if (leadData.estimatedValue > 10000) score += 5;
  }
  
  // Location bonuses for Northern Colorado
  const location = leadData.location?.toLowerCase() || '';
  if (location.includes('colorado') || location.includes('denver') || 
      location.includes('fort collins') || location.includes('greeley')) {
    score += 10;
  }
  
  // Agency bonuses
  if (leadData.agency?.toLowerCase().includes('federal') || 
      leadData.agency?.toLowerCase().includes('government')) {
    score += 15;
  }
  
  return Math.min(100, Math.max(1, score));
}

function getBasicAction(leadData: any): string {
  const score = calculateBasicScore(leadData);
  
  if (score >= 80) {
    return "HIGH PRIORITY: Contact immediately - strong lead indicators present";
  } else if (score >= 60) {
    return "MEDIUM PRIORITY: Follow up within 24 hours - good potential";
  } else {
    return "LOW PRIORITY: Review and qualify - basic opportunity";
  }
}

/**
 * Check AI budget status for an organization
 * Used by dashboard and UI components to show usage status
 */
export { checkAiBudget, getAiUsage } from './aiMeter';