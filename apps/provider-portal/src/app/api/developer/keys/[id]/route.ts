import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withDeveloperAuth, type DeveloperSession } from '@/lib/api/withDeveloperAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/developer/keys/[id]
 * Revoke (soft delete) a developer API key
 */
export const DELETE = withDeveloperAuth(
  async (request: NextRequest, context: { params?: any; session: DeveloperSession }) => {
    try {
      const params = await Promise.resolve(context.params);
      const { id } = params || {};

      if (!id) {
        return NextResponse.json(
          { error: 'Key ID is required' },
          { status: 400 }
        );
      }

      // Verify the key belongs to the current developer
      const existingKey = await prisma.developerAPIKey.findUnique({
        where: { id },
        select: { userId: true, keyId: true, name: true },
      });

      if (!existingKey) {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }

      if (existingKey.userId !== context.session.email) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete your own API keys' },
          { status: 403 }
        );
      }

      // Soft delete by setting revokedAt
      await prisma.developerAPIKey.update({
        where: { id },
        data: { revokedAt: new Date() },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'developer_api_key_revoked',
          entityType: 'developer_api_key',
          entityId: id,
          actorType: 'developer',
          actorId: context.session.email,
          metadata: {
            keyId: existingKey.keyId,
            name: existingKey.name,
          },
        },
      });

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('Error revoking developer API key:', error);
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.DEVELOPER_KEYS_DELETE }
);

