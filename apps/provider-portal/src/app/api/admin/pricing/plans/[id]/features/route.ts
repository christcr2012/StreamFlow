/**
 * Plan Features API
 * 
 * POST /api/admin/pricing/plans/[id]/features - Add a feature to a plan
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
    const { text, sortOrder } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Feature text is required' },
        { status: 400 }
      );
    }

    // Get current feature count to set default sort order
    const featureCount = await prisma.marketingPricingFeature.count({
      where: { planId },
    });

    const feature = await prisma.marketingPricingFeature.create({
      data: {
        planId,
        text,
        sortOrder: sortOrder !== undefined ? sortOrder : featureCount,
      },
    });

    return NextResponse.json({
      success: true,
      feature,
      message: 'Feature added successfully',
    });
  } catch (error) {
    console.error('Error adding feature:', error);
    return NextResponse.json({ error: 'Failed to add feature' }, { status: 500 });
  }
}

