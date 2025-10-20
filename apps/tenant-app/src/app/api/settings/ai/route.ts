import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

/**
 * AI Settings API
 * 
 * GET - Retrieve AI feature preferences for the organization
 * POST - Update AI feature preferences
 */

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI settings from org metadata
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { metadata: true },
    });

    const aiSettings = (org?.metadata as any)?.aiFeatures || {};

    return NextResponse.json({
      success: true,
      features: aiSettings,
    });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
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
    const { features } = body;

    if (!features || typeof features !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get current org metadata
    const org = await prisma.org.findUnique({
      where: { id: authContext.orgId },
      select: { metadata: true },
    });

    const currentMetadata = (org?.metadata as any) || {};

    // Update AI settings in org metadata
    await prisma.org.update({
      where: { id: authContext.orgId },
      data: {
        metadata: {
          ...currentMetadata,
          aiFeatures: features,
          aiSettingsUpdatedAt: new Date().toISOString(),
        },
      },
    });

    // Log the settings change
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'unknown',
        entityType: 'org_settings',
        entityId: authContext.orgId,
        action: 'updated',
        meta: JSON.stringify({
          settingsType: 'ai_features',
          features,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'AI settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to update AI settings' },
      { status: 500 }
    );
  }
}

