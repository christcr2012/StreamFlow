import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);

    // Generate TOTP secret
    const secret = authenticator.generateSecret();

    // Find or create user record
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user record for environment-based provider
      // We need an orgId - for providers, we'll use a special provider org
      let providerOrg = await prisma.org.findFirst({
        where: { name: 'Provider Organization' },
      });

      if (!providerOrg) {
        providerOrg = await prisma.org.create({
          data: {
            name: 'Provider Organization',
          },
        });
      }

      user = await prisma.user.create({
        data: {
          email,
          orgId: providerOrg.id,
          name: 'Provider',
          role: 'OWNER',
          totpSecret: secret,
          totpEnabled: false,
        },
      });
    } else {
      // Update existing user with new secret (enrollment in progress)
      user = await prisma.user.update({
        where: { email },
        data: {
          totpSecret: secret,
          totpEnabled: false, // Not enabled until verified
        },
      });
    }

    return NextResponse.json({ secret });
  } catch (error) {
    console.error('MFA enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

