import { NextApiRequest, NextApiResponse } from 'next';
import { prisma as db } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

interface TrackEventRequest {
  featureKey: string;
  eventType: 'view' | 'click' | 'create' | 'update' | 'complete' | 'search' | 'export';
  metadata?: Record<string, any>;
  duration?: number;
}

interface JWTPayload {
  userId: string;
  orgId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const sessionCookie = req.cookies.ws_user;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify and decode the session
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      return res.status(500).json({ error: 'Session secret not configured' });
    }

    let payload: JWTPayload;
    try {
      payload = verify(sessionCookie, sessionSecret) as JWTPayload;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { featureKey, eventType, metadata, duration }: TrackEventRequest = req.body;

    // Validate required fields
    if (!featureKey || !eventType) {
      return res.status(400).json({ error: 'featureKey and eventType are required' });
    }

    // Get client information
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const sessionId = req.headers['x-session-id'] as string || undefined;

    // Create the usage event
    const appEvent = await db.appEvent.create({
      data: {
        orgId: payload.orgId,
        userId: payload.userId,
        sessionId,
        featureKey,
        eventType,
        metadata: metadata || {},
        userAgent,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '',
        duration: duration || null,
      },
    });

    // Also update feature usage statistics if this is a significant event
    if (['create', 'update', 'complete'].includes(eventType)) {
      await updateFeatureUsageStats(payload.orgId, featureKey);
    }

    res.status(200).json({ success: true, eventId: appEvent.id });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
}

async function updateFeatureUsageStats(orgId: string, featureKey: string) {
  try {
    // Find or create the feature registry entry
    const feature = await db.featureRegistry.findUnique({
      where: { key: featureKey },
    });

    if (!feature) return; // Skip if feature not registered

    // Update or create the org feature state
    await db.orgFeatureState.upsert({
      where: {
        orgId_featureId: {
          orgId,
          featureId: feature.id,
        },
      },
      create: {
        orgId,
        featureId: feature.id,
        enabled: true,
        enabledAt: new Date(),
        firstUsedAt: new Date(),
        lastUsedAt: new Date(),
        usageCount: 1,
      },
      update: {
        lastUsedAt: new Date(),
        usageCount: {
          increment: 1,
        },
        // Set firstUsedAt if this is the first time
        firstUsedAt: {
          set: undefined, // Will only set if currently null
        },
      },
    });
  } catch (error) {
    console.error('Error updating feature usage stats:', error);
    // Don't throw - we don't want to break event tracking if stats fail
  }
}