import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRecurringInvoiceSchema = z.object({
  active: z.boolean().optional(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'annually']).optional(),
  intervalCount: z.number().int().min(1).max(12).optional(),
  endDate: z.string().optional(),
  items: z.array(z.any()).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateRecurringInvoiceSchema.parse(body);

    // Verify ownership
    const existing = await prisma.recurringInvoice.findUnique({
      where: { id },
    });

    if (!existing || existing.orgId !== authContext.orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const recurringInvoice = await prisma.recurringInvoice.update({
      where: { id },
      data: {
        ...data,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    return NextResponse.json(recurringInvoice);
  } catch (error) {
    console.error('Error updating recurring invoice:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.recurringInvoice.findUnique({
      where: { id },
    });

    if (!existing || existing.orgId !== authContext.orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.recurringInvoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

