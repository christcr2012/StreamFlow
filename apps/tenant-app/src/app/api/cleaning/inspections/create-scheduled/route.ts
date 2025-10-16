/**
 * Cleaning Inspections - Create Scheduled Inspections
 * 
 * POST /api/cleaning/inspections/create-scheduled - Create inspections for completed work orders
 * 
 * This endpoint is designed to be called by a cron job (daily at 8 AM)
 * to automatically create QA inspections for work orders completed in the last 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    // Allow both authenticated users and cron jobs
    const cronSecret = request.headers.get('x-cron-secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;
    
    if (!authContext.isAuthenticated && !isValidCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get time window from request or use default (last 24 hours)
    const body = await request.json().catch(() => ({}));
    const hoursBack = body.hoursBack || 24;
    
    const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Find completed work orders
    const workOrders = await prisma.cleaningWorkOrder.findMany({
      where: {
        status: 'COMPLETED',
        actualEnd: { gte: cutoffDate }
      }
    });

    // Get existing inspections for these work orders
    const existingInspections = await prisma.cleaningInspection.findMany({
      where: {
        workOrderId: { in: workOrders.map(wo => wo.id) }
      },
      select: {
        workOrderId: true
      }
    });

    const existingWorkOrderIds = new Set(existingInspections.map(i => i.workOrderId));

    // Filter to only work orders without inspections
    const workOrdersNeedingInspection = workOrders.filter(wo => !existingWorkOrderIds.has(wo.id));

    let created = 0;
    const errors: string[] = [];

    for (const wo of workOrdersNeedingInspection) {
      try {
        // Create default checklist based on space type
        const defaultChecklist = generateDefaultChecklist(wo.spaceType);

        // Create inspection
        await prisma.cleaningInspection.create({
          data: {
            orgId: wo.orgId,
            workOrderId: wo.id,
            checklistJson: JSON.stringify(defaultChecklist),
            defectsCount: 0,
            status: 'PENDING'
          }
        });

        created++;

        // Log activity
        await prisma.activity.create({
          data: {
            orgId: wo.orgId,
            actorType: 'system',
            actorId: 'inspection-cron',
            entityType: 'cleaning_inspection',
            entityId: wo.id,
            action: 'created',
            meta: JSON.stringify({
              workOrderId: wo.id,
              spaceType: wo.spaceType,
              automated: true
            })
          }
        });
      } catch (error) {
        console.error(`Error creating inspection for work order ${wo.id}:`, error);
        errors.push(`Work order ${wo.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        workOrdersProcessed: workOrders.length,
        inspectionsCreated: created,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error creating scheduled inspections:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled inspections' },
      { status: 500 }
    );
  }
}

/**
 * Generate default checklist based on space type
 */
function generateDefaultChecklist(spaceType: string): any[] {
  const baseChecklist = [
    { item: 'Floors cleaned and mopped', completed: false, required: true },
    { item: 'Surfaces dusted and wiped', completed: false, required: true },
    { item: 'Trash removed and bins emptied', completed: false, required: true },
    { item: 'Windows cleaned (interior)', completed: false, required: false },
    { item: 'Restrooms sanitized', completed: false, required: true }
  ];

  // Add space-type specific items
  if (spaceType === 'residential') {
    baseChecklist.push(
      { item: 'Kitchen appliances cleaned', completed: false, required: true },
      { item: 'Bedrooms vacuumed', completed: false, required: true },
      { item: 'Bathrooms scrubbed', completed: false, required: true }
    );
  } else if (spaceType === 'commercial') {
    baseChecklist.push(
      { item: 'Break room cleaned', completed: false, required: true },
      { item: 'Conference rooms tidied', completed: false, required: true },
      { item: 'Entryway mopped', completed: false, required: true }
    );
  } else if (spaceType === 'post-construction') {
    baseChecklist.push(
      { item: 'Debris removed', completed: false, required: true },
      { item: 'Dust from all surfaces', completed: false, required: true },
      { item: 'Windows cleaned (interior & exterior)', completed: false, required: true },
      { item: 'Final walkthrough completed', completed: false, required: true }
    );
  }

  return baseChecklist;
}

