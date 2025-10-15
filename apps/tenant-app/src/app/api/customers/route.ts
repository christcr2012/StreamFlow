import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { CreateCustomerSchema, CustomerFilterSchema } from '@/lib/validations/customer';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const filter = CustomerFilterSchema.parse(params);

    const where: any = { orgId: authContext.orgId };
    
    if (filter.query) {
      where.OR = [
        { company: { contains: filter.query, mode: 'insensitive' } },
        { primaryName: { contains: filter.query, mode: 'insensitive' } },
        { primaryEmail: { contains: filter.query, mode: 'insensitive' } },
      ];
    }

    if (filter.tags && filter.tags.length > 0) {
      where.tags = { hasSome: filter.tags };
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          contacts: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          _count: {
            select: { jobs: true, invoices: true },
          },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      items,
      page: filter.page,
      limit: filter.limit,
      total,
      pages: Math.ceil(total / filter.limit),
    });
  } catch (error: any) {
    const { createSafeErrorResponse } = await import('@/lib/error-handler');
    return createSafeErrorResponse(error, 'GET /api/customers');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = CreateCustomerSchema.parse(body);

    const { contacts, ...customerData } = data;

    const customer = await prisma.customer.create({
      data: {
        company: customerData.company,
        primaryName: customerData.primaryName,
        primaryEmail: customerData.primaryEmail,
        primaryPhone: customerData.primaryPhone,
        notes: customerData.notes,
        tags: customerData.tags,
        billingSettings: customerData.billingSettings as any,
        orgId: authContext.orgId!,
        publicId: `cust_${nanoid(12)}`,
        contacts: contacts && contacts.length > 0 ? {
          create: contacts,
        } : undefined,
      },
      include: {
        contacts: true,
      },
    });

    return NextResponse.json({ id: customer.id, customer }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

