/**
 * Cleaning Work Orders API Routes
 * 
 * GET /api/cleaning/work-orders - List all cleaning work orders for the organization
 * POST /api/cleaning/work-orders - Create a new cleaning work order
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { z } from 'zod';

// Validation schema for creating a cleaning work order
const CreateCleaningWorkOrderSchema = z.object({
  contractId: z.string().optional(),
  publicId: z.string(),
  siteAddress: z.string(),
  spaceType: z.string(),
  squareFeet: z.number().int().positive(),
  scheduledDate: z.string().datetime(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  assignedTo: z.string().optional(),
  notes: z.string().optional()
});

// Validation schema for updating work order status
const UpdateWorkOrderStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      orgId: authContext.orgId
    };

    if (contractId) {
      where.contractId = contractId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate);
      }
    }

    // Fetch work orders with pagination
    const [workOrders, total] = await Promise.all([
      prisma.cleaningWorkOrder.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
        take: limit,
        skip: offset,
        include: {
          contract: {
            select: {
              id: true,
              frequency: true,
              basePrice: true,
              estimate: {
                select: {
                  spaceType: true,
                  squareFeet: true,
                  lead: {
                    select: {
                      contactName: true,
                      address: true,
                      city: true,
                      state: true
                    }
                  }
                }
              }
            }
          },

          events: {
            select: {
              id: true,
              eventType: true,
              timestamp: true,
              metadata: true
            },
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      }),
      prisma.cleaningWorkOrder.count({ where })
    ]);

    return NextResponse.json({
      workOrders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching cleaning work orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning work orders' },
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
    const validationResult = CreateCleaningWorkOrderSchema.safeParse(body);
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

    // Verify contract exists and belongs to org
    const contract = await prisma.cleaningContract.findFirst({
      where: {
        id: data.contractId,
        orgId: authContext.orgId
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Create work order
    const workOrder = await prisma.cleaningWorkOrder.create({
      data: {
        orgId: authContext.orgId,
        contractId: data.contractId,
        publicId: data.publicId,
        siteAddress: data.siteAddress,
        spaceType: data.spaceType,
        squareFeet: data.squareFeet,
        scheduledDate: new Date(data.scheduledDate),
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        assignedTo: data.assignedTo,
        status: 'SCHEDULED'
      }
    });

    // Create initial event
    await prisma.cleaningWorkOrderEvent.create({
      data: {
        workOrderId: workOrder.id,
        eventType: 'CREATED',
        userId: authContext.userId,
        metadata: data.notes ? JSON.stringify({ notes: data.notes }) : undefined
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'unknown',
        entityType: 'cleaning_work_order',
        entityId: workOrder.id,
        action: 'created',
        meta: JSON.stringify({
          contractId: data.contractId,
          scheduledDate: data.scheduledDate,
          assignedTo: data.assignedTo
        })
      }
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating cleaning work order:', error);
    return NextResponse.json(
      { error: 'Failed to create cleaning work order' },
      { status: 500 }
    );
  }
}

