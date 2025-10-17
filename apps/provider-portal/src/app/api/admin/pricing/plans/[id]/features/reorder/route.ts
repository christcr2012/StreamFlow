/**
 * Feature Reordering API
 * 
 * POST /api/admin/pricing/plans/[id]/features/reorder - Reorder features
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

    const { id: planId } = await params;
    const body = await request.json();
    const { featureIds } = body;

    if (!Array.isArray(featureIds)) {
      return NextResponse.json(
        { error: 'featureIds must be an array' },
        { status: 400 }
      );
    }

    // Update sort order for each feature
    await Promise.all(
      featureIds.map((featureId: string, index: number) =>
        prisma.marketingPricingFeature.update({
          where: { id: featureId, planId }, // Ensure feature belongs to this plan
          data: { sortOrder: index },
        })
      )
    );

    const features = await prisma.marketingPricingFeature.findMany({
      where: { planId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      features,
      message: 'Features reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering features:', error);
    return NextResponse.json({ error: 'Failed to reorder features' }, { status: 500 });
  }
}

