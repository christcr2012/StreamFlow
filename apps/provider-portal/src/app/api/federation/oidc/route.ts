import { NextRequest, NextResponse } from 'next/server';
import { withProviderAuth, type ProviderSession } from '@/lib/api/withProviderAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto/aes';

const ENCRYPTION_KEY = process.env.FED_HMAC_MASTER_KEY || 'default-key-change-in-production';

// Type for route context (fixes Next.js 15 type generation)
type RouteContext = { params?: Record<string, never> };

/**
 * Validate OIDC configuration
 */
function validateOIDCConfig(config: {
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
}): { valid: boolean; error?: string } {
  if (!config.issuerUrl || !config.clientId || !config.clientSecret) {
    return { valid: false, error: 'issuerUrl, clientId, and clientSecret are required' };
  }

  // Validate issuerUrl format
  try {
    new URL(config.issuerUrl);
  } catch {
    return { valid: false, error: 'Invalid issuerUrl format' };
  }

  return { valid: true };
}

/**
 * GET /api/federation/oidc
 * Retrieve OIDC configuration (clientSecret masked)
 */
export const GET = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const config = await prisma.oIDCConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!config) {
        return NextResponse.json({ config: null });
      }

      // Return config without decrypted secret
      const { clientSecret, ...safeConfig } = config;
      return NextResponse.json({
        config: { ...safeConfig, clientSecret: '***' }
      });
    } catch (error) {
      console.error('Error fetching OIDC config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch OIDC config' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.FEDERATION_READ }
);

/**
 * POST /api/federation/oidc
 * Create OIDC configuration (replaces existing)
 */
export const POST = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json();
      const { enabled, issuerUrl, clientId, clientSecret, scopes } = body;

      // Validate configuration
      const validation = validateOIDCConfig({ issuerUrl, clientId, clientSecret });
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Encrypt client secret
      const encryptedSecret = encrypt(clientSecret, ENCRYPTION_KEY);

      // Delete existing config (only one allowed)
      await prisma.oIDCConfig.deleteMany({});

      const config = await prisma.oIDCConfig.create({
        data: {
          enabled: enabled ?? false,
          issuerUrl,
          clientId,
          clientSecret: encryptedSecret,
          scopes: scopes || 'openid profile email',
        },
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'oidc_config_created',
          entityType: 'oidc_config',
          entityId: config.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            issuerUrl: config.issuerUrl,
            clientId: config.clientId,
            enabled: config.enabled,
          },
        },
      });

      const { clientSecret: _, ...safeConfig } = config;
      return NextResponse.json({
        config: { ...safeConfig, clientSecret: '***' }
      });
    } catch (error) {
      console.error('Error creating OIDC config:', error);
      return NextResponse.json(
        { error: 'Failed to create OIDC config' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.FEDERATION_OIDC_CONFIGURE }
);

/**
 * PATCH /api/federation/oidc
 * Update OIDC configuration
 */
export const PATCH = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    try {
      const body = await request.json();
      const { enabled, issuerUrl, clientId, clientSecret, scopes } = body;

      const existing = await prisma.oIDCConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'OIDC config not found' },
          { status: 404 }
        );
      }

      const updateData: any = {};
      if (enabled !== undefined) updateData.enabled = enabled;
      if (issuerUrl) updateData.issuerUrl = issuerUrl;
      if (clientId) updateData.clientId = clientId;
      if (clientSecret) updateData.clientSecret = encrypt(clientSecret, ENCRYPTION_KEY);
      if (scopes) updateData.scopes = scopes;

      const config = await prisma.oIDCConfig.update({
        where: { id: existing.id },
        data: updateData,
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'oidc_config_updated',
          entityType: 'oidc_config',
          entityId: config.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            changes: Object.keys(updateData),
            enabled: config.enabled,
          },
        },
      });

      const { clientSecret: _, ...safeConfig } = config;
      return NextResponse.json({
        config: { ...safeConfig, clientSecret: '***' }
      });
    } catch (error) {
      console.error('Error updating OIDC config:', error);
      return NextResponse.json(
        { error: 'Failed to update OIDC config' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.FEDERATION_OIDC_CONFIGURE }
);

