import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateEmailResponse } from '@/lib/aiHelper';
import { checkAiBudget } from '@/lib/aiMeter';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.value;

    // Check AI budget (estimate 1 credit for email response)
    const budgetCheck = await checkAiBudget(orgId, 'email-response', 1);
    if (!budgetCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: budgetCheck.reason || 'AI budget exceeded' },
        { status: 402 }
      );
    }

    const body = await req.json();
    const { customerName, topic, incomingEmail, tone, additionalContext, model } = body;

    // Generate email response
    const suggestion = await generateEmailResponse({
      customerName,
      topic,
      incomingEmail,
      tone,
      additionalContext,
      model,
    });

    // Record AI usage (estimate 1 credit per email response)
    // Update org credit balance
    await prisma.org.update({
      where: { id: orgId },
      data: {
        aiCreditBalance: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      suggestion,
      creditsUsed: 1,
    });
  } catch (error: any) {
    console.error('Email response generation error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to generate email response' },
      { status: 500 }
    );
  }
}

