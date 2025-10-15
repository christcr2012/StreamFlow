import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { meteredAnalyzeLead } from '@/lib/aiMeteredHelper';

/**
 * POST /api/leads/[id]/enrich
 * Trigger AI enrichment for a lead
 * 
 * This endpoint uses budget-controlled AI analysis to enrich lead data
 * with quality scores, urgency levels, and actionable insights.
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

    // Fetch lead
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Prepare lead data for AI analysis
    const leadData = {
      title: lead.company || '',
      description: lead.notes || '',
      location: [lead.city, lead.state].filter(Boolean).join(', '),
      sourceType: lead.sourceType,
      agency: '', // Not applicable for tenant leads
      requirements: '',
    };

    // Call metered AI analysis
    const result = await meteredAnalyzeLead(leadData, orgId);

    // Check if AI analysis succeeded
    if (!result.success) {
      // AI budget exhausted or service unavailable
      // Update lead with fallback scoring
      await prisma.lead.update({
        where: { id },
        data: {
          aiScore: result.fallback?.qualityScore || 50,
          scoreFactors: {
            aiAnalysisFailed: true,
            fallbackReason: result.reason || 'AI service unavailable',
            basicScore: result.fallback?.qualityScore || 50,
            recommendedAction: result.fallback?.recommendedAction || 'Contact lead for more details',
          },
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        enriched: false,
        reason: result.reason,
        creditsUsed: result.creditsUsed,
        fallback: result.fallback,
      });
    }

    // AI analysis succeeded - update lead with full analysis
    const analysis = result.analysis!;
    await prisma.lead.update({
      where: { id },
      data: {
        aiScore: analysis.qualityScore,
        scoreFactors: {
          aiAnalysis: JSON.parse(JSON.stringify(analysis)), // Convert to plain object for Prisma Json type
          aiAnalysisFailed: false,
          enrichedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      enriched: true,
      creditsUsed: result.creditsUsed,
      analysis,
    });
  } catch (error: any) {
    console.error('Error enriching lead:', error);
    return NextResponse.json(
      { error: 'Failed to enrich lead' },
      { status: 500 }
    );
  }
}

