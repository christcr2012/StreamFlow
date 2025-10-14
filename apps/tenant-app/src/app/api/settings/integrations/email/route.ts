import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Simple encryption for API keys (in production, use proper encryption library)
// For now, we'll store them as-is but mark them as sensitive
// TODO: Implement proper encryption using crypto library

const emailConfigSchema = z.object({
  provider: z.enum(['sendgrid', 'resend']),
  apiKey: z.string().min(1, 'API key is required'),
  fromAddress: z.string().email('Invalid email address'),
  fromName: z.string().min(1, 'From name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = emailConfigSchema.parse(body);

    // Verify the org exists
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Test the email configuration before saving
    const testResult = await testEmailConfiguration(validated.provider, validated.apiKey);
    
    if (!testResult.success) {
      return NextResponse.json(
        { error: `Email configuration test failed: ${testResult.error}` },
        { status: 400 }
      );
    }

    // Save the configuration
    // TODO: Encrypt the API key before storing
    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        emailProvider: validated.provider,
        emailApiKey: validated.apiKey, // TODO: Encrypt this
        emailFromAddress: validated.fromAddress,
        emailFromName: validated.fromName,
        emailConfigured: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email configuration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save email configuration' },
      { status: 500 }
    );
  }
}

// Test email configuration by attempting to send a test email
async function testEmailConfiguration(provider: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (provider === 'sendgrid') {
      // Test SendGrid API key by making a simple API call
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return { success: false, error: 'Invalid SendGrid API key' };
      }
    } else if (provider === 'resend') {
      // Test Resend API key by making a simple API call
      const response = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return { success: false, error: 'Invalid Resend API key' };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test email configuration',
    };
  }
}

