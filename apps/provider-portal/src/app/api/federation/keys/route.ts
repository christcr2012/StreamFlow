import { NextRequest, NextResponse } from 'next/server';
import { withProviderAuth, type ProviderSession } from '@/lib/api/withProviderAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Type for route context (fixes Next.js 15 type generation)
type RouteContext = { params?: Record<string, never> };

/**
 * GET /api/federation/keys
 * List all active federation keys (secrets never returned)
 */
export const GET = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const keys = await prisma.federationKey.findMany({
        where: { disabledAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orgId: true,
          keyId: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ keys });
    } catch (error) {
      console.error('Error listing federation keys:', error);
      return NextResponse.json(
        { error: 'Failed to list keys' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.FEDERATION_READ }
);

/**
 * POST /api/federation/keys
 * Create a new federation key (secret returned only once)
 */
export const POST = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json();
      const { orgId } = body;

      if (!orgId) {
        return NextResponse.json(
          { error: 'orgId is required' },
          { status: 400 }
        );
      }

      // Generate key pair
      const keyId = `fed_${crypto.randomBytes(16).toString('hex')}`;
      const secret = crypto.randomBytes(32).toString('hex');
      const secretHash = await bcrypt.hash(secret, 10);

      const key = await prisma.federationKey.create({
        data: {
          orgId,
          keyId,
          secretHash,
        },
        select: {
          id: true,
          orgId: true,
          keyId: true,
          createdAt: true,
        },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'federation_key_created',
          entityType: 'federation_key',
          entityId: key.id,
          actorType: 'provider',
          actorId: session.email,
          orgId: key.orgId,
          metadata: {
            keyId: key.keyId,
          },
        },
      });

      // Return secret only once (never stored plaintext)
      return NextResponse.json({
        key: { ...key, secret },
        warning: 'Save this secret now. It will not be shown again.'
      });
    } catch (error) {
      console.error('Error creating federation key:', error);
      return NextResponse.json(
        { error: 'Failed to create key' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.FEDERATION_KEYS_CREATE }
);

