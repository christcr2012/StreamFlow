/**
 * Pricing Plans Collection API
 * 
 * GET  /api/admin/pricing/plans - List all plans
 * POST /api/admin/pricing/plans - Create a new plan
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

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await checkSuperAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.marketingPricingPlan.findMany({
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { history: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await checkSuperAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, price, currency, description, cta, highlighted, active, sortOrder, features } = body;

    // Validate required fields
    if (!name || !slug || price === undefined || !currency || !description || !cta) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, price, currency, description, cta' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPlan = await prisma.marketingPricingPlan.findUnique({
      where: { slug },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'A plan with this slug already exists' },
        { status: 400 }
      );
    }

    // Create plan with features
    const plan = await prisma.marketingPricingPlan.create({
      data: {
        name,
        slug,
        price,
        currency: currency || 'USD',
        description,
        cta,
        highlighted: highlighted || false,
        active: active !== false, // Default to true
        sortOrder: sortOrder || 0,
        status: 'DRAFT',
        createdBy: 'super-admin', // TODO: Use actual user ID
        updatedBy: 'super-admin',
        features: features
          ? {
              create: features.map((feature: any, index: number) => ({
                text: feature.text,
                sortOrder: feature.sortOrder !== undefined ? feature.sortOrder : index,
              })),
            }
          : undefined,
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
        planId: plan.id,
        action: 'CREATED',
        changedBy: 'super-admin',
        changes: {
          after: {
            name: plan.name,
            slug: plan.slug,
            price: plan.price,
            currency: plan.currency,
            description: plan.description,
            cta: plan.cta,
            highlighted: plan.highlighted,
            active: plan.active,
            status: plan.status,
            featureCount: features?.length || 0,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      plan,
      message: 'Plan created successfully',
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

