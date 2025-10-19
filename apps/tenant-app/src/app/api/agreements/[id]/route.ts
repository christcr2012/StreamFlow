import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { UpdateAgreementSchema } from '@/lib/validations/agreement';

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

    // PERFORMANCE: Optimize query with select for related data
    const agreement = await prisma.agreement.findFirst({
      where: { id, orgId: authContext.orgId! },
      include: { Customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryEmail: true,
            primaryPhone: true,
          },
        },
        AgreementTemplate: {
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
      },
    });

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    return NextResponse.json(agreement);
  } catch (error: any) {
    console.error('GET /api/agreements/[id] error:', error);
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
    const data = UpdateAgreementSchema.parse(body);

    const agreement = await prisma.agreement.update({
      where: { id, orgId: authContext.orgId! },
      data: {
        status: data.status,
        signedAt: data.signedAt ? new Date(data.signedAt) : undefined,
        signedBy: data.signedBy,
        renewalAt: data.renewalAt ? new Date(data.renewalAt) : undefined,
      },
      include: { Customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryEmail: true,
            primaryPhone: true,
          },
        },
        AgreementTemplate: {
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
      },
    });

    return NextResponse.json(agreement);
  } catch (error: any) {
    console.error('PATCH /api/agreements/[id] error:', error);
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

    // Only allow deletion of draft agreements
    const agreement = await prisma.agreement.findFirst({
      where: { id, orgId: authContext.orgId! },
    });

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    if (agreement.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft agreements can be deleted' },
        { status: 400 }
      );
    }

    await prisma.agreement.delete({
      where: { id, orgId: authContext.orgId! },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /api/agreements/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

