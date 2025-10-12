import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// PUT /api/provider/custom-fields/[id] - Update custom field definition
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
      displayName,
      fieldType,
      options,
      required,
      defaultValue,
      validation,
      order,
      enabled,
    } = await request.json();

    const field = await prisma.customFieldDefinition.update({
      where: { id, orgId: user.orgId },
      data: {
        displayName,
        fieldType,
        options,
        required,
        defaultValue,
        validation,
        order,
        enabled,
      },
    });

    return NextResponse.json({ field });
  } catch (error) {
    console.error('Error updating custom field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/provider/custom-fields/[id] - Delete custom field definition
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

    await prisma.customFieldDefinition.delete({
      where: { id, orgId: user.orgId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

