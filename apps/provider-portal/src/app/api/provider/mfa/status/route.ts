import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);

    // For environment-based providers, check if they have a database record
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        totpEnabled: true,
        totpSecret: true,
      },
    });

    // If no database record, MFA is not enabled
    if (!user) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: user.totpEnabled,
      hasSecret: !!user.totpSecret,
    });
  } catch (error) {
    console.error('MFA status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

