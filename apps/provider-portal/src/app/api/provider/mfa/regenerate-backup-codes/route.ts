import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);

    // Check if MFA is enabled
    const user = await prisma.user.findUnique({
      where: { email },
      select: { totpEnabled: true },
    });

    if (!user || !user.totpEnabled) {
      return NextResponse.json({ error: 'MFA not enabled' }, { status: 400 });
    }

    // Generate new backup codes
    const backupCodes: string[] = [];
    const hashedBackupCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
      const hash = await bcrypt.hash(code, 10);
      hashedBackupCodes.push(hash);
    }

    // Update backup codes
    await prisma.user.update({
      where: { email },
      data: {
        backupCodesHash: JSON.stringify(hashedBackupCodes),
      },
    });

    return NextResponse.json({ backupCodes });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

