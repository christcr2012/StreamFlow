import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// GET /api/provider/secrets-rotation/policies - List all rotation policies
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

    const policies = await prisma.secretsRotationPolicy.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error fetching rotation policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/secrets-rotation/policies - Create a new rotation policy
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
      name,
      keyType,
      rotationIntervalDays,
      gracePeriodDays,
      autoRotate,
      notifyBeforeDays,
    } = await request.json();

    if (!name || !keyType || !rotationIntervalDays || gracePeriodDays === undefined || notifyBeforeDays === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate next rotation date
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + rotationIntervalDays);

    const policy = await prisma.secretsRotationPolicy.create({
      data: {
        orgId: user.orgId,
        name,
        keyType,
        rotationIntervalDays,
        gracePeriodDays,
        autoRotate,
        notifyBeforeDays,
        nextRotation,
      },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error creating rotation policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

