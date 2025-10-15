import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { CreateInvoiceSchema, InvoiceFilterSchema } from '@/lib/validations/invoice';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const filter = InvoiceFilterSchema.parse(params);

    const where: any = { orgId: authContext.orgId };
    
    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter.from || filter.to) {
      where.issuedAt = {};
      if (filter.from) where.issuedAt.gte = new Date(filter.from);
      if (filter.to) where.issuedAt.lte = new Date(filter.to);
    }

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: { id: true, company: true, primaryName: true },
          },
          lineItems: {
            select: {
              id: true,
              description: true,
              lineType: true,
              quantity: true,
              unitPriceCents: true,
              amountCents: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              receivedAt: true,
              method: true,
            },
            orderBy: { receivedAt: 'desc' },
          },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      items,
      page: filter.page,
      limit: filter.limit,
      total,
      pages: Math.ceil(total / filter.limit),
    });
  } catch (error: any) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = CreateInvoiceSchema.parse(body);

    // Calculate totals
    const subtotal = data.lines.reduce((sum, line) => {
      return sum + (line.quantity * line.unitPrice);
    }, 0);

    const taxAmount = data.taxAmount || 0;
    const discountAmount = data.discountAmount || 0;
    const total = subtotal + taxAmount - discountAmount;

    const invoice = await prisma.invoice.create({
      data: {
        orgId: authContext.orgId!,
        customerId: data.customerId,
        jobId: data.jobId,
        number: `INV-${nanoid(8).toUpperCase()}`,
        subtotal,
        taxAmount,
        discountAmount,
        amount: total,
        status: 'draft',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        terms: data.terms,
        notes: data.notes,
        lineItems: {
          create: data.lines.map(line => ({
            description: line.description,
            lineType: 'one_time',
            quantity: line.quantity,
            unitPriceCents: Math.round(line.unitPrice * 100),
            amountCents: Math.round(line.quantity * line.unitPrice * 100),
          })),
        },
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    return NextResponse.json({ id: invoice.id, invoice }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

