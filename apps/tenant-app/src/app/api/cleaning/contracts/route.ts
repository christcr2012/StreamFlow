/**
 * Cleaning Contracts API Routes
 * 
 * GET /api/cleaning/contracts - List all cleaning contracts for the organization
 * POST /api/cleaning/contracts - Create a new cleaning contract from an estimate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { z } from 'zod';

// Validation schema for creating a cleaning contract
const CreateCleaningContractSchema = z.object({
  estimateId: z.string(),
  customerId: z.string().optional(),
  siteAddress: z.string(),
  spaceType: z.string(),
  squareFeet: z.number().int().positive(),
  frequency: z.enum(['one-time', 'weekly', 'bi-weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  recurrenceRule: z.string().optional(), // RRULE format
  basePrice: z.number().positive(),
  taxRate: z.number().min(0).max(100).optional(),
  escalatorPct: z.number().min(0).max(100).optional(),
  slaResponseHours: z.number().int().positive().optional(),
  slaCompletionHours: z.number().int().positive().optional()
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      orgId: authContext.orgId
    };

    if (status) {
      where.status = status;
    }

    // Fetch contracts with pagination
    const [contracts, total] = await Promise.all([
      prisma.cleaningContract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { CleaningEstimate: {
            select: {
              id: true,
              spaceType: true,
              squareFeet: true
            }
          },
          CleaningWorkOrder: {
            select: {
              id: true,
              status: true,
              scheduledDate: true
            },
            orderBy: { scheduledDate: 'desc' },
            take: 5
          }
        }
      }),
      prisma.cleaningContract.count({ where })
    ]);

    return NextResponse.json({
      contracts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching cleaning contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning contracts' },
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
    const validationResult = CreateCleaningContractSchema.safeParse(body);
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

    // Verify estimate exists and belongs to org
    const estimate = await prisma.cleaningEstimate.findFirst({
      where: {
        id: data.estimateId,
        orgId: authContext.orgId
      }
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Create contract
    const contract = await prisma.cleaningContract.create({
      data: {
        orgId: authContext.orgId,
        estimateId: data.estimateId,
        customerId: data.customerId,
        siteAddress: data.siteAddress,
        spaceType: data.spaceType,
        squareFeet: data.squareFeet,
        recurrenceRule: data.recurrenceRule,
        frequency: data.frequency,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        basePrice: data.basePrice,
        taxRate: data.taxRate,
        escalatorPct: data.escalatorPct,
        slaResponseHours: data.slaResponseHours,
        slaCompletionHours: data.slaCompletionHours,
        status: 'ACTIVE'
      }
    });

    // Update estimate status
    await prisma.cleaningEstimate.update({
      where: { id: data.estimateId },
      data: { status: 'ACCEPTED' }
    });

    // Update lead status if exists
    if (estimate.leadId) {
      await prisma.cleaningLead.update({
        where: { id: estimate.leadId },
        data: { status: 'WON' }
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'unknown',
        entityType: 'cleaning_contract',
        entityId: contract.id,
        action: 'created',
        meta: JSON.stringify({
          estimateId: data.estimateId,
          frequency: data.frequency,
          basePrice: data.basePrice,
          recurrenceRule: data.recurrenceRule
        })
      }
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating cleaning contract:', error);
    return NextResponse.json(
      { error: 'Failed to create cleaning contract' },
      { status: 500 }
    );
  }
}

