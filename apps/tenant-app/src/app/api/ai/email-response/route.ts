import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateEmailResponse } from '@/lib/aiHelper';
import { checkAiBudget } from '@/lib/aiMeter';
import { prisma } from '@/lib/prisma';

// SECURITY: Input validation schema
const emailResponseSchema = z.object({
  customerName: z.string().min(1).max(200),
  topic: z.string().min(1).max(500),
  incomingEmail: z.string().max(10000).optional(),
  tone: z.enum(['professional', 'friendly', 'formal']).default('professional'),
  additionalContext: z.string().max(2000).optional(),
  model: z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']).optional(),
});

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

    // SECURITY: Validate and parse request body
    const body = await req.json();
    const validationResult = emailResponseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { customerName, topic, incomingEmail, tone, additionalContext, model } = validationResult.data;

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

