// apps/tenant-app/src/app/api/vertical-packs/route.ts
// Vertical packs configuration API - Phase 2: Real database implementation

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { createSafeErrorResponse } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (active === 'true') {
      where.isActive = true;
    } else if (active === 'false') {
      where.isActive = false;
    }

    const verticalPacks = await prisma.verticalPack.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get the org's activated packs
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { activeVerticalPacks: true },
    });

    const activePacks = (org?.activeVerticalPacks as string[]) || [];

    // Format response with activation status for this org
    const formatted = verticalPacks.map((pack: any) => ({
      id: pack.id,
      key: pack.key,
      name: pack.name,
      description: pack.description,
      icon: pack.icon,
      category: pack.category,
      active: activePacks.includes(pack.key), // Active for THIS org
      isAvailable: pack.isActive, // Available globally
      features: pack.features,
      customFields: pack.customFields,
      displayOrder: pack.displayOrder,
    }));

    const activeCount = formatted.filter((p: any) => p.active).length;

    return NextResponse.json({
      verticalPacks: formatted,
      total: formatted.length,
      activeCount,
    });
  } catch (error) {
    console.error('Failed to fetch vertical packs:', error);
    return createSafeErrorResponse(error, 'vertical-packs-get', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, active } = body;

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    // Verify the vertical pack exists
    const verticalPack = await prisma.verticalPack.findUnique({
      where: { key },
    });

    if (!verticalPack) {
      return NextResponse.json({ error: 'Vertical pack not found' }, { status: 404 });
    }

    if (!verticalPack.isActive) {
      return NextResponse.json({ error: 'This vertical pack is not available' }, { status: 400 });
    }

    // Get current org
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { activeVerticalPacks: true },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    let activePacks = (org.activeVerticalPacks as string[]) || [];

    // Update the active packs list
    if (active) {
      // Add the pack if not already active
      if (!activePacks.includes(key)) {
        activePacks.push(key);
      }
    } else {
      // Remove the pack
      activePacks = activePacks.filter((k: string) => k !== key);
    }

    // Update the org
    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        activeVerticalPacks: activePacks,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      key,
      active,
      activePacks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to update vertical pack:', error);
    return createSafeErrorResponse(error, 'vertical-packs-patch', 500);
  }
}

// POST endpoint to create/seed vertical packs (admin only)
export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, name, description, icon, category, features, customFields, isActive, displayOrder } = body;

    if (!key || !name) {
      return NextResponse.json({ error: 'key and name are required' }, { status: 400 });
    }

    const verticalPack = await prisma.verticalPack.create({
      data: {
        key,
        name,
        description,
        icon,
        category: category || 'Trade Services',
        features: features || [],
        customFields: customFields || [],
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
      },
    });

    return NextResponse.json({
      id: verticalPack.id,
      key: verticalPack.key,
      name: verticalPack.name,
      description: verticalPack.description,
      icon: verticalPack.icon,
      category: verticalPack.category,
      features: verticalPack.features,
      customFields: verticalPack.customFields,
      isActive: verticalPack.isActive,
      displayOrder: verticalPack.displayOrder,
      createdAt: verticalPack.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create vertical pack:', error);
    return createSafeErrorResponse(error, 'vertical-packs-post', 500);
  }
}
