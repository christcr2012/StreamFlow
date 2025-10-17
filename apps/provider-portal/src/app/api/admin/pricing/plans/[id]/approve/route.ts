/**
 * Approve Plan API
 * 
 * POST /api/admin/pricing/plans/[id]/approve - Approve a plan pending review (publishes it)
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

    const plan = await prisma.marketingPricingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Only plans pending review can be approved' },
        { status: 400 }
      );
    }

    // Create history entry
    await prisma.marketingPricingHistory.create({
      data: {
        planId: id,
        action: 'APPROVED',
        changedBy: 'super-admin',
        changes: {
          before: {
            status: plan.status,
            publishedAt: plan.publishedAt,
          },
          after: {
            status: 'PUBLISHED',
            publishedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Update plan status to published
    const updatedPlan = await prisma.marketingPricingPlan.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
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
      message: 'Plan approved and published successfully. It will appear on the marketing site within 60 seconds.',
    });
  } catch (error) {
    console.error('Error approving plan:', error);
    return NextResponse.json({ error: 'Failed to approve plan' }, { status: 500 });
  }
}

