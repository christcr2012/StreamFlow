/**
 * Publish Pricing Plan API Endpoint
 * 
 * POST /api/admin/pricing/plans/[id]/publish
 * 
 * Publishes a pricing plan, making it visible on the marketing site
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
      include: { features: true },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Validate plan has required fields
    if (!plan.name || !plan.description || !plan.cta) {
      return NextResponse.json(
        { error: 'Plan is missing required fields (name, description, or CTA)' },
        { status: 400 }
      );
    }

    if (plan.features.length === 0) {
      return NextResponse.json(
        { error: 'Plan must have at least one feature before publishing' },
        { status: 400 }
      );
    }

    // Create history entry
    await prisma.marketingPricingHistory.create({
      data: {
        planId: id,
        action: 'PUBLISHED',
        changedBy: 'super-admin', // TODO: Use actual user ID when auth is implemented
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

    // Update plan status to PUBLISHED
    const updatedPlan = await prisma.marketingPricingPlan.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
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
      message: 'Plan published successfully. Marketing site will update within 60 seconds.',
    });
  } catch (error) {
    console.error('Error publishing plan:', error);
    return NextResponse.json(
      { error: 'Failed to publish plan' },
      { status: 500 }
    );
  }
}

