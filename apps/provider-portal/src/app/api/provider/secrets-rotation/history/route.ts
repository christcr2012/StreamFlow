import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// GET /api/provider/secrets-rotation/history - List rotation history
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

    const history = await prisma.secretsRotationHistory.findMany({
      where: { orgId: user.orgId },
      orderBy: { rotatedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching rotation history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

