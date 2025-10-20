/**
 * Cleaning Billing - Generate Invoices API
 *
 * POST /api/cleaning/billing/generate-invoices - Generate invoices for completed work orders
 *
 * This endpoint is designed to be called by a cron job (nightly)
 * to generate invoices for completed work orders that haven't been billed yet.
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

    // Get billing date from request or use yesterday
    const body = await request.json().catch(() => ({}));
    const dateISO = body.dateISO || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all unique orgIds that have completed work orders
    const orgs = await prisma.cleaningWorkOrder.findMany({
      where: {
        status: 'COMPLETED',
        actualEnd: { gte: new Date(dateISO) }
      },
      select: { orgId: true },
      distinct: ['orgId'],
    });

    // Enqueue a billing job for each org
    const jobs = [];
    for (const org of orgs) {
      const job = await enqueue(
        QUEUE_NAMES.BILLING,
        'billing.closeDay',
        {
          orgId: org.orgId,
          dateISO,
          idempotencyKey: randomUUID(),
        }
      );
      jobs.push(job.id);
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${jobs.length} billing job(s) for background processing`,
      jobIds: jobs,
      orgsQueued: orgs.length,
      dateISO,
    });
  } catch (error) {
    console.error('Error generating invoices:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoices' },
      { status: 500 }
    );
  }
}

