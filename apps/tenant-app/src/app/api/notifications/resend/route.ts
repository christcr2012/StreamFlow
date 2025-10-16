import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { z } from 'zod';

const resendEmailSchema = z.object({
  entityType: z.enum(['invoice', 'job', 'payment']),
  entityId: z.string().cuid(),
});

/**
 * POST /api/notifications/resend
 *
 * Resend email notification for an entity (invoice, job, payment)
 *
 * Request body:
 * - entityType: Type of entity (invoice, job, payment)
 * - entityId: ID of the entity to resend notification for
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = resendEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { entityType, entityId } = validation.data;

    // Load entity data and resend email based on type
    if (entityType === 'invoice') {
      const invoice = await prisma.invoice.findUnique({
        where: { id: entityId, orgId: authContext.orgId },
        include: {
          customer: {
            select: {
              primaryEmail: true,
              company: true,
              primaryName: true,
            },
          },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      if (!invoice.customer?.primaryEmail) {
        return NextResponse.json({ error: 'Customer has no email address' }, { status: 400 });
      }

      // Send invoice email
      const result = await sendEmail(authContext.orgId, {
        to: invoice.customer.primaryEmail,
        subject: `Invoice ${invoice.number || 'DRAFT'} from ${invoice.customer.company || 'Your Company'}`,
        html: `
          <p>Dear ${invoice.customer.company || invoice.customer.primaryName || 'Customer'},</p>
          <p>Your invoice <strong>${invoice.number || 'DRAFT'}</strong> for <strong>$${(Number(invoice.amount) / 100).toFixed(2)}</strong> is ready.</p>
          <p>Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
          <p>Thank you for your business!</p>
        `,
        text: `
Dear ${invoice.customer.company || invoice.customer.primaryName || 'Customer'},

Your invoice ${invoice.number || 'DRAFT'} for $${(Number(invoice.amount) / 100).toFixed(2)} is ready.

Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}

Thank you for your business!
        `.trim(),
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Invoice email resent successfully',
        messageId: result.messageId,
      });
    }

    if (entityType === 'job') {
      const job = await prisma.job.findUnique({
        where: { id: entityId, orgId: authContext.orgId },
        include: {
          customer: {
            select: {
              primaryEmail: true,
              company: true,
              primaryName: true,
            },
          },
        },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      if (!job.customer?.primaryEmail) {
        return NextResponse.json({ error: 'Customer has no email address' }, { status: 400 });
      }

      // Send job status email
      const result = await sendEmail(authContext.orgId, {
        to: job.customer.primaryEmail,
        subject: `Job Status Update: ${job.title}`,
        html: `
          <p>Dear ${job.customer.company || job.customer.primaryName || 'Customer'},</p>
          <p>The status of your job <strong>${job.title}</strong> is <strong>${job.status}</strong>.</p>
          <p>Scheduled Date: ${job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : 'TBD'}</p>
          <p>We will keep you informed of any further updates.</p>
        `,
        text: `
Dear ${job.customer.company || job.customer.primaryName || 'Customer'},

The status of your job ${job.title} is ${job.status}.

Scheduled Date: ${job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : 'TBD'}

We will keep you informed of any further updates.
        `.trim(),
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Job status email resent successfully',
        messageId: result.messageId,
      });
    }

    return NextResponse.json({ error: 'Unsupported entity type' }, { status: 400 });
  } catch (error) {
    console.error('Error resending email:', error);
    return NextResponse.json(
      { error: 'Failed to resend email' },
      { status: 500 }
    );
  }
}

