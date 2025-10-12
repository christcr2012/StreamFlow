import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// GET /api/provider/custom-fields/values - Get custom field values for an entity
export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    const values = await prisma.customFieldValue.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        field: true,
      },
    });

    return NextResponse.json({ values });
  } catch (error) {
    console.error('Error fetching custom field values:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/custom-fields/values - Set custom field value
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fieldId, entityType, entityId, value } = await request.json();

    if (!fieldId || !entityType || !entityId || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const fieldValue = await prisma.customFieldValue.upsert({
      where: {
        fieldId_entityId: {
          fieldId,
          entityId,
        },
      },
      create: {
        fieldId,
        entityType,
        entityId,
        value: String(value),
      },
      update: {
        value: String(value),
      },
      include: {
        field: true,
      },
    });

    return NextResponse.json({ value: fieldValue });
  } catch (error) {
    console.error('Error setting custom field value:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

