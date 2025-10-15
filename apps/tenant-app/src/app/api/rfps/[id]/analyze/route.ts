import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { meteredAnalyzeRFP, meteredGeneratePricingAdvice } from '@/lib/aiMeteredHelper';

// SECURITY: Input validation schema for RFP analysis
const analyzeRFPSchema = z.object({
  // Optional parameters for future extensibility
  forceReanalyze: z.boolean().optional(),
  includeDetailedPricing: z.boolean().optional(),
});

/**
 * POST /api/rfps/[id]/analyze
 * Trigger AI analysis for an RFP
 *
 * SECURITY: Validates request body with Zod schema
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from session
    const orgId = session.value;
    const { id } = await params;

    // SECURITY: Validate request body (even if empty, ensures no malicious data)
    const body = await req.json().catch(() => ({}));
    const validationResult = analyzeRFPSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Fetch RFP
    const rfp = await prisma.rfp.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Prepare RFP data for analysis
    const rfpData = {
      title: rfp.title,
      description: '', // Would come from docs in production
      requirements: '', // Would come from docs in production
      agency: rfp.sourceSite,
      responseDeadline: rfp.dueDate?.toISOString(),
      estimatedValue: undefined,
      location: '',
    };

    // Analyze RFP with budget control
    const strategyResult = await meteredAnalyzeRFP(rfpData, orgId);

    let totalCreditsUsed = strategyResult.creditsUsed || 0;
    let aiAnalysisFailed = false;

    // If strategy analysis failed, mark as failed
    if (!strategyResult.strategy) {
      aiAnalysisFailed = true;
    }

    // Generate pricing advice (only if strategy succeeded)
    let pricingResult = null;
    if (!aiAnalysisFailed) {
      pricingResult = await meteredGeneratePricingAdvice({
        serviceType: 'Government Contract',
        squareFootage: undefined,
        frequency: undefined,
        location: '',
        specialRequirements: rfp.title,
        timeline: rfp.dueDate?.toISOString(),
        clientType: 'government',
      }, orgId);

      totalCreditsUsed += pricingResult.creditsUsed || 0;

      if (!pricingResult.advice) {
        aiAnalysisFailed = true;
      }
    }

    // Calculate bid fit score (0-100)
    let bidFitScore = null;
    if (strategyResult.strategy) {
      // Simple heuristic: more win factors = higher score
      const winFactorCount = strategyResult.strategy.winFactors?.length || 0;
      const riskFactorCount = strategyResult.strategy.riskFactors?.length || 0;
      bidFitScore = Math.min(100, Math.max(0, 50 + (winFactorCount * 10) - (riskFactorCount * 5)));
    }

    // Update RFP with AI analysis
    await prisma.rfp.update({
      where: { id },
      data: {
        aiBidFit: bidFitScore,
        aiPriceHint: {
          strategy: strategyResult.strategy ? JSON.parse(JSON.stringify(strategyResult.strategy)) : null,
          pricing: pricingResult?.advice ? JSON.parse(JSON.stringify(pricingResult.advice)) : null,
          aiAnalysisFailed,
          confidence: aiAnalysisFailed ? 0 : 0.85, // Default confidence
          analyzedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      analyzed: true,
      creditsUsed: totalCreditsUsed,
      bidFitScore,
      aiAnalysisFailed,
    });
  } catch (error: any) {
    console.error('Error analyzing RFP:', error);
    return NextResponse.json(
      { error: 'Failed to analyze RFP' },
      { status: 500 }
    );
  }
}

