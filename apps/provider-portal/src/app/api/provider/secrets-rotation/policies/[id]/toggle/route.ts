import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// POST /api/provider/secrets-rotation/policies/[id]/toggle - Toggle policy enabled status
export async function POST(
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

    const { enabled } = await request.json();

    const policy = await prisma.secretsRotationPolicy.update({
      where: { id, orgId: user.orgId },
      data: { enabled },
    });

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error toggling rotation policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

