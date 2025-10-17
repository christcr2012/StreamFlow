/**
 * Submit Plan for Review API
 * 
 * POST /api/admin/pricing/plans/[id]/submit-review - Submit a draft plan for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkSuperAdminAccess() {
  const cookieStore = await cookies();
  const hasProviderSession = cookieStore.get('rs_provider') || cookieStore.get('provider-session') || cookieStore.get('ws_provider');
  
  if (!hasProviderSession) {
    return false;
  }
  
  // TODO: Add actual super admin role check when user/role system is implemented
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await checkSuperAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch plan with features
    const plan = await prisma.marketingPricingPlan.findUnique({
      where: { id },
      include: { features: true },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Validate plan can be submitted
    if (plan.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft plans can be submitted for review' },
        { status: 400 }
      );
    }

    // Validate plan has required fields
    if (!plan.name || !plan.description || !plan.cta) {
      return NextResponse.json(
        { error: 'Plan must have name, description, and CTA before submitting for review' },
        { status: 400 }
      );
    }

    if (plan.features.length === 0) {
      return NextResponse.json(
        { error: 'Plan must have at least one feature before submitting for review' },
        { status: 400 }
      );
    }

    // Create history entry
    await prisma.marketingPricingHistory.create({
      data: {
        planId: id,
        action: 'SUBMITTED_FOR_REVIEW',
        changedBy: 'super-admin',
        changes: {
          before: {
            status: plan.status,
          },
          after: {
            status: 'PENDING_REVIEW',
          },
        },
      },
    });

    // Update plan status
    const updatedPlan = await prisma.marketingPricingPlan.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW',
        updatedBy: 'super-admin',
      },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'Plan submitted for review successfully',
    });
  } catch (error) {
    console.error('Error submitting plan for review:', error);
    return NextResponse.json({ error: 'Failed to submit plan for review' }, { status: 500 });
  }
}

