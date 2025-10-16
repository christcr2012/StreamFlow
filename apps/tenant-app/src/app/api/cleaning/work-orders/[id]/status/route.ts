/**
 * Cleaning Work Order Status Update API
 * 
 * PATCH /api/cleaning/work-orders/[id]/status - Update work order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { z } from 'zod';

// Validation schema for updating work order status
const UpdateWorkOrderStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
  completedAt: z.string().datetime().optional(),
  actualDuration: z.number().int().positive().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = UpdateWorkOrderStatusSchema.safeParse(body);
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
        id,
        orgId: authContext.orgId
      }
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Update work order
    const updateData: any = {
      status: data.status
    };

    if (data.status === 'COMPLETED') {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : new Date();
      updateData.actualDuration = data.actualDuration;
    }

    const updatedWorkOrder = await prisma.cleaningWorkOrder.update({
      where: { id },
      data: updateData
    });

    // Create status change event
    await prisma.cleaningWorkOrderEvent.create({
      data: {
        workOrderId: id,
        eventType: data.status === 'IN_PROGRESS' ? 'STARTED' :
                   data.status === 'COMPLETED' ? 'COMPLETED' :
                   data.status === 'CANCELLED' ? 'CANCELLED' : 'CREATED',
        userId: authContext.userId,
        metadata: JSON.stringify({
          notes: data.notes || `Status changed to ${data.status}`,
          oldStatus: workOrder.status,
          newStatus: data.status
        })
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'unknown',
        entityType: 'cleaning_work_order',
        entityId: id,
        action: 'status_changed',
        meta: JSON.stringify({
          oldStatus: workOrder.status,
          newStatus: data.status,
          completedAt: updateData.completedAt,
          actualDuration: data.actualDuration
        })
      }
    });

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error('Error updating work order status:', error);
    return NextResponse.json(
      { error: 'Failed to update work order status' },
      { status: 500 }
    );
  }
}

