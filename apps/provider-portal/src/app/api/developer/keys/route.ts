import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withDeveloperAuth, type DeveloperSession } from '@/lib/api/withDeveloperAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/developer/keys
 * List all API keys for the current developer
 */
export const GET = withDeveloperAuth(
  async (request: NextRequest, { session }: { session: DeveloperSession }) => {
    try {
      const keys = await prisma.developerAPIKey.findMany({
        where: {
          userId: session.email,
          revokedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          keyId: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
          scopes: true,
        },
      });

      return NextResponse.json({ keys });
    } catch (error) {
      console.error('Error fetching developer API keys:', error);
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.DEVELOPER_KEYS_READ }
);

/**
 * POST /api/developer/keys
 * Create a new API key for the current developer
 */
export const POST = withDeveloperAuth(
  async (request: NextRequest, { session }: { session: DeveloperSession }) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { name, scopes = [], expiresInDays } = body || {};

      if (!name || typeof name !== 'string') {
        return NextResponse.json(
          { error: 'name is required' },
          { status: 400 }
        );
      }

      // Generate key ID and secret
      const keyId = `dev_${crypto.randomBytes(16).toString('hex')}`;
      const secret = crypto.randomBytes(32).toString('hex');
      const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

      // Calculate expiration date if provided
      let expiresAt: Date | null = null;
      if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      // Create the API key
      const key = await prisma.developerAPIKey.create({
        data: {
          name,
          keyId,
          secretHash,
          userId: session.email,
          scopes: Array.isArray(scopes) ? scopes : [],
          expiresAt,
        },
        select: {
          id: true,
          name: true,
          keyId: true,
          createdAt: true,
          expiresAt: true,
          scopes: true,
        },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'developer_api_key_created',
          entityType: 'developer_api_key',
          entityId: key.id,
          actorType: 'developer',
          actorId: session.email,
          metadata: {
            keyId: key.keyId,
            name: key.name,
            scopes: key.scopes,
          },
        },
      });

      // Return the key with the secret (one-time only)
      return NextResponse.json(
        {
          key,
          secret, // Only returned once!
          warning: 'Save this secret now. You will not be able to see it again.',
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating developer API key:', error);
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.DEVELOPER_KEYS_CREATE }
);

