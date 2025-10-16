/**
 * Cleaning Schedules Expansion API
 * 
 * POST /api/cleaning/schedules/expand - Expand RRULE schedules into work orders
 * 
 * This endpoint is designed to be called by a cron job (every 15 minutes)
 * to expand recurring cleaning contracts into individual work orders.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { RRule } from 'rrule';

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    // Allow both authenticated users and cron jobs
    // Cron jobs should use a special auth header
    const cronSecret = request.headers.get('x-cron-secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;
    
    if (!authContext.isAuthenticated && !isValidCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get expansion window from request or use default (next 7 days)
    const body = await request.json().catch(() => ({}));
    const daysAhead = body.daysAhead || 7;
    
    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Find all active contracts with recurrence rules
    const contracts = await prisma.cleaningContract.findMany({
      where: {
        status: 'ACTIVE',
        recurrenceRule: { not: null },
        startDate: { lte: endDate },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        estimate: {
          select: {
            lead: {
              select: {
                contactName: true,
                address: true,
                city: true,
                state: true,
                zip: true
              }
            }
          }
        }
      }
    });

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contract of contracts) {
      try {
        // Parse RRULE
        const rrule = RRule.fromString(contract.recurrenceRule!);
        
        // Get occurrences in the window
        const occurrences = rrule.between(now, endDate, true);

        for (const occurrence of occurrences) {
          // Check if work order already exists for this date
          const existing = await prisma.cleaningWorkOrder.findFirst({
            where: {
              contractId: contract.id,
              scheduledDate: occurrence
            }
          });

          if (existing) {
            skipped++;
            continue;
          }

          // Generate unique public ID
          const publicId = `WO-${contract.id.slice(0, 8)}-${occurrence.getTime()}`;

          // Calculate scheduled start/end times (default 8 AM - 5 PM)
          const scheduledStart = new Date(occurrence);
          scheduledStart.setHours(8, 0, 0, 0);
          
          const scheduledEnd = new Date(occurrence);
          scheduledEnd.setHours(17, 0, 0, 0);

          // Create work order
          await prisma.cleaningWorkOrder.create({
            data: {
              orgId: contract.orgId,
              contractId: contract.id,
              publicId,
              siteAddress: contract.siteAddress,
              spaceType: contract.spaceType,
              squareFeet: contract.squareFeet,
              scheduledDate: occurrence,
              scheduledStart,
              scheduledEnd,
              status: 'SCHEDULED'
            }
          });

          created++;
        }
      } catch (error) {
        console.error(`Error expanding contract ${contract.id}:`, error);
        errors.push(`Contract ${contract.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        contractsProcessed: contracts.length,
        workOrdersCreated: created,
        workOrdersSkipped: skipped,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error expanding schedules:', error);
    return NextResponse.json(
      { error: 'Failed to expand schedules' },
      { status: 500 }
    );
  }
}

