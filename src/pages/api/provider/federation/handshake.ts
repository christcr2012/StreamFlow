/**
 * 🔗 PROVIDER FEDERATION HANDSHAKE ENDPOINT
 * 
 * Receives federation handshakes from tenant instances
 * Part of GitHub issue #8: Provider portal link (signed when enabled)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { consolidatedAudit } from '@/lib/consolidated-audit';
import { withSpaceGuard, SPACE_GUARDS } from '@/lib/space-guards';
import { ProviderFederationService, DEFAULT_FEDERATION_CONFIG } from '@/lib/provider-federation';
import type { FederationHandshakeRequest, FederationHandshakeResponse } from '@/lib/provider-federation';

interface ProviderTenant {
  id: string;
  tenantId: string;
  companyName: string;
  industry: string;
  plan: string;
  ownerEmail: string;
  ownerName: string;
  status: 'active' | 'inactive' | 'suspended';
  federationData: any;
  createdAt: Date;
  updatedAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse<FederationHandshakeResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      tenantId: '',
      error: 'Method not allowed'
    });
  }

  try {
    const federationService = new ProviderFederationService(DEFAULT_FEDERATION_CONFIG);
    const request: FederationHandshakeRequest = req.body;

    // Validate required fields
    if (!request.action || !request.data || !request.signature || !request.idempotencyKey) {
      return res.status(400).json({
        success: false,
        tenantId: request.data?.tenantId || '',
        error: 'Missing required fields'
      });
    }

    // Verify signature
    if (!federationService.verifySignature(request)) {
      await consolidatedAudit.logSecurity(
        'SUSPICIOUS_ACTIVITY',
        'system@streamflow.com',
        'PROVIDER',
        'FEDERATION_SIGNATURE_INVALID',
        {
          ipAddress: req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] as string
        },
        {
          tenantId: request.data.tenantId,
          federationAction: request.action,
          signature: request.signature,
          timestamp: request.timestamp,
          clientIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        }
      );

      return res.status(401).json({
        success: false,
        tenantId: request.data.tenantId,
        error: 'Invalid signature'
      });
    }

    // Check timestamp (prevent replay attacks)
    const requestTime = new Date(request.timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - requestTime.getTime());
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (timeDiff > maxAge) {
      return res.status(401).json({
        success: false,
        tenantId: request.data.tenantId,
        error: 'Request timestamp too old'
      });
    }

    // Check for duplicate requests (idempotency)
    const existingHandshake = await prisma.auditLog.findFirst({
      where: {
        action: 'FEDERATION_HANDSHAKE_RECEIVED',
        entityId: request.data.tenantId,
        delta: {
          path: ['idempotencyKey'],
          equals: request.idempotencyKey
        }
      }
    });

    if (existingHandshake) {
      console.log('🔗 Duplicate federation handshake detected, returning cached result');
      return res.status(200).json({
        success: true,
        tenantId: request.data.tenantId,
        providerTenantId: `pt_${request.data.tenantId}`,
        message: 'Handshake already processed (idempotent)'
      });
    }

    // Process the handshake based on action
    let result: FederationHandshakeResponse;

    switch (request.action) {
      case 'tenant_created':
        result = await handleTenantCreated(request);
        break;
      case 'tenant_updated':
        result = await handleTenantUpdated(request);
        break;
      case 'tenant_deleted':
        result = await handleTenantDeleted(request);
        break;
      default:
        return res.status(400).json({
          success: false,
          tenantId: request.data.tenantId,
          error: `Unknown action: ${request.action}`
        });
    }

    // Log the handshake
    await consolidatedAudit.logSystemAdmin(
      'FEDERATION_HANDSHAKE_RECEIVED',
      'system@streamflow.com',
      'PROVIDER',
      'FEDERATION',
      {
        ipAddress: req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'] as string
      },
      {
        action: request.action,
        tenantId: request.data.tenantId,
        idempotencyKey: request.idempotencyKey,
        companyName: request.data.companyName,
        industry: request.data.industry,
        plan: request.data.plan,
        success: result.success,
        timestamp: new Date().toISOString()
      }
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error('🔗 Federation handshake error:', error);

    await consolidatedAudit.logSystemAdmin(
      'FEDERATION_HANDSHAKE_ERROR',
      'system@streamflow.com',
      'PROVIDER',
      'FEDERATION',
      {
        ipAddress: req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'] as string
      },
      {
        tenantId: req.body?.data?.tenantId || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    );

    return res.status(500).json({
      success: false,
      tenantId: req.body?.data?.tenantId || '',
      error: 'Internal server error'
    });
  }
}

/**
 * Handle tenant creation
 */
async function handleTenantCreated(request: FederationHandshakeRequest): Promise<FederationHandshakeResponse> {
  const { data } = request;

  try {
    // Create or update provider tenant record
    // For now, we'll store this in the audit log since we don't have a ProviderTenant model yet
    // TODO: Create ProviderTenant model when database is migrated
    
    const providerTenantId = `pt_${data.tenantId}`;

    console.log(`🔗 Creating provider tenant record for ${data.companyName} (${data.tenantId})`);

    // Log the tenant creation in provider system
    await consolidatedAudit.logSystemAdmin(
      'PROVIDER_TENANT_CREATED',
      'system@streamflow.com',
      'PROVIDER',
      'PROVIDER_TENANT',
      {},
      {
        tenantId: data.tenantId,
        providerTenantId,
        companyName: data.companyName,
        industry: data.industry,
        plan: data.plan,
        ownerEmail: data.ownerEmail,
        ownerName: data.ownerName,
        features: data.features,
        metadata: data.metadata,
        createdAt: data.createdAt,
        timestamp: new Date().toISOString()
      }
    );

    return {
      success: true,
      tenantId: data.tenantId,
      providerTenantId,
      message: 'Tenant successfully registered in provider portal'
    };

  } catch (error) {
    console.error('🔗 Error creating provider tenant:', error);
    return {
      success: false,
      tenantId: data.tenantId,
      error: error instanceof Error ? error.message : 'Failed to create provider tenant'
    };
  }
}

/**
 * Handle tenant update
 */
async function handleTenantUpdated(request: FederationHandshakeRequest): Promise<FederationHandshakeResponse> {
  const { data } = request;

  try {
    const providerTenantId = `pt_${data.tenantId}`;

    console.log(`🔗 Updating provider tenant record for ${data.companyName} (${data.tenantId})`);

    // Log the tenant update in provider system
    await consolidatedAudit.logSystemAdmin(
      'PROVIDER_TENANT_UPDATED',
      'system@streamflow.com',
      'PROVIDER',
      'PROVIDER_TENANT',
      {},
      {
        tenantId: data.tenantId,
        providerTenantId,
        companyName: data.companyName,
        industry: data.industry,
        plan: data.plan,
        features: data.features,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      }
    );

    return {
      success: true,
      tenantId: data.tenantId,
      providerTenantId,
      message: 'Tenant successfully updated in provider portal'
    };

  } catch (error) {
    console.error('🔗 Error updating provider tenant:', error);
    return {
      success: false,
      tenantId: data.tenantId,
      error: error instanceof Error ? error.message : 'Failed to update provider tenant'
    };
  }
}

/**
 * Handle tenant deletion
 */
async function handleTenantDeleted(request: FederationHandshakeRequest): Promise<FederationHandshakeResponse> {
  const { data } = request;

  try {
    const providerTenantId = `pt_${data.tenantId}`;

    console.log(`🔗 Marking provider tenant as deleted for ${data.companyName} (${data.tenantId})`);

    // Log the tenant deletion in provider system
    await consolidatedAudit.logSystemAdmin(
      'PROVIDER_TENANT_DELETED',
      'system@streamflow.com',
      'PROVIDER',
      'PROVIDER_TENANT',
      {},
      {
        tenantId: data.tenantId,
        providerTenantId,
        companyName: data.companyName,
        deletedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    );

    return {
      success: true,
      tenantId: data.tenantId,
      providerTenantId,
      message: 'Tenant successfully marked as deleted in provider portal'
    };

  } catch (error) {
    console.error('🔗 Error deleting provider tenant:', error);
    return {
      success: false,
      tenantId: data.tenantId,
      error: error instanceof Error ? error.message : 'Failed to delete provider tenant'
    };
  }
}

// This endpoint should be accessible without authentication since it's a webhook
// But we verify the signature for security
export default handler;
