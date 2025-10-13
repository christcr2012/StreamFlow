import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { UpdateCustomerSchema } from '@/lib/validations/customer';

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

    const customer = await prisma.customer.findFirst({
      where: { id, orgId: authContext.orgId! },
      include: {
        contacts: true,
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { jobs: true, invoices: true, agreements: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('GET /api/customers/[id] error:', error);
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
    const data = UpdateCustomerSchema.parse(body);

    const { contacts, ...customerData } = data;

    const customer = await prisma.customer.update({
      where: { id, orgId: authContext.orgId! },
      data: {
        company: customerData.company,
        primaryName: customerData.primaryName,
        primaryEmail: customerData.primaryEmail,
        primaryPhone: customerData.primaryPhone,
        notes: customerData.notes,
        tags: customerData.tags,
        billingSettings: customerData.billingSettings as any,
        contacts: contacts ? {
          deleteMany: {},
          create: contacts,
        } : undefined,
      },
      include: {
        contacts: true,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('PATCH /api/customers/[id] error:', error);
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

    await prisma.customer.delete({
      where: { id, orgId: authContext.orgId! },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

