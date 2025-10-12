import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// GET /api/provider/custom-fields - List custom field definitions
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const where: any = { orgId: user.orgId };
    if (entityType) {
      where.entityType = entityType;
    }

    const fields = await prisma.customFieldDefinition.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/custom-fields - Create custom field definition
export async function POST(request: NextRequest) {
  try {
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
      entityType,
      fieldName,
      displayName,
      fieldType,
      options,
      required,
      defaultValue,
      validation,
      order,
    } = await request.json();

    if (!entityType || !fieldName || !displayName || !fieldType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const field = await prisma.customFieldDefinition.create({
      data: {
        orgId: user.orgId,
        entityType,
        fieldName,
        displayName,
        fieldType,
        options,
        required: required || false,
        defaultValue,
        validation,
        order: order || 0,
      },
    });

    return NextResponse.json({ field });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Field name already exists for this entity type' }, { status: 400 });
    }
    console.error('Error creating custom field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

