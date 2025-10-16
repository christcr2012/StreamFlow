import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProviderSession } from '@/lib/api/auth';
import { createErrorResponse } from '@/lib/api/response';

/**
 * GET /api/provider/settings
 * 
 * Returns the provider's general settings from ProviderConfig
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate provider
    const session = getProviderSession(request);
    
    if (!session) {
      return createErrorResponse('unauthorized', 'Provider authentication required');
    }

    // Fetch provider config (there should only be one row)
    const config = await prisma.providerConfig.findFirst({
      select: {
        id: true,
        providerName: true,
        contactEmail: true,
        supportUrl: true,
        notificationSettings: true,
        securitySettings: true,
        integrationSettings: true,
      } as any,
    });

    // If no config exists, return defaults
    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          providerName: 'Cortiware Provider',
          contactEmail: 'provider@cortiware.com',
          supportUrl: 'https://support.cortiware.com',
          notificationSettings: {
            emailAlerts: true,
            slackNotifications: false,
            weeklyReports: true,
            monthlyReports: true,
          },
          securitySettings: {
            twoFactorEnabled: false,
            sessionTimeoutMinutes: 30,
            ipWhitelist: [],
          },
          integrationSettings: {
            stripeConfigured: false,
            samGovConfigured: false,
            apiRateLimit: 1000,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        providerName: (config as any).providerName || 'Cortiware Provider',
        contactEmail: (config as any).contactEmail || 'provider@cortiware.com',
        supportUrl: (config as any).supportUrl || 'https://support.cortiware.com',
        notificationSettings: (config as any).notificationSettings || {
          emailAlerts: true,
          slackNotifications: false,
          weeklyReports: true,
          monthlyReports: true,
        },
        securitySettings: (config as any).securitySettings || {
          twoFactorEnabled: false,
          sessionTimeoutMinutes: 30,
          ipWhitelist: [],
        },
        integrationSettings: (config as any).integrationSettings || {
          stripeConfigured: false,
          samGovConfigured: false,
          apiRateLimit: 1000,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching provider settings:', error);
    return createErrorResponse('internal_error', 'Failed to fetch provider settings');
  }
}

/**
 * POST /api/provider/settings
 * 
 * Updates the provider's general settings
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate provider
    const session = getProviderSession(request);
    
    if (!session) {
      return createErrorResponse('unauthorized', 'Provider authentication required');
    }

    const body = await request.json();
    const {
      providerName,
      contactEmail,
      supportUrl,
      notificationSettings,
      securitySettings,
      integrationSettings,
    } = body;

    // Validate inputs
    if (providerName && typeof providerName !== 'string') {
      return createErrorResponse('validation_error', 'Provider name must be a string');
    }

    if (contactEmail && typeof contactEmail !== 'string') {
      return createErrorResponse('validation_error', 'Contact email must be a string');
    }

    if (supportUrl && typeof supportUrl !== 'string') {
      return createErrorResponse('validation_error', 'Support URL must be a string');
    }

    // Get or create provider config
    let config: any = await prisma.providerConfig.findFirst();

    const updateData: any = {};
    
    if (providerName !== undefined) updateData.providerName = providerName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (supportUrl !== undefined) updateData.supportUrl = supportUrl;
    if (notificationSettings !== undefined) updateData.notificationSettings = notificationSettings;
    if (securitySettings !== undefined) updateData.securitySettings = securitySettings;
    if (integrationSettings !== undefined) updateData.integrationSettings = integrationSettings;

    if (!config) {
      // Create new config
      config = await prisma.providerConfig.create({
        data: updateData as any,
        select: {
          id: true,
          providerName: true,
          contactEmail: true,
          supportUrl: true,
          notificationSettings: true,
          securitySettings: true,
          integrationSettings: true,
        } as any,
      });
    } else {
      // Update existing config
      config = await prisma.providerConfig.update({
        where: { id: config.id },
        data: updateData as any,
        select: {
          id: true,
          providerName: true,
          contactEmail: true,
          supportUrl: true,
          notificationSettings: true,
          securitySettings: true,
          integrationSettings: true,
        } as any,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Provider settings updated successfully',
      data: {
        providerName: (config as any).providerName,
        contactEmail: (config as any).contactEmail,
        supportUrl: (config as any).supportUrl,
        notificationSettings: (config as any).notificationSettings,
        securitySettings: (config as any).securitySettings,
        integrationSettings: (config as any).integrationSettings,
      },
    });
  } catch (error) {
    console.error('Error updating provider settings:', error);
    return createErrorResponse('internal_error', 'Failed to update provider settings');
  }
}

