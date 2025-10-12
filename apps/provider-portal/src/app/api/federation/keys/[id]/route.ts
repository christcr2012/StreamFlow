import { NextRequest, NextResponse } from 'next/server';
import { withProviderAuth, type ProviderSession } from '@/lib/api/withProviderAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';
import { prisma } from '@/lib/prisma';

// Type for route context with dynamic params (fixes Next.js 15 type generation)
type RouteContext = { params?: Promise<{ id: string }> };

/**
 * DELETE /api/federation/keys/[id]
 * Disable a federation key (soft delete)
 */
export const DELETE = withProviderAuth(
  async (
    request: NextRequest,
    context: RouteContext & { session: ProviderSession }
  ) => {
    try {
      const { session } = context;
      // Handle params properly for Next.js 15
      const params = context.params ? await context.params : { id: '' };
      const { id } = params;

      // Soft delete by setting disabledAt
      const key = await prisma.federationKey.update({
        where: { id },
        data: { disabledAt: new Date() },
        select: { id: true, keyId: true, orgId: true },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'federation_key_deleted',
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

      return NextResponse.json({ success: true, key });
    } catch (error) {
      console.error('Error deleting federation key:', error);
      return NextResponse.json(
        { error: 'Failed to delete key' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.FEDERATION_KEYS_DELETE }
);

