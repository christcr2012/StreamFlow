/**
 * Theme Settings API
 * 
 * GET /api/settings/theme - Get organization theme settings
 * POST /api/settings/theme - Update organization theme settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@cortiware/auth-service';
import { createErrorResponse } from '@cortiware/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/theme
 * 
 * Returns the current organization's theme settings
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get org context
    const auth = await requireAuth({ request, prismaClient: prisma });
    
    if (!auth.orgId) {
      return createErrorResponse('unauthorized', 'Organization context required');
    }

    // Fetch organization with theme settings
    const org = await prisma.org.findUnique({
      where: { id: auth.orgId },
      select: {
        id: true,
        name: true,
        themeSettings: true,
      } as any, // Type assertion: themeSettings will exist after migration
    });

    if (!org) {
      return createErrorResponse('not_found', 'Organization not found');
    }

    return NextResponse.json({
      success: true,
      data: {
        orgId: org.id,
        orgName: org.name,
        themeSettings: (org as any).themeSettings,
      },
    });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return createErrorResponse(error);
  }
}

/**
 * POST /api/settings/theme
 * 
 * Updates the organization's theme settings
 * 
 * Body: {
 *   variant: 'premium-dark' | 'premium-light',
 *   primaryColor: string (hex color),
 *   accentColor: string (hex color)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and get org context
    const auth = await requireAuth({ request, prismaClient: prisma });
    
    if (!auth.orgId) {
      return createErrorResponse('unauthorized', 'Organization context required');
    }

    // Only tenant owners can update theme settings
    if (auth.role !== 'tenant') {
      return createErrorResponse('forbidden', 'Only organization owners can update theme settings');
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

    // Update organization theme settings
    const updatedOrg = await prisma.org.update({
      where: { id: auth.orgId },
      data: {
        themeSettings: {
          variant,
          primaryColor,
          accentColor,
        } as any, // Type assertion: themeSettings will exist after migration
      },
      select: {
        id: true,
        name: true,
        themeSettings: true,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Theme settings updated successfully',
      data: {
        orgId: updatedOrg.id,
        orgName: updatedOrg.name,
        themeSettings: (updatedOrg as any).themeSettings,
      },
    });
  } catch (error) {
    console.error('Error updating theme settings:', error);
    return createErrorResponse(error);
  }
}

