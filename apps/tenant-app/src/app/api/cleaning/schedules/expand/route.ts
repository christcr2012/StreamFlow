/**
 * Cleaning Schedules Expansion API
 *
 * POST /api/cleaning/schedules/expand - Expand RRULE schedules into work orders
 *
 * This endpoint is designed to be called by a cron job (every 15 minutes)
 * to expand recurring cleaning contracts into individual work orders.
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
    // Cron jobs should use a special auth header
    const cronSecret = request.headers.get('x-cron-secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;

    if (!authContext.isAuthenticated && !isValidCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get expansion window from request or use default (next 7 days)
    const body = await request.json().catch(() => ({}));
    const horizonDays = body.daysAhead || 7;
    const contractId = body.contractId; // Optional: expand specific contract

    // Get all unique orgIds that have active contracts
    const orgs = await prisma.cleaningContract.findMany({
      where: {
        status: 'ACTIVE',
        recurrenceRule: { not: null },
        ...(contractId && { id: contractId }),
      },
      select: { orgId: true },
      distinct: ['orgId'],
    });

    // Enqueue a schedule expansion job for each org
    const jobs = [];
    for (const org of orgs) {
      const job = await enqueue(
        QUEUE_NAMES.SCHEDULE,
        'schedule.expand',
        {
          orgId: org.orgId,
          contractId,
          horizonDays,
          idempotencyKey: randomUUID(),
        }
      );
      jobs.push(job);
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${jobs.length} schedule expansion job(s) for background processing`,
      jobIds: jobs,
      orgsQueued: orgs.length,
    });
  } catch (error) {
    console.error('Error expanding schedules:', error);
    return NextResponse.json(
      { error: 'Failed to expand schedules' },
      { status: 500 }
    );
  }
}

