import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRecurringInvoiceSchema = z.object({
  customerId: z.string(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'annually']),
  intervalCount: z.number().int().min(1).max(12).default(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  items: z.array(z.any()),
  terms: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default('USD'),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createRecurringInvoiceSchema.parse(body);

    // Calculate next invoice date based on frequency
    const startDate = new Date(data.startDate);
    let nextInvoiceDate = new Date(startDate);

    switch (data.frequency) {
      case 'weekly':
        nextInvoiceDate.setDate(nextInvoiceDate.getDate() + (7 * data.intervalCount));
        break;
      case 'monthly':
        nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + data.intervalCount);
        break;
      case 'quarterly':
        nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + (3 * data.intervalCount));
        break;
      case 'annually':
        nextInvoiceDate.setFullYear(nextInvoiceDate.getFullYear() + data.intervalCount);
        break;
    }

    const recurringInvoice = await prisma.recurringInvoice.create({
      data: {
        orgId: authContext.orgId,
        customerId: data.customerId,
        frequency: data.frequency,
        intervalCount: data.intervalCount,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextInvoiceDate,
        items: data.items,
        terms: data.terms,
        notes: data.notes,
        currency: data.currency,
        active: true,
      },
    });

    return NextResponse.json(recurringInvoice);
  } catch (error) {
    console.error('Error creating recurring invoice:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recurringInvoices = await prisma.recurringInvoice.findMany({
      where: { orgId: authContext.orgId },
      include: { Customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryEmail: true,
          },
        },
      },
      orderBy: { nextInvoiceDate: 'asc' },
    });

    return NextResponse.json(recurringInvoices);
  } catch (error) {
    console.error('Error fetching recurring invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

