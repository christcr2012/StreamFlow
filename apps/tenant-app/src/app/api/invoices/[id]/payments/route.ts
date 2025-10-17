import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { CreatePaymentSchema } from '@/lib/validations/invoice';
import { broadcastToOrg } from '@/lib/sse';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: invoiceId } = await params;
    const body = await request.json();
    const data = CreatePaymentSchema.parse(body);

    // Verify invoice exists and belongs to org
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, orgId: authContext.orgId! },
      include: { Payment: true,
        Customer: {
          select: { id: true, company: true, primaryName: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate total paid so far
    const totalPaid = invoice.Payment.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remainingAmount = Number(invoice.amount) - totalPaid;

    if (data.amount > remainingAmount) {
      return NextResponse.json(
        { error: `Payment amount exceeds remaining balance of ${remainingAmount}` },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        orgId: authContext.orgId!,
        invoiceId,
        amount: data.amount,
        method: data.method,
        status: 'completed',
        reference: data.reference,
      },
    });

    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + data.amount;
    let updatedInvoice;
    if (newTotalPaid >= Number(invoice.amount)) {
      updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
        include: { Customer: {
            select: { id: true, company: true, primaryName: true },
          },
        },
      });
    } else if (invoice.status === 'draft') {
      // Move to open status on first payment
      updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'open' },
        include: { Customer: {
            select: { id: true, company: true, primaryName: true },
          },
        },
      });
    }

    // Broadcast payment received event
    broadcastToOrg(authContext.orgId!, {
      type: 'payment_received',
      data: {
        invoiceId,
        invoiceNumber: invoice.number,
        paymentAmount: data.amount,
        totalPaid: newTotalPaid,
        invoiceAmount: Number(invoice.amount),
        customer: invoice.Customer,
      },
      timestamp: new Date().toISOString(),
    });

    // Broadcast invoice updated event if status changed
    if (updatedInvoice) {
      broadcastToOrg(authContext.orgId!, {
        type: 'invoice_updated',
        data: {
          id: updatedInvoice.id,
          number: updatedInvoice.number,
          status: updatedInvoice.status,
          customer: updatedInvoice.Customer,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ id: payment.id, payment }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/invoices/[id]/payments error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

