/**
 * Pricing Plan CRUD API Endpoints
 * 
 * GET    /api/admin/pricing/plans/[id] - Get a single plan
 * PATCH  /api/admin/pricing/plans/[id] - Update a plan
 * DELETE /api/admin/pricing/plans/[id] - Delete a plan
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

export async function GET(
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
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

export async function PATCH(
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

    // Fetch current plan for history
    const currentPlan = await prisma.marketingPricingPlan.findUnique({
      where: { id },
      include: { features: true },
    });

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Extract features from body if present
    const { features, ...planData } = body;

    // Update plan
    const updatedPlan = await prisma.marketingPricingPlan.update({
      where: { id },
      data: {
        ...planData,
        updatedBy: 'super-admin', // TODO: Use actual user ID
      },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Create history entry
    await prisma.marketingPricingHistory.create({
      data: {
        planId: id,
        action: 'UPDATED',
        changedBy: 'super-admin',
        changes: {
          before: {
            name: currentPlan.name,
            price: currentPlan.price,
            description: currentPlan.description,
            status: currentPlan.status,
          },
          after: {
            name: updatedPlan.name,
            price: updatedPlan.price,
            description: updatedPlan.description,
            status: updatedPlan.status,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'Plan updated successfully',
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await checkSuperAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if plan exists
    const plan = await prisma.marketingPricingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Prevent deletion of published plans
    if (plan.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot delete a published plan. Unpublish it first.' },
        { status: 400 }
      );
    }

    // Delete features first (cascade should handle this, but being explicit)
    await prisma.marketingPricingFeature.deleteMany({
      where: { planId: id },
    });

    // Delete history
    await prisma.marketingPricingHistory.deleteMany({
      where: { planId: id },
    });

    // Delete plan
    await prisma.marketingPricingPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}

