import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);

    // Disable MFA
    await prisma.user.update({
      where: { email },
      data: {
        totpEnabled: false,
        totpSecret: null,
        backupCodesHash: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MFA disable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

