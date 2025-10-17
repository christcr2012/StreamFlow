/**
 * Feature Management API
 * 
 * PATCH  /api/admin/pricing/features/[id] - Update a feature
 * DELETE /api/admin/pricing/features/[id] - Delete a feature
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
    const { text, sortOrder } = body;

    const feature = await prisma.marketingPricingFeature.update({
      where: { id },
      data: {
        text: text !== undefined ? text : undefined,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      feature,
      message: 'Feature updated successfully',
    });
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
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

    await prisma.marketingPricingFeature.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Feature deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 });
  }
}

