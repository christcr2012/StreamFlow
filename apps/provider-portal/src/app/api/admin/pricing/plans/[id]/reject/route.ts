/**
 * Reject Plan API
 * 
 * POST /api/admin/pricing/plans/[id]/reject - Reject a plan pending review (returns to draft)
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
    const body = await request.json();
    const { reason } = body;

    const plan = await prisma.marketingPricingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Only plans pending review can be rejected' },
        { status: 400 }
      );
    }

    // Create history entry
    await prisma.marketingPricingHistory.create({
      data: {
        planId: id,
        action: 'REJECTED',
        changedBy: 'super-admin',
        reason: reason || 'No reason provided',
        changes: {
          before: {
            status: plan.status,
          },
          after: {
            status: 'DRAFT',
          },
        },
      },
    });

    // Update plan status back to draft
    const updatedPlan = await prisma.marketingPricingPlan.update({
      where: { id },
      data: {
        status: 'DRAFT',
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
      message: 'Plan rejected and returned to draft status',
    });
  } catch (error) {
    console.error('Error rejecting plan:', error);
    return NextResponse.json({ error: 'Failed to reject plan' }, { status: 500 });
  }
}

