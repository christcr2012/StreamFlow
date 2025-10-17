/**
 * Unpublish Pricing Plan API Endpoint
 * 
 * POST /api/admin/pricing/plans/[id]/unpublish
 * 
 * Unpublishes a pricing plan, removing it from the marketing site
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
    // Check authentication
    const hasAccess = await checkSuperAdminAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch the plan
    const plan = await prisma.marketingPricingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create history entry
    await prisma.marketingPricingHistory.create({
      data: {
        planId: id,
        action: 'UNPUBLISHED',
        changedBy: 'super-admin', // TODO: Use actual user ID when auth is implemented
        changes: {
          before: {
            status: plan.status,
            publishedAt: plan.publishedAt,
          },
          after: {
            status: 'DRAFT',
            publishedAt: null,
          },
        },
      },
    });

    // Update plan status to DRAFT
    const updatedPlan = await prisma.marketingPricingPlan.update({
      where: { id },
      data: {
        status: 'DRAFT',
        publishedAt: null,
        updatedBy: 'super-admin', // TODO: Use actual user ID
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
      message: 'Plan unpublished successfully. Marketing site will update within 60 seconds.',
    });
  } catch (error) {
    console.error('Error unpublishing plan:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish plan' },
      { status: 500 }
    );
  }
}

