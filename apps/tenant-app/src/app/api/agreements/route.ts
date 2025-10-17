import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { CreateAgreementSchema, AgreementFilterSchema } from '@/lib/validations/agreement';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const filter = AgreementFilterSchema.parse(params);

    const where: any = { orgId: authContext.orgId };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.customerId) {
      where.customerId = filter.customerId;
    }

    const [items, total] = await Promise.all([
      prisma.agreement.findMany({
        where,
        include: { Customer: {
            select: { id: true, company: true, primaryName: true },
          },
          AgreementTemplate: {
            select: { id: true, name: true },
          },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agreement.count({ where }),
    ]);

    return NextResponse.json({
      items,
      page: filter.page,
      limit: filter.limit,
      total,
      pages: Math.ceil(total / filter.limit),
    });
  } catch (error: any) {
    console.error('GET /api/agreements error:', error);
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
    const data = CreateAgreementSchema.parse(body);

    // Fetch template to generate content
    const template = await prisma.agreementTemplate.findFirst({
      where: { id: data.templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Replace variables in template content
    let content = template.content;
    for (const [key, value] of Object.entries(data.variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const agreement = await prisma.agreement.create({
      data: {
        orgId: authContext.orgId!,
        customerId: data.customerId,
        templateId: data.templateId,
        content,
        variables: data.variables as any,
        status: 'DRAFT',
      },
      include: { Customer: true,
        template: true,
      },
    });

    return NextResponse.json({ id: agreement.id, agreement }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/agreements error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

