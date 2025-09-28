// AI-Powered RFP Strategy Analysis API
// Generates intelligent bidding strategies, competitive analysis, and response templates
import type { NextApiRequest, NextApiResponse } from "next";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { analyzeRFP, generatePricingAdvice } from "@/lib/aiHelper";
import { prisma as db } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check permissions  
    const orgId = await getOrgIdFromReq(req);
    await assertPermission(req, res, PERMS.LEAD_READ);

    const { leadId, rfpData } = req.body;

    if (!leadId && !rfpData) {
      return res.status(400).json({ error: 'leadId or rfpData required' });
    }

    let rfpInfo = rfpData;

    // If leadId provided, fetch lead data from database
    if (leadId) {
      const lead = await db.lead.findFirst({
        where: {
          id: leadId,
          orgId: orgId || undefined
        },
        select: {
          publicId: true,
          company: true,
          notes: true,
          sourceDetail: true,
          city: true,
          state: true,
          // enrichmentData: true // Field doesn't exist in Lead model
        }
      });

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Extract RFP details from lead enrichment data
      // const enrichment = lead.enrichmentData as any; // Field doesn't exist
      rfpInfo = {
        title: lead.company || 'RFP Analysis',
        description: lead.notes || 'Federal cleaning contract',
        agency: 'Federal Agency', // TODO: Get from enrichmentData when implemented
        location: [lead.city, lead.state].filter(Boolean).join(', '),
        requirements: '', // TODO: Get from enrichmentData when implemented
        responseDeadline: null, // TODO: Get from enrichmentData when implemented
        estimatedValue: null // TODO: Get from enrichmentData when implemented
      };
    }

    // Generate AI-powered RFP strategy analysis
    const [rfpStrategy, pricingAdvice] = await Promise.all([
      analyzeRFP(rfpInfo),
      generatePricingAdvice({
        serviceType: 'janitorial',
        location: rfpInfo.location,
        clientType: 'government',
        specialRequirements: rfpInfo.requirements
      })
    ]);

    // Combine strategy and pricing insights
    const analysis = {
      rfpStrategy,
      pricingAdvice,
      actionPlan: {
        immediateSteps: [
          'Review RFP requirements against current capabilities',
          'Research contracting agency background and past awards',
          'Prepare capability statement highlighting relevant experience'
        ],
        timelineTasks: [
          { task: 'Submit questions to contracting officer', deadline: '7 days before response due' },
          { task: 'Complete technical proposal draft', deadline: '3 days before response due' },
          { task: 'Finalize pricing and submit complete response', deadline: 'Response deadline' }
        ]
      },
      aiInsights: {
        successProbability: calculateSuccessProbability(rfpStrategy),
        recommendedBidAmount: pricingAdvice.suggestedRange,
        keyDifferentiators: identifyDifferentiators(rfpStrategy, rfpInfo)
      }
    };

    res.status(200).json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('RFP strategy analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
}

// Calculate bid success probability based on AI analysis
function calculateSuccessProbability(strategy: any): string {
  const winFactors = strategy.winFactors?.length || 0;
  const riskFactors = strategy.riskFactors?.length || 0;
  
  if (winFactors > riskFactors + 2) return 'High (70-85%)';
  if (winFactors > riskFactors) return 'Medium (50-70%)';
  if (winFactors === riskFactors) return 'Moderate (30-50%)';
  return 'Lower (15-30%)';
}

// Identify key differentiators for competitive advantage
function identifyDifferentiators(strategy: any, rfpInfo: any): string[] {
  const differentiators = [];
  
  if (rfpInfo.location?.includes('Colorado')) {
    differentiators.push('Local Colorado presence - reduced travel costs and faster response times');
  }
  
  if (rfpInfo.requirements?.includes('561720') || rfpInfo.requirements?.includes('S201')) {
    differentiators.push('Specialized janitorial experience matching exact NAICS/PSC codes');
  }
  
  if (strategy.winFactors?.some((f: string) => f.toLowerCase().includes('local'))) {
    differentiators.push('Community relationships and local business knowledge');
  }
  
  if (strategy.winFactors?.some((f: string) => f.toLowerCase().includes('price'))) {
    differentiators.push('Competitive pricing through operational efficiency');
  }
  
  return differentiators.length > 0 ? differentiators : ['Focus on quality, reliability, and competitive pricing'];
}