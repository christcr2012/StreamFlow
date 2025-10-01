// src/server/services/tenantDomainService.ts
// Custom domain management for tenant federation
import { prisma } from '@/lib/prisma';
import { ServiceError } from './authService';
import { z } from 'zod';
import crypto from 'crypto';

export { ServiceError };

// ===== SCHEMAS =====

const CreateDomainSchema = z.object({
  domain: z.string().min(3).max(255).regex(/^[a-z0-9.-]+$/i),
  subdomain: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/i),
});

const VerifyDomainSchema = z.object({
  txtRecordValue: z.string(),
});

// ===== TENANT DOMAIN SERVICE =====

export class TenantDomainService {
  /**
   * Create custom domain configuration
   */
  async createDomain(orgId: string, input: z.infer<typeof CreateDomainSchema>) {
    const validated = CreateDomainSchema.parse(input);

    // Check if domain already exists
    const existing = await prisma.tenantDomain.findFirst({
      where: {
        OR: [
          { domain: validated.domain },
          { subdomain: validated.subdomain },
        ],
      },
    });

    if (existing) {
      throw new ServiceError(
        'Domain or subdomain already in use',
        'DOMAIN_EXISTS',
        409,
        { domain: validated.domain, subdomain: validated.subdomain }
      );
    }

    // Generate TXT record for verification
    const txtRecord = `streamflow-verify=${crypto.randomBytes(32).toString('hex')}`;

    const domain = await prisma.tenantDomain.create({
      data: {
        orgId,
        domain: validated.domain,
        subdomain: validated.subdomain,
        txtRecord,
        status: 'pending',
      },
    });

    return {
      ...domain,
      verificationInstructions: {
        type: 'TXT',
        name: `_streamflow-verify.${validated.domain}`,
        value: txtRecord,
        ttl: 3600,
      },
    };
  }

  /**
   * Verify domain ownership via TXT record
   */
  async verifyDomain(orgId: string, input: z.infer<typeof VerifyDomainSchema>) {
    const validated = VerifyDomainSchema.parse(input);

    const domain = await prisma.tenantDomain.findUnique({
      where: { orgId },
    });

    if (!domain) {
      throw new ServiceError('Domain not found', 'DOMAIN_NOT_FOUND', 404);
    }

    if (domain.verified) {
      throw new ServiceError('Domain already verified', 'ALREADY_VERIFIED', 400);
    }

    // Verify TXT record matches
    if (validated.txtRecordValue !== domain.txtRecord) {
      throw new ServiceError(
        'TXT record does not match',
        'VERIFICATION_FAILED',
        400,
        { expected: domain.txtRecord, received: validated.txtRecordValue }
      );
    }

    // Mark as verified
    const updated = await prisma.tenantDomain.update({
      where: { orgId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        status: 'verified',
      },
    });

    return updated;
  }

  /**
   * Activate domain (after verification and SSL setup)
   */
  async activateDomain(orgId: string) {
    const domain = await prisma.tenantDomain.findUnique({
      where: { orgId },
    });

    if (!domain) {
      throw new ServiceError('Domain not found', 'DOMAIN_NOT_FOUND', 404);
    }

    if (!domain.verified) {
      throw new ServiceError('Domain not verified', 'NOT_VERIFIED', 400);
    }

    if (domain.status === 'active') {
      throw new ServiceError('Domain already active', 'ALREADY_ACTIVE', 400);
    }

    const updated = await prisma.tenantDomain.update({
      where: { orgId },
      data: {
        status: 'active',
        activatedAt: new Date(),
        sslEnabled: true,
        sslIssuedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Suspend domain
   */
  async suspendDomain(orgId: string, reason: string) {
    const domain = await prisma.tenantDomain.findUnique({
      where: { orgId },
    });

    if (!domain) {
      throw new ServiceError('Domain not found', 'DOMAIN_NOT_FOUND', 404);
    }

    const updated = await prisma.tenantDomain.update({
      where: { orgId },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
    });

    return updated;
  }

  /**
   * Get domain configuration
   */
  async getDomain(orgId: string) {
    const domain = await prisma.tenantDomain.findUnique({
      where: { orgId },
    });

    if (!domain) {
      throw new ServiceError('Domain not found', 'DOMAIN_NOT_FOUND', 404);
    }

    return domain;
  }

  /**
   * List all domains (provider only)
   */
  async listDomains(filters: {
    status?: string;
    verified?: boolean;
    limit?: number;
  } = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }

    const domains = await prisma.tenantDomain.findMany({
      where,
      take: filters.limit || 100,
      orderBy: { createdAt: 'desc' },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return domains;
  }

  /**
   * Delete domain configuration
   */
  async deleteDomain(orgId: string) {
    const domain = await prisma.tenantDomain.findUnique({
      where: { orgId },
    });

    if (!domain) {
      throw new ServiceError('Domain not found', 'DOMAIN_NOT_FOUND', 404);
    }

    if (domain.status === 'active') {
      throw new ServiceError(
        'Cannot delete active domain',
        'DOMAIN_ACTIVE',
        400,
        { hint: 'Suspend domain first' }
      );
    }

    await prisma.tenantDomain.delete({
      where: { orgId },
    });

    return { success: true };
  }
}

export const tenantDomainService = new TenantDomainService();

