/**
 * Cleaning Inspections API Routes
 * 
 * GET /api/cleaning/inspections - List all cleaning inspections for the organization
 * POST /api/cleaning/inspections - Create a new cleaning inspection
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { z } from 'zod';

// Validation schema for creating a cleaning inspection
const CreateCleaningInspectionSchema = z.object({
  workOrderId: z.string(),
  inspectorId: z.string().optional(),
  checklistJson: z.any(), // Array of checklist items with completion status
  score: z.number().min(0).max(100).optional(),
  defectsCount: z.number().int().min(0).optional()
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workOrderId = searchParams.get('workOrderId');
    const passed = searchParams.get('passed');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      orgId: authContext.orgId
    };

    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    if (passed !== null && passed !== undefined) {
      where.status = passed === 'true' ? 'COMPLETED' : 'PENDING';
    }

    // Fetch inspections with pagination
    const [inspections, total] = await Promise.all([
      prisma.cleaningInspection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          workOrders: {
            select: {
              id: true,
              scheduledDate: true,
              status: true,
              contract: {
                select: {
                  id: true,
                  estimate: {
                    select: {
                      spaceType: true,
                      lead: {
                        select: {
                          contactName: true,
                          address: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.cleaningInspection.count({ where })
    ]);

    return NextResponse.json({
      inspections,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching cleaning inspections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning inspections' },
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
    const validationResult = CreateCleaningInspectionSchema.safeParse(body);
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

    // Verify work order exists and belongs to org
    const workOrder = await prisma.cleaningWorkOrder.findFirst({
      where: {
        id: data.workOrderId,
        orgId: authContext.orgId
      }
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Create inspection
    const inspection = await prisma.cleaningInspection.create({
      data: {
        orgId: authContext.orgId,
        workOrderId: data.workOrderId,
        inspectorId: data.inspectorId,
        checklistJson: JSON.stringify(data.checklistJson),
        score: data.score,
        defectsCount: data.defectsCount || 0,
        status: 'COMPLETED',
        inspectedAt: new Date()
      }
    });

    // Create inspection event on work order
    await prisma.cleaningWorkOrderEvent.create({
      data: {
        workOrderId: data.workOrderId,
        eventType: 'COMPLETED',
        userId: authContext.userId,
        metadata: JSON.stringify({
          inspectionId: inspection.id,
          score: data.score,
          defectsCount: data.defectsCount || 0
        })
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'unknown',
        entityType: 'cleaning_inspection',
        entityId: inspection.id,
        action: 'created',
        meta: JSON.stringify({
          workOrderId: data.workOrderId,
          score: data.score,
          defectsCount: data.defectsCount || 0
        })
      }
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error('Error creating cleaning inspection:', error);
    return NextResponse.json(
      { error: 'Failed to create cleaning inspection' },
      { status: 500 }
    );
  }
}

