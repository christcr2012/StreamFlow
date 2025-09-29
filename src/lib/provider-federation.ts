/**
 * 🔗 PROVIDER FEDERATION SYSTEM
 * 
 * Provider portal link (signed when enabled) for GitHub issue #8
 * Acceptance Criteria: New tenants appear in portal; failed handshake retries; audited
 * Phase:1 Area:federation Priority:medium
 */

import crypto from 'crypto';
import { consolidatedAudit } from './consolidated-audit';

export interface ProviderFederationConfig {
  enabled: boolean;
  providerPortalUrl: string;
  signingSecret: string;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
}

export interface TenantFederationData {
  tenantId: string;
  orgId: string;
  companyName: string;
  industry: string;
  plan: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
  externalCustomerId?: string;
  features: Record<string, any>;
  metadata: Record<string, any>;
}

export interface FederationHandshakeRequest {
  action: 'tenant_created' | 'tenant_updated' | 'tenant_deleted';
  timestamp: string;
  signature: string;
  data: TenantFederationData;
  idempotencyKey: string;
}

export interface FederationHandshakeResponse {
  success: boolean;
  tenantId: string;
  providerTenantId?: string;
  message?: string;
  error?: string;
  retryAfter?: number;
}

/**
 * Provider Federation Service
 */
export class ProviderFederationService {
  private config: ProviderFederationConfig;

  constructor(config: ProviderFederationConfig) {
    this.config = config;
  }

  /**
   * Create signed federation request
   */
  createSignedRequest(
    action: 'tenant_created' | 'tenant_updated' | 'tenant_deleted',
    tenantData: TenantFederationData,
    idempotencyKey: string
  ): FederationHandshakeRequest {
    const timestamp = new Date().toISOString();
    const payload = {
      action,
      timestamp,
      data: tenantData,
      idempotencyKey
    };

    const signature = this.signPayload(payload);

    return {
      ...payload,
      signature
    };
  }

  /**
   * Sign payload with HMAC-SHA256
   */
  private signPayload(payload: any): string {
    const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto
      .createHmac('sha256', this.config.signingSecret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify signature of incoming request
   */
  verifySignature(request: FederationHandshakeRequest): boolean {
    const { signature, ...payload } = request;
    const expectedSignature = this.signPayload(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Send federation handshake to provider portal with retries
   */
  async sendFederationHandshake(
    action: 'tenant_created' | 'tenant_updated' | 'tenant_deleted',
    tenantData: TenantFederationData,
    idempotencyKey: string
  ): Promise<FederationHandshakeResponse> {
    if (!this.config.enabled) {
      console.log('🔗 Provider federation disabled, skipping handshake');
      return {
        success: true,
        tenantId: tenantData.tenantId,
        message: 'Federation disabled'
      };
    }

    const request = this.createSignedRequest(action, tenantData, idempotencyKey);
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🔗 Attempting federation handshake (attempt ${attempt}/${this.config.retryAttempts})`);
        
        const response = await this.makeHandshakeRequest(request, attempt);
        
        // Log successful handshake
        await consolidatedAudit.logSystemAdmin(
          'FEDERATION_HANDSHAKE_SUCCESS',
          'system@streamflow.com',
          'PROVIDER',
          'FEDERATION',
          {},
          {
            action,
            attempt,
            tenantId: tenantData.tenantId,
            providerTenantId: response.providerTenantId,
            timestamp: new Date().toISOString()
          }
        );

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.error(`🔗 Federation handshake attempt ${attempt} failed:`, lastError.message);
        
        // Log failed attempt
        await consolidatedAudit.logSystemAdmin(
          'FEDERATION_HANDSHAKE_RETRY',
          'system@streamflow.com',
          'PROVIDER',
          'FEDERATION',
          {},
          {
            action,
            attempt,
            tenantId: tenantData.tenantId,
            error: lastError.message,
            willRetry: attempt < this.config.retryAttempts,
            timestamp: new Date().toISOString()
          }
        );

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    await consolidatedAudit.logSystemAdmin(
      'FEDERATION_HANDSHAKE_FAILED',
      'system@streamflow.com',
      'PROVIDER',
      'FEDERATION',
      {},
      {
        action,
        tenantId: tenantData.tenantId,
        totalAttempts: this.config.retryAttempts,
        finalError: lastError?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }
    );

    return {
      success: false,
      tenantId: tenantData.tenantId,
      error: `Federation handshake failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`
    };
  }

  /**
   * Make HTTP request to provider portal
   */
  private async makeHandshakeRequest(
    request: FederationHandshakeRequest,
    attempt: number
  ): Promise<FederationHandshakeResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.providerPortalUrl}/api/federation/handshake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Federation-Signature': request.signature,
          'X-Federation-Timestamp': request.timestamp,
          'X-Idempotency-Key': request.idempotencyKey,
          'User-Agent': `StreamFlow-Federation/1.0 (attempt=${attempt})`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: FederationHandshakeResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Handshake failed');
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Create tenant federation data from org and user
   */
  static createTenantFederationData(
    org: any,
    ownerUser: any,
    features: Record<string, any> = {}
  ): TenantFederationData {
    return {
      tenantId: org.id,
      orgId: org.id,
      companyName: org.name,
      industry: org.industryType || 'other',
      plan: org.featureFlags?.plan || 'STARTER',
      ownerEmail: ownerUser.email,
      ownerName: ownerUser.name || ownerUser.email,
      createdAt: org.createdAt.toISOString(),
      externalCustomerId: org.featureFlags?.externalCustomerId,
      features,
      metadata: {
        industryConfig: org.industryConfig || {},
        featureFlags: org.featureFlags || {}
      }
    };
  }
}

/**
 * Default federation configuration
 */
export const DEFAULT_FEDERATION_CONFIG: ProviderFederationConfig = {
  enabled: process.env.PROVIDER_FEDERATION_ENABLED === 'true',
  providerPortalUrl: process.env.PROVIDER_PORTAL_URL || 'https://provider.streamflow.app',
  signingSecret: process.env.PROVIDER_FEDERATION_SECRET || 'default-secret-change-in-production',
  retryAttempts: parseInt(process.env.PROVIDER_FEDERATION_RETRIES || '3'),
  retryDelayMs: parseInt(process.env.PROVIDER_FEDERATION_DELAY_MS || '1000'),
  timeoutMs: parseInt(process.env.PROVIDER_FEDERATION_TIMEOUT_MS || '10000')
};

/**
 * Global federation service instance
 */
export const providerFederation = new ProviderFederationService(DEFAULT_FEDERATION_CONFIG);
