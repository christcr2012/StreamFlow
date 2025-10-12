import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';
import { authenticator } from 'otplib';
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
    const { code, secret } = await request.json();

    if (!code || !secret) {
      return NextResponse.json({ error: 'Missing code or secret' }, { status: 400 });
    }

    // Verify TOTP code
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes: string[] = [];
    const hashedBackupCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
      const hash = await bcrypt.hash(code, 10);
      hashedBackupCodes.push(hash);
    }

    // Enable MFA
    await prisma.user.update({
      where: { email },
      data: {
        totpEnabled: true,
        totpSecret: secret,
        backupCodesHash: JSON.stringify(hashedBackupCodes),
      },
    });

    return NextResponse.json({ 
      success: true,
      backupCodes,
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

