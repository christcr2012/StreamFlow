/**
 * Vendor Integration Settings API
 * 
 * GET /api/settings/vendors - List all vendor configurations
 * POST /api/settings/vendors - Save vendor credentials
 * DELETE /api/settings/vendors/:vendor - Remove vendor configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { settingsJson: true },
    });

    if (!org || !org.settingsJson) {
      return NextResponse.json({ vendors: [] });
    }

    const settings = typeof org.settingsJson === 'string' 
      ? JSON.parse(org.settingsJson) 
      : org.settingsJson;

    const vendors = settings.vendors || {};

    // Return vendor configs without exposing sensitive credentials
    const sanitizedVendors = Object.entries(vendors).map(([vendor, config]: [string, any]) => ({
      vendor,
      enabled: config.enabled || false,
      lastSyncAt: config.lastSyncAt,
      syncFrequency: config.syncFrequency || 'manual',
      hasCredentials: !!config.credentials,
      credentialFields: getCredentialFields(vendor),
    }));

    return NextResponse.json({ vendors: sanitizedVendors });
  } catch (error) {
    console.error('[vendors-api] Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vendor, enabled, credentials, syncFrequency } = body;

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor is required' }, { status: 400 });
    }

    // Validate vendor type
    const validVendors = ['samsara', 'geotab', 'paylocity', 'holman'];
    if (!validVendors.includes(vendor)) {
      return NextResponse.json({ error: 'Invalid vendor' }, { status: 400 });
    }

    // Get current settings
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { settingsJson: true },
    });

    const settings = org?.settingsJson 
      ? (typeof org.settingsJson === 'string' ? JSON.parse(org.settingsJson) : org.settingsJson)
      : {};

    if (!settings.vendors) {
      settings.vendors = {};
    }

    // Update vendor configuration
    settings.vendors[vendor] = {
      vendor,
      enabled: enabled !== undefined ? enabled : true,
      credentials: credentials || settings.vendors[vendor]?.credentials || {},
      syncFrequency: syncFrequency || 'manual',
      updatedAt: new Date().toISOString(),
      lastSyncAt: settings.vendors[vendor]?.lastSyncAt,
    };

    // Save to database
    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        settingsJson: settings,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'system',
        entityType: 'vendor_integration',
        entityId: vendor,
        action: enabled ? 'enabled' : 'updated',
        meta: JSON.stringify({
          vendor,
          syncFrequency,
          hasCredentials: !!credentials,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${vendor} configuration saved successfully`,
      vendor: {
        vendor,
        enabled: settings.vendors[vendor].enabled,
        syncFrequency: settings.vendors[vendor].syncFrequency,
      },
    });
  } catch (error) {
    console.error('[vendors-api] Error saving vendor config:', error);
    return NextResponse.json(
      { error: 'Failed to save vendor configuration' },
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

    const { searchParams } = new URL(request.url);
    const vendor = searchParams.get('vendor');

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor is required' }, { status: 400 });
    }

    // Get current settings
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { settingsJson: true },
    });

    if (!org || !org.settingsJson) {
      return NextResponse.json({ error: 'No vendor configurations found' }, { status: 404 });
    }

    const settings = typeof org.settingsJson === 'string' 
      ? JSON.parse(org.settingsJson) 
      : org.settingsJson;

    if (!settings.vendors || !settings.vendors[vendor]) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Remove vendor configuration
    delete settings.vendors[vendor];

    // Save to database
    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        settingsJson: settings,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'system',
        entityType: 'vendor_integration',
        entityId: vendor,
        action: 'removed',
        meta: JSON.stringify({ vendor }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${vendor} configuration removed successfully`,
    });
  } catch (error) {
    console.error('[vendors-api] Error removing vendor config:', error);
    return NextResponse.json(
      { error: 'Failed to remove vendor configuration' },
      { status: 500 }
    );
  }
}

function getCredentialFields(vendor: string): string[] {
  switch (vendor) {
    case 'samsara':
      return ['apiKey', 'groupId'];
    case 'geotab':
      return ['username', 'password', 'database', 'server'];
    case 'paylocity':
      return ['clientId', 'clientSecret', 'companyId'];
    case 'holman':
      return ['apiKey', 'clientId'];
    default:
      return [];
  }
}

