import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';

export interface IntegrationConfig {
  id: string;
  tenantId: string;
  type: 'paylocity' | 'geotab' | 'holman';
  status: 'disconnected' | 'pending' | 'connected' | 'error';
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectIntegrationRequest {
  tenantId: string;
  type: 'paylocity' | 'geotab' | 'holman';
  credentials: any;
  userId: string;
}

export class IntegrationService {
  /**
   * Connect an integration
   */
  static async connect(request: ConnectIntegrationRequest): Promise<IntegrationConfig> {
    const { tenantId, type, credentials, userId } = request;

    // Check if integration already exists
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        orgId: tenantId,
        type,
      },
    });

    if (existing) {
      // Update existing integration
      const updated = await prisma.integrationConfig.update({
        where: { id: existing.id },
        data: {
          status: 'pending',
          config: {
            ...(existing.config as any || {}),
            credentials: await this.encryptCredentials(credentials),
            lastUpdated: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });

      // Test connection
      const testResult = await this.testConnection(type, credentials);
      
      // Update status based on test result
      await prisma.integrationConfig.update({
        where: { id: updated.id },
        data: {
          status: testResult.success ? 'connected' : 'error',
          config: {
            ...(updated.config as any || {}),
            lastTestResult: testResult,
          },
        },
      });

      // Audit log
      await auditService.logBinderEvent({
        action: `integration.${type}.update`,
        tenantId,
        path: `/integrations/${type}`,
        ts: Date.now(),
      });

      return this.mapToIntegrationConfig(updated);
    } else {
      // Create new integration
      const created = await prisma.integrationConfig.create({
        data: {
          orgId: tenantId,
          type,
          status: 'pending',
          config: {
            credentials: await this.encryptCredentials(credentials),
            createdBy: userId,
            createdAt: new Date().toISOString(),
          },
        },
      });

      // Test connection
      const testResult = await this.testConnection(type, credentials);
      
      // Update status based on test result
      const updated = await prisma.integrationConfig.update({
        where: { id: created.id },
        data: {
          status: testResult.success ? 'connected' : 'error',
          config: {
            ...(created.config as any || {}),
            lastTestResult: testResult,
          },
        },
      });

      // Audit log
      await auditService.logBinderEvent({
        action: `integration.${type}.connect`,
        tenantId,
        path: `/integrations/${type}`,
        ts: Date.now(),
      });

      return this.mapToIntegrationConfig(updated);
    }
  }

  /**
   * Disconnect an integration
   */
  static async disconnect(tenantId: string, type: string, userId: string): Promise<void> {
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        orgId: tenantId,
        type,
      },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    await prisma.integrationConfig.update({
      where: { id: integration.id },
      data: {
        status: 'disconnected',
        config: {
          ...(integration.config as any || {}),
          disconnectedBy: userId,
          disconnectedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: `integration.${type}.disconnect`,
      tenantId,
      path: `/integrations/${type}`,
      ts: Date.now(),
    });
  }

  /**
   * Get integration status
   */
  static async getStatus(tenantId: string, type: string): Promise<IntegrationConfig | null> {
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        orgId: tenantId,
        type,
      },
    });

    return integration ? this.mapToIntegrationConfig(integration) : null;
  }

  /**
   * List all integrations for a tenant
   */
  static async listIntegrations(tenantId: string): Promise<IntegrationConfig[]> {
    const integrations = await prisma.integrationConfig.findMany({
      where: {
        orgId: tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return integrations.map(this.mapToIntegrationConfig);
  }

  /**
   * Test connection to integration
   */
  static async testConnection(type: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (type) {
        case 'paylocity':
          return await this.testPaylocityConnection(credentials);
        case 'geotab':
          return await this.testGeotabConnection(credentials);
        case 'holman':
          return await this.testHolmanConnection(credentials);
        default:
          return { success: false, error: 'Unknown integration type' };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Test Paylocity connection
   */
  private static async testPaylocityConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - in real app, would make API call to Paylocity
    const { client_id, client_secret, company_id } = credentials;
    
    if (!client_id || !client_secret || !company_id) {
      return { success: false, error: 'Missing required credentials' };
    }

    // Simulate API test call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }

  /**
   * Test Geotab connection
   */
  private static async testGeotabConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - in real app, would make API call to Geotab
    const { database, username, password } = credentials;
    
    if (!database || !username || !password) {
      return { success: false, error: 'Missing required credentials' };
    }

    // Simulate API test call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }

  /**
   * Test Holman connection
   */
  private static async testHolmanConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - in real app, would make API call to Holman
    const { api_key, account_id } = credentials;
    
    if (!api_key || !account_id) {
      return { success: false, error: 'Missing required credentials' };
    }

    // Simulate API test call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }

  /**
   * Encrypt credentials (mock implementation)
   */
  private static async encryptCredentials(credentials: any): Promise<string> {
    // In real implementation, would use KMS or similar encryption
    return Buffer.from(JSON.stringify(credentials)).toString('base64');
  }

  /**
   * Decrypt credentials (mock implementation)
   */
  private static async decryptCredentials(encryptedCredentials: string): Promise<any> {
    // In real implementation, would use KMS or similar decryption
    return JSON.parse(Buffer.from(encryptedCredentials, 'base64').toString());
  }

  /**
   * Map Prisma model to IntegrationConfig interface
   */
  private static mapToIntegrationConfig(integration: any): IntegrationConfig {
    return {
      id: integration.id,
      tenantId: integration.orgId,
      type: integration.type,
      status: integration.status,
      config: integration.config,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }
}
