/**
 * Cleaning Inspections - Create Scheduled Inspections
 *
 * POST /api/cleaning/inspections/create-scheduled - Create inspections for completed work orders
 *
 * This endpoint is designed to be called by a cron job (daily at 8 AM)
 * to automatically create QA inspections for work orders completed in the last 24 hours.
 *
 * Now uses BullMQ queue for background processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { enqueue } from '@/lib/queue/enqueue';
import { QUEUE_NAMES } from '@cortiware/queue';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    // Allow both authenticated users and cron jobs
    const cronSecret = request.headers.get('x-cron-secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;
    
    if (!authContext.isAuthenticated && !isValidCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters from request
    const body = await request.json().catch(() => ({}));
    const weekStartISO = body.weekStartISO || new Date().toISOString().split('T')[0];
    const percent = body.percent || 10; // Default 10% inspection rate
    const bias = body.bias || {};

    // Get all unique orgIds that have completed work orders
    const orgs = await prisma.cleaningWorkOrder.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: { orgId: true },
      distinct: ['orgId'],
    });

    // Enqueue an inspection generation job for each org
    const jobs = [];
    for (const org of orgs) {
      const job = await enqueue(
        QUEUE_NAMES.QA,
        'inspections.generate',
        {
          orgId: org.orgId,
          weekStartISO,
          percent,
          bias,
          idempotencyKey: randomUUID(),
        }
      );
      jobs.push(job);
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${jobs.length} inspection generation job(s) for background processing`,
      jobIds: jobs,
      orgsQueued: orgs.length,
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

