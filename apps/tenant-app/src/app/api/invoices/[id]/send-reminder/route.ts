import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify invoice ownership
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        orgId: authContext.orgId,
      },
      include: {
        customer: {
          select: {
            company: true,
            primaryName: true,
            primaryEmail: true,
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

    // Determine reminder type based on due date
    const now = new Date();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    let reminderType = 'overdue_general';

    if (dueDate) {
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPastDue >= 14) {
        reminderType = 'overdue_14days';
      } else if (daysPastDue >= 7) {
        reminderType = 'overdue_7days';
      } else if (daysPastDue >= 3) {
        reminderType = 'overdue_3days';
      }
    }

    // Create reminder record
    const reminder = await prisma.invoiceReminder.create({
      data: {
        invoiceId: invoice.id,
        reminderType,
        status: 'pending',
      },
    });

    // Send reminder email
    try {
      const emailResult = await sendEmail(authContext.orgId, {
        to: invoice.customer.primaryEmail,
        subject: `Payment Reminder: Invoice ${invoice.number || invoice.id}`,
        text: `Dear ${invoice.customer.company || invoice.customer.primaryName},\n\nThis is a friendly reminder that invoice ${invoice.number || invoice.id} is overdue.\n\nAmount Due: $${Number(invoice.amount).toFixed(2)}\nDue Date: ${dueDate?.toLocaleDateString() || 'N/A'}\n\nPlease submit payment at your earliest convenience.\n\nThank you,\nYour Team`,
        html: `<p>Dear ${invoice.customer.company || invoice.customer.primaryName},</p><p>This is a friendly reminder that invoice <strong>${invoice.number || invoice.id}</strong> is overdue.</p><p><strong>Amount Due:</strong> $${Number(invoice.amount).toFixed(2)}<br><strong>Due Date:</strong> ${dueDate?.toLocaleDateString() || 'N/A'}</p><p>Please submit payment at your earliest convenience.</p><p>Thank you,<br>Your Team</p>`,
      });

      if (emailResult.success) {
        await prisma.invoiceReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          reminder: {
            ...reminder,
            status: 'sent',
            sentAt: new Date(),
          },
        });
      } else {
        await prisma.invoiceReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'failed',
            error: emailResult.error || 'Unknown error',
          },
        });

        return NextResponse.json({
          error: 'Failed to send reminder email',
          details: emailResult.error,
        }, { status: 500 });
      }
    } catch (emailError: any) {
      await prisma.invoiceReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'failed',
          error: emailError.message || 'Unknown error',
        },
      });

      return NextResponse.json({
        error: 'Failed to send reminder email',
        details: emailError.message,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending invoice reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

