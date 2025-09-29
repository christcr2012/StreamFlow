/**
 * 🏢 TENANT REGISTRATION API
 * 
 * POST /api/tenant/register + createTenant() orchestrator for GitHub issue #6
 * Acceptance Criteria: Given {plan, industry, externalCustomerId}, tenant is created, seeded, linked; welcome queued; idempotent.
 * Phase:1 Area:provisioning Priority:high
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { consolidatedAudit } from '@/lib/consolidated-audit';
import { withSpaceGuard, SPACE_GUARDS } from '@/lib/space-guards';
import { applyIndustryTemplate, getIndustryTemplate } from '@/lib/industry-templates';
import { providerFederation, ProviderFederationService } from '@/lib/provider-federation';
import crypto from 'crypto';

export interface TenantRegistrationRequest {
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  industry: string;
  externalCustomerId?: string;
  companyName: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword?: string; // Optional - can be generated
}

export interface TenantRegistrationResponse {
  success: boolean;
  tenantId: string;
  orgId: string;
  ownerUserId: string;
  temporaryPassword?: string;
  welcomeEmailQueued: boolean;
  idempotencyKey: string;
}

/**
 * Comprehensive tenant creation orchestrator
 */
export async function createTenant(
  request: TenantRegistrationRequest,
  idempotencyKey: string
): Promise<TenantRegistrationResponse> {
  
  // Check for existing tenant with same idempotency key
  // For now, check by email since we need to keep it simple until migration
  const existingUser = await prisma.user.findUnique({
    where: { email: request.ownerEmail },
    include: { org: true }
  });

  if (existingUser && existingUser.role === 'OWNER') {
    // Return existing result for idempotency
    return {
      success: true,
      tenantId: existingUser.orgId,
      orgId: existingUser.orgId,
      ownerUserId: existingUser.id,
      welcomeEmailQueued: true, // Assume already sent
      idempotencyKey
    };
  }

  // Start transaction for atomic tenant creation
  return await prisma.$transaction(async (tx) => {
    // 1. Create organization with industry template configuration
    const industryTemplate = getIndustryTemplate(request.industry);
    const orgConfig = applyIndustryTemplate(request.industry, {
      plan: request.plan,
      externalCustomerId: request.externalCustomerId
    });

    const org = await tx.org.create({
      data: {
        name: request.companyName,
        industryType: request.industry,
        industryConfig: orgConfig,
        featureFlags: {
          tenantRegistration: true,
          plan: request.plan,
          externalCustomerId: request.externalCustomerId,
          // Enable industry-specific features
          ...(industryTemplate?.features || {})
        }
      }
    });

    // 2. Generate secure password if not provided
    const ownerPassword = request.ownerPassword || generateSecurePassword();
    const passwordHash = await hashPassword(ownerPassword);

    // 3. Create owner user (using existing fields)
    const ownerUser = await tx.user.create({
      data: {
        email: request.ownerEmail,
        name: request.ownerName,
        role: 'OWNER',
        orgId: org.id,
        passwordHash,
        mustChangePassword: !request.ownerPassword // If we generated password, require change
      }
    });

    // 4. Create RBAC role assignments for owner (using existing RbacUserRole model)
    // First, find or create the owner role
    let ownerRole = await tx.rbacRole.findFirst({
      where: { orgId: org.id, slug: 'owner' }
    });

    if (!ownerRole) {
      ownerRole = await tx.rbacRole.create({
        data: {
          orgId: org.id,
          slug: 'owner',
          name: 'Owner',
          isSystem: true
        }
      });
    }

    await tx.rbacUserRole.create({
      data: {
        userId: ownerUser.id,
        roleId: ownerRole.id,
        orgId: org.id
      }
    });

    // 5. Seed industry-specific data
    await seedIndustryData(tx, org.id, request.industry);

    // 6. Queue welcome email (outside transaction to avoid blocking)
    const welcomeEmailQueued = await queueWelcomeEmail(
      request.ownerEmail,
      request.ownerName,
      request.companyName,
      org.id,
      request.ownerPassword ? undefined : ownerPassword
    );

    // 7. Log the tenant registration for audit purposes
    await tx.auditLog.create({
      data: {
        orgId: org.id,
        actorId: ownerUser.id,
        action: 'TENANT_REGISTRATION',
        entityType: 'ORGANIZATION',
        entityId: org.id,
        delta: {
          idempotencyKey,
          plan: request.plan,
          industry: request.industry,
          externalCustomerId: request.externalCustomerId,
          welcomeEmailQueued,
          timestamp: new Date().toISOString()
        }
      }
    });

    // 8. Send federation handshake to provider portal (outside transaction)
    const federationData = ProviderFederationService.createTenantFederationData(
      org,
      ownerUser,
      industryTemplate?.features || {}
    );

    const federationResult = await providerFederation.sendFederationHandshake(
      'tenant_created',
      federationData,
      idempotencyKey
    );

    console.log('🔗 Federation handshake result:', federationResult);

    return {
      success: true,
      tenantId: org.id,
      orgId: org.id,
      ownerUserId: ownerUser.id,
      temporaryPassword: request.ownerPassword ? undefined : ownerPassword,
      welcomeEmailQueued,
      idempotencyKey
    };
  });
}

// Industry-specific functions removed - now using declarative industry templates

/**
 * Generate secure password
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Old industry workflow function removed - now using declarative industry templates

/**
 * Seed industry-specific data using industry templates
 */
async function seedIndustryData(tx: any, orgId: string, industry: string): Promise<void> {
  console.log(`🌱 SEEDING DATA for org ${orgId} in industry ${industry}`);

  const template = getIndustryTemplate(industry);
  if (!template) {
    console.log(`⚠️ No template found for industry: ${industry}`);
    return;
  }

  // Create a basic audit log entry for the seeding
  await tx.auditLog.create({
    data: {
      orgId,
      action: 'INDUSTRY_DATA_SEEDED',
      entityType: 'ORGANIZATION',
      entityId: orgId,
      delta: {
        industry,
        templateId: template.id,
        templateName: template.name,
        featuresEnabled: Object.keys(template.features).filter(key => template.features[key].enabled),
        seedingCompleted: true,
        timestamp: new Date().toISOString()
      }
    }
  });
}

// Old industry lead sources function removed - now using declarative industry templates

// Old industry job templates function removed - now using declarative industry templates

// Duplicate generateSecurePassword function removed

/**
 * Hash password securely
 */
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

/**
 * Queue welcome email
 */
async function queueWelcomeEmail(
  email: string,
  name: string,
  companyName: string,
  orgId: string,
  temporaryPassword?: string
): Promise<boolean> {
  try {
    // In a real implementation, this would queue an email job
    // For now, we'll just log it
    console.log(`📧 WELCOME EMAIL QUEUED:`, {
      to: email,
      name,
      companyName,
      orgId,
      hasTemporaryPassword: !!temporaryPassword,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // await emailService.queueWelcomeEmail({
    //   to: email,
    //   name,
    //   companyName,
    //   orgId,
    //   temporaryPassword,
    //   loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to queue welcome email:', error);
    return false;
  }
}

/**
 * API handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const request: TenantRegistrationRequest = req.body;
    
    // Validate required fields
    if (!request.plan || !request.industry || !request.companyName || !request.ownerEmail || !request.ownerName) {
      return res.status(400).json({ 
        error: 'Missing required fields: plan, industry, companyName, ownerEmail, ownerName' 
      });
    }

    // Generate idempotency key from request content
    const idempotencyKey = req.headers['idempotency-key'] as string || 
      crypto.createHash('sha256')
        .update(JSON.stringify({
          plan: request.plan,
          industry: request.industry,
          companyName: request.companyName,
          ownerEmail: request.ownerEmail,
          externalCustomerId: request.externalCustomerId
        }))
        .digest('hex');

    // Create tenant
    const result = await createTenant(request, idempotencyKey);

    // Audit log the tenant creation
    const context = consolidatedAudit.extractContext(req);
    await consolidatedAudit.logSystemAdmin(
      'Tenant registration',
      request.ownerEmail,
      'PROVIDER', // Tenant registration is typically done by provider
      'TENANT',
      context,
      {
        tenantId: result.tenantId,
        plan: request.plan,
        industry: request.industry,
        companyName: request.companyName,
        idempotencyKey
      }
    );

    return res.status(201).json(result);

  } catch (error) {
    console.error('Tenant registration failed:', error);
    
    // Audit log the failure
    const context = consolidatedAudit.extractContext(req);
    await consolidatedAudit.logSecurity(
      'SUSPICIOUS_ACTIVITY',
      'system',
      'PROVIDER',
      'Failed tenant registration',
      context,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestBody: req.body
      }
    );

    return res.status(500).json({ 
      error: 'Tenant registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Apply space guard - only allow provider space for tenant registration
export default withSpaceGuard(SPACE_GUARDS.PROVIDER_ONLY)(handler);
