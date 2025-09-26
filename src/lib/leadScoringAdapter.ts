import { scoreLead, type LeadLike, type ScoreResult } from "@/lib/leadScoring";
import { analyzeLead, type LeadAnalysis } from "@/lib/aiHelper";

/**
 * Normalizes whatever your scoreLead returns into:
 *   { score: number, details: unknown }
 * so callers don’t need to know exact types.
 */
// Enhanced lead scoring with AI analysis and intelligence
export async function scoreLeadNormalized(
  input: unknown, 
  includeAI: boolean = false  // Default to false to control costs
): Promise<{ score: number; details: unknown; aiAnalysis?: LeadAnalysis }> {
  try {
    // Cast the unknown input to LeadLike for scoreLead. scoreLead always returns
    // a ScoreResult, but we preserve the generic handling in case of future
    // changes (e.g. returning a number).
    const res: ScoreResult | number = await scoreLead(input as LeadLike);
    let baseResult: { score: number; details: unknown };
    
    if (typeof res === "number") {
      baseResult = { score: res, details: { score: res } };
    } else if (res && typeof res === "object") {
      const maybeScore = (res as ScoreResult).score;
      baseResult = { score: typeof maybeScore === "number" ? maybeScore : 0, details: res };
    } else {
      baseResult = { score: 0, details: {} };
    }
    
    // Add AI analysis for enhanced lead intelligence
    let aiAnalysis: LeadAnalysis | undefined;
    if (includeAI) {
      try {
        const normalized = (input ?? {}) as LeadLike;
        aiAnalysis = await analyzeLead({
          title: normalized.title || '',
          description: normalized.serviceDescription || '',
          location: [normalized.city, normalized.state].filter(Boolean).join(', '),
          sourceType: normalized.sourceType || '',
          agency: normalized.agency || '',
          requirements: normalized.psc || normalized.naics || ''
        });
        
        // Boost score based on AI quality assessment
        const aiBoost = Math.round((aiAnalysis.qualityScore - 50) * 0.2); // +/- 10 point adjustment
        baseResult.score = Math.max(1, Math.min(99, baseResult.score + aiBoost));
        
        // Enhance scoring reasons with AI insights
        if (baseResult.details && typeof baseResult.details === 'object' && 'reasons' in baseResult.details) {
          const reasons = baseResult.details.reasons as string[];
          if (aiAnalysis.qualityScore > 70) {
            reasons.push(`AI: High quality lead (${aiAnalysis.qualityScore}/100)`);
          }
          if (aiAnalysis.urgencyLevel === 'immediate') {
            reasons.push('AI: Immediate action recommended');
          }
        }
        
      } catch (error) {
        console.warn('AI analysis failed, using base scoring:', error);
        // Continue with base scoring if AI fails
      }
    }
    
    return { 
      score: baseResult.score, 
      details: baseResult.details,
      aiAnalysis 
    };
  } catch {
    return { score: 0, details: {}, aiAnalysis: undefined };
  }
}

