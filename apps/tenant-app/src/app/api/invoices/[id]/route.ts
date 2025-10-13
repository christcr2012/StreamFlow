import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { UpdateInvoiceSchema } from '@/lib/validations/invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, orgId: authContext.orgId! },
      include: {
        customer: true,
        lineItems: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const data = UpdateInvoiceSchema.parse(body);

    // Recalculate totals if lines are updated
    let updateData: any = {
      customerId: data.customerId,
      jobId: data.jobId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      terms: data.terms,
      notes: data.notes,
    };

    if (data.lines) {
      const subtotal = data.lines.reduce((sum, line) => {
        return sum + (line.quantity * line.unitPrice);
      }, 0);

      const taxAmount = data.taxAmount || 0;
      const discountAmount = data.discountAmount || 0;
      const total = subtotal + taxAmount - discountAmount;

      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        discountAmount,
        amount: total,
        lineItems: {
          deleteMany: {},
          create: data.lines.map(line => ({
            description: line.description,
            lineType: 'one_time',
            quantity: line.quantity,
            unitPriceCents: Math.round(line.unitPrice * 100),
            amountCents: Math.round(line.quantity * line.unitPrice * 100),
          })),
        },
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id, orgId: authContext.orgId! },
      data: updateData,
      include: {
        customer: true,
        lineItems: true,
        payments: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('PATCH /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only allow deletion of draft invoices
    const invoice = await prisma.invoice.findFirst({
      where: { id, orgId: authContext.orgId! },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted' },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id, orgId: authContext.orgId! },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

