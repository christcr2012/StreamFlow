import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { testSMSConfiguration } from '@/lib/sms-service';
import { z } from 'zod';

const smsConfigSchema = z.object({
  provider: z.literal('twilio'),
  apiKey: z.string().min(1, 'API key is required'),
  fromNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = smsConfigSchema.parse(body);

    // Verify the org exists
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Test the SMS configuration before saving
    const testResult = await testSMSConfiguration(
      validated.provider,
      validated.apiKey,
      validated.fromNumber
    );

    if (!testResult.success) {
      return NextResponse.json({ error: testResult.error }, { status: 400 });
    }

    // Save the configuration with encrypted API key
    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        smsProvider: validated.provider,
        smsApiKey: encrypt(validated.apiKey),
        smsFromNumber: validated.fromNumber,
        smsConfigured: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving SMS configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save SMS configuration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: {
        smsProvider: true,
        smsFromNumber: true,
        smsConfigured: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      provider: org.smsProvider,
      fromNumber: org.smsFromNumber,
      configured: org.smsConfigured,
    });
  } catch (error) {
    console.error('Error fetching SMS configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        smsProvider: null,
        smsApiKey: null,
        smsFromNumber: null,
        smsConfigured: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SMS configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete SMS configuration' },
      { status: 500 }
    );
  }
}

