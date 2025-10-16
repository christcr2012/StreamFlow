/**
 * Provider Theme Settings API
 * 
 * GET /api/provider/theme - Get provider theme settings
 * POST /api/provider/theme - Update provider theme settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProviderSession } from '@cortiware/auth-service';
import { createErrorResponse } from '@cortiware/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/provider/theme
 * 
 * Returns the provider's theme settings from ProviderConfig
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
        themeSettings: true,
      } as any, // Type assertion: themeSettings will exist after migration
    });

    // If no config exists, return default theme
    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          themeSettings: {
            variant: 'premium-dark',
            primaryColor: '#00ff88',
            accentColor: '#3aa8ff',
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        themeSettings: (config as any).themeSettings,
      },
    });
  } catch (error) {
    console.error('Error fetching provider theme settings:', error);
    return createErrorResponse(error);
  }
}

/**
 * POST /api/provider/theme
 * 
 * Updates the provider's theme settings
 * 
 * Body: {
 *   variant: 'premium-dark' | 'premium-light',
 *   primaryColor: string (hex color),
 *   accentColor: string (hex color)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate provider
    const session = getProviderSession(request);
    
    if (!session) {
      return createErrorResponse('unauthorized', 'Provider authentication required');
    }

    // Parse request body
    const body = await request.json();
    const { variant, primaryColor, accentColor } = body;

    // Validate theme settings
    if (!variant || !primaryColor || !accentColor) {
      return createErrorResponse('validation', 'Missing required fields: variant, primaryColor, accentColor');
    }

    // Validate variant
    if (!['premium-dark', 'premium-light'].includes(variant)) {
      return createErrorResponse('validation', 'Invalid variant. Must be "premium-dark" or "premium-light"');
    }

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(primaryColor)) {
      return createErrorResponse('validation', 'Invalid primaryColor. Must be a valid hex color (e.g., #00ff88)');
    }
    if (!hexColorRegex.test(accentColor)) {
      return createErrorResponse('validation', 'Invalid accentColor. Must be a valid hex color (e.g., #3aa8ff)');
    }

    // Get or create provider config
    let config: any = await prisma.providerConfig.findFirst();

    if (!config) {
      // Create new config with theme settings
      config = await prisma.providerConfig.create({
        data: {
          themeSettings: {
            variant,
            primaryColor,
            accentColor,
          }
        } as any,
        select: {
          id: true,
          themeSettings: true,
        } as any,
      });
    } else {
      // Update existing config
      config = await prisma.providerConfig.update({
        where: { id: config.id },
        data: {
          themeSettings: {
            variant,
            primaryColor,
            accentColor,
          }
        } as any,
        select: {
          id: true,
          themeSettings: true,
        } as any,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Provider theme settings updated successfully',
      data: {
        themeSettings: (config as any).themeSettings,
      },
    });
  } catch (error) {
    console.error('Error updating provider theme settings:', error);
    return createErrorResponse(error);
  }
}

