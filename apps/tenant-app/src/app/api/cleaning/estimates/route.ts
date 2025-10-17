/**
 * Cleaning Estimates API Routes
 * 
 * GET /api/cleaning/estimates - List all cleaning estimates for the organization
 * POST /api/cleaning/estimates - Create a new cleaning estimate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { z } from 'zod';
import { verticalsRegistry } from '@cortiware/verticals';

// Validation schema for creating a cleaning estimate
const CreateCleaningEstimateSchema = z.object({
  leadId: z.string().optional(),
  spaceType: z.enum(['residential', 'commercial', 'post-construction']),
  squareFeet: z.number().int().positive('Square feet must be positive'),
  frequency: z.enum(['one-time', 'weekly', 'bi-weekly', 'monthly']),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  floors: z.number().int().min(1).optional(),
  pets: z.boolean().optional(),
  deepClean: z.boolean().optional(),
  windows: z.number().int().min(0).optional(),
  carpetSqFt: z.number().int().min(0).optional(),
  hardwoodSqFt: z.number().int().min(0).optional(),
  tileSqFt: z.number().int().min(0).optional()
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      orgId: authContext.orgId
    };

    if (leadId) {
      where.leadId = leadId;
    }

    if (status) {
      where.status = status;
    }

    // Fetch estimates with pagination
    const [estimates, total] = await Promise.all([
      prisma.cleaningEstimate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { CleaningLead: {
            select: {
              id: true,
              contactName: true,
              company: true,
              address: true
            }
          },
          contract: {
            select: {
              id: true,
              status: true
            }
          }
        }
      }),
      prisma.cleaningEstimate.count({ where })
    ]);

    return NextResponse.json({
      estimates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching cleaning estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning estimates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = CreateCleaningEstimateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Generate estimate using vertical pack
    const cleaningPack = verticalsRegistry['cleaning'];
    const estimateResult = cleaningPack.estimate({
      spaceType: data.spaceType,
      squareFeet: data.squareFeet,
      frequency: data.frequency,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      floors: data.floors,
      pets: data.pets,
      deepClean: data.deepClean,
      windows: data.windows,
      carpetSqFt: data.carpetSqFt,
      hardwoodSqFt: data.hardwoodSqFt,
      tileSqFt: data.tileSqFt
    });

    // Create Good/Better/Best pricing options
    const baseTotal = estimateResult.total;
    const options = [
      {
        tier: 'good',
        price: Math.round(baseTotal * 0.85 * 100) / 100, // 15% discount
        scope: 'Basic cleaning services',
        features: [
          'Standard cleaning supplies',
          'Basic equipment',
          'Regular crew',
          'Standard scheduling'
        ]
      },
      {
        tier: 'better',
        price: baseTotal,
        scope: 'Enhanced cleaning services',
        features: [
          'Eco-friendly supplies',
          'Professional equipment',
          'Experienced crew',
          'Priority scheduling',
          'Quality inspection'
        ]
      },
      {
        tier: 'best',
        price: Math.round(baseTotal * 1.25 * 100) / 100, // 25% premium
        scope: 'Premium cleaning services',
        features: [
          'Premium eco-friendly supplies',
          'Advanced equipment',
          'Senior crew members',
          'Flexible scheduling',
          'Detailed quality inspection',
          'Satisfaction guarantee',
          '24/7 support'
        ]
      }
    ];

    // Create estimate
    const estimate = await prisma.cleaningEstimate.create({
      data: {
        orgId: authContext.orgId,
        leadId: data.leadId,
        version: 1,
        spaceType: data.spaceType,
        squareFeet: data.squareFeet,
        frequency: data.frequency,
        optionsJson: JSON.stringify(options),
        status: 'DRAFT'
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'unknown',
        entityType: 'cleaning_estimate',
        entityId: estimate.id,
        action: 'created',
        meta: JSON.stringify({
          spaceType: estimate.spaceType,
          squareFeet: estimate.squareFeet,
          estimatedTotal: baseTotal,
          warnings: estimateResult.warnings
        })
      }
    });

    return NextResponse.json({
      estimate,
      calculation: {
        lines: estimateResult.lines,
        warnings: estimateResult.warnings,
        options
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating cleaning estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create cleaning estimate' },
      { status: 500 }
    );
  }
}

