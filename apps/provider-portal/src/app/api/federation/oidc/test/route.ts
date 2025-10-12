import { NextRequest, NextResponse } from 'next/server';
import { withProviderAuth, type ProviderSession } from '@/lib/api/withProviderAuth';
import { PERMISSIONS } from '@/lib/rbac/roles';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto/aes';

const ENCRYPTION_KEY = process.env.FED_HMAC_MASTER_KEY || 'default-key-change-in-production';

// Type for route context (fixes Next.js 15 type generation)
type RouteContext = { params?: Record<string, never> };

/**
 * POST /api/federation/oidc/test
 * Test OIDC configuration with discovery and token exchange (RFC 8414)
 */
export const POST = withProviderAuth(
  async (request: NextRequest, context: RouteContext & { session: ProviderSession }) => {
    const { session } = context;
    const started = Date.now();
    try {
      // Load most recent OIDC config
      const config = await prisma.oIDCConfig.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      if (!config) {
        return NextResponse.json(
          { error: 'OIDC config not found' },
          { status: 404 }
        );
      }

      const issuer = config.issuerUrl.replace(/\/+$/, '');

      // Step 1: OIDC Discovery (RFC 8414)
      const wellKnownUrl = `${issuer}/.well-known/openid-configuration`;
      const discoveryRes = await fetch(wellKnownUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!discoveryRes.ok) {
        return NextResponse.json(
          { error: `OIDC discovery failed (${discoveryRes.status})` },
          { status: 502 }
        );
      }

      const discovery = await discoveryRes.json();
      const tokenEndpoint: string | undefined = discovery.token_endpoint;

      if (!tokenEndpoint) {
        return NextResponse.json(
          { error: 'OIDC provider did not expose token_endpoint' },
          { status: 502 }
        );
      }

      // Step 2: Token exchange using client_credentials
      const secret = decrypt(config.clientSecret, ENCRYPTION_KEY);
      const body = new URLSearchParams();
      body.set('grant_type', 'client_credentials');
      if (config.scopes) body.set('scope', config.scopes);
      body.set('client_id', config.clientId);
      body.set('client_secret', secret);

      const tokenRes = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      const durationMs = Date.now() - started;

      if (!tokenRes.ok) {
        return NextResponse.json(
          { error: 'Failed to obtain access token' },
          { status: 502 }
        );
      }

      const token = await tokenRes.json();
      if (!token || !token.access_token) {
        return NextResponse.json(
          { error: 'Provider returned an invalid token response' },
          { status: 502 }
        );
      }

      // Record success (update lastTestedAt)
      await prisma.oIDCConfig.update({
        where: { id: config.id },
        data: { lastTestedAt: new Date() }
      });

      // Audit log
      await prisma.auditEvent.create({
        data: {
          action: 'oidc_config_tested',
          entityType: 'oidc_config',
          entityId: config.id,
          actorType: 'provider',
          actorId: session.email,
          metadata: {
            success: true,
            durationMs,
            issuerUrl: config.issuerUrl,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'OIDC connection successful',
        durationMs
      });
    } catch (error) {
      console.error('Error testing OIDC connection:', error);
      return NextResponse.json(
        { error: 'Failed to test OIDC connection' },
        { status: 500 }
      );
    }
  },
  { requiredPermission: PERMISSIONS.FEDERATION_OIDC_TEST }
);

