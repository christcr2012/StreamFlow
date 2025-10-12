import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// PUT /api/provider/secrets-rotation/policies/[id] - Update a rotation policy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      name,
      keyType,
      rotationIntervalDays,
      gracePeriodDays,
      autoRotate,
      notifyBeforeDays,
    } = await request.json();

    const policy = await prisma.secretsRotationPolicy.update({
      where: { id, orgId: user.orgId },
      data: {
        name,
        keyType,
        rotationIntervalDays,
        gracePeriodDays,
        autoRotate,
        notifyBeforeDays,
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error updating rotation policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/provider/secrets-rotation/policies/[id] - Delete a rotation policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.secretsRotationPolicy.delete({
      where: { id, orgId: user.orgId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rotation policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

