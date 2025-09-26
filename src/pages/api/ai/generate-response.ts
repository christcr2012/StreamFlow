// AI Response Generation API
// Creates tailored email responses for different lead types and scenarios
import type { NextApiRequest, NextApiResponse } from "next";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { 
  generateRFPResponse, 
  generateConstructionResponse, 
  generateFollowUpResponse,
  type ResponseContext 
} from "@/lib/aiResponseTemplates";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check permissions and prevent abuse
    const orgId = await getOrgIdFromReq(req);
    await assertPermission(req, res, PERMS.LEAD_READ);
    
    const { 
      responseType = 'rfp',
      leadData,
      customContext = {}
    } = req.body;

    if (!leadData && !customContext.leadType) {
      return res.status(400).json({ error: 'Lead data or context required' });
    }

    // Build context from lead data or custom input
    const context: ResponseContext = {
      leadType: leadData?.leadType || customContext.leadType || 'warm',
      sourceType: leadData?.sourceType || customContext.sourceType || '',
      leadTitle: leadData?.title || customContext.leadTitle,
      companyName: leadData?.company || customContext.companyName,
      contactName: customContext.contactName,
      location: [leadData?.city, leadData?.state].filter(Boolean).join(', ') || customContext.location,
      projectDetails: leadData?.serviceDescription || customContext.projectDetails,
      estimatedValue: customContext.estimatedValue,
      urgencyLevel: customContext.urgencyLevel,
      specialRequirements: customContext.specialRequirements,
      ...customContext
    };

    let responseTemplate;

    // Generate appropriate response based on type
    switch (responseType) {
      case 'rfp':
        responseTemplate = await generateRFPResponse(context);
        break;
      case 'construction':
        responseTemplate = await generateConstructionResponse(context);
        break;
      case 'followup':
        responseTemplate = await generateFollowUpResponse(context);
        break;
      default:
        // Auto-detect based on lead characteristics
        if (context.sourceType === 'RFP' || context.leadType === 'hot') {
          responseTemplate = await generateRFPResponse(context);
        } else if (context.sourceType === 'SYSTEM' || context.leadTitle?.toLowerCase().includes('construction')) {
          responseTemplate = await generateConstructionResponse(context);
        } else {
          responseTemplate = await generateFollowUpResponse(context);
        }
    }

    // Enhance response with additional business intelligence
    const enhancedResponse = {
      responseTemplate,
      responseMetadata: {
        generatedFor: context.leadTitle || 'Lead opportunity',
        targetAudience: context.companyName || 'Prospect',
        responseType,
        leadType: context.leadType,
        estimatedReadTime: calculateReadTime(responseTemplate),
        suggestedSendTime: getSuggestedSendTime(context),
        keyPersonalizationPoints: extractPersonalizationPoints(context)
      },
      businessContext: {
        strategicValue: assessStrategicValue(context),
        competitivePriority: getCompetitivePriority(context),
        relationshipStage: determineRelationshipStage(context),
        nextStepRecommendations: getNextStepRecommendations(context, responseType)
      }
    };

    res.status(200).json({
      success: true,
      response: enhancedResponse,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Response generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Response generation failed'
    });
  }
}

// Calculate estimated reading time
function calculateReadTime(template: any): string {
  const totalWords = [
    template.greeting,
    template.mainContent,
    template.callToAction,
    template.closing
  ].join(' ').split(' ').length;

  const readingTimeMinutes = Math.ceil(totalWords / 200); // Average reading speed
  return `${readingTimeMinutes} minute${readingTimeMinutes > 1 ? 's' : ''}`;
}

// Suggest optimal send time based on lead characteristics
function getSuggestedSendTime(context: ResponseContext): string {
  if (context.leadType === 'hot' || context.sourceType === 'RFP') {
    return 'Send immediately (within 2 hours)';
  } else if (context.leadType === 'warm') {
    return 'Send within 24 hours during business hours';
  } else {
    return 'Send during optimal engagement times (Tuesday-Thursday, 10-11 AM)';
  }
}

// Extract key personalization points
function extractPersonalizationPoints(context: ResponseContext): string[] {
  const points = [];
  
  if (context.location) points.push(`Local to ${context.location}`);
  if (context.companyName) points.push(`Company: ${context.companyName}`);
  if (context.contactName) points.push(`Contact: ${context.contactName}`);
  if (context.projectDetails) points.push('Project-specific details included');
  if (context.specialRequirements) points.push('Special requirements addressed');
  
  return points;
}

// Assess strategic value of the opportunity
function assessStrategicValue(context: ResponseContext): string {
  if (context.estimatedValue && context.estimatedValue > 500000) return 'High';
  if (context.leadType === 'hot') return 'High';
  if (context.location?.toLowerCase().includes('denver') && context.estimatedValue && context.estimatedValue > 100000) return 'High';
  if (context.location?.toLowerCase().includes('greeley') || context.location?.toLowerCase().includes('sterling')) return 'Medium-High';
  return 'Medium';
}

// Determine competitive priority level
function getCompetitivePriority(context: ResponseContext): string {
  if (context.leadType === 'hot' && context.sourceType === 'RFP') return 'Urgent';
  if (context.urgencyLevel === 'immediate') return 'Urgent';
  if (context.leadType === 'hot') return 'High';
  if (context.leadType === 'warm') return 'Medium';
  return 'Standard';
}

// Determine current relationship stage
function determineRelationshipStage(context: ResponseContext): string {
  if (context.sourceType === 'RFP') return 'Initial opportunity';
  if (context.leadType === 'hot') return 'Active interest';
  if (context.leadType === 'warm') return 'Relationship building';
  return 'Early nurturing';
}

// Get next step recommendations
function getNextStepRecommendations(context: ResponseContext, responseType: string): string[] {
  const recommendations = [];
  
  if (responseType === 'rfp') {
    recommendations.push('Prepare capability statement');
    recommendations.push('Research agency background');
    recommendations.push('Schedule pre-proposal meeting if possible');
  } else if (responseType === 'construction') {
    recommendations.push('Monitor construction progress');
    recommendations.push('Connect with project manager');
    recommendations.push('Prepare post-construction services overview');
  } else {
    recommendations.push('Schedule follow-up call');
    recommendations.push('Prepare customized proposal');
    recommendations.push('Research client background');
  }
  
  return recommendations;
}