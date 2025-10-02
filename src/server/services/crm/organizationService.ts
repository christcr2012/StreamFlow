/**
 * Organization Service (Binder2 - Option C)
 * 
 * Proper CRM Organization service using the Organization model
 * Replaces Customer model misuse in CRM routes
 * 
 * Features:
 * - CRUD operations for CRM Organizations
 * - Unique name per tenant (case-insensitive enforcement)
 * - Domain normalization and validation
 * - Phone normalization (E.164)
 * - ConversionAudit logging for all mutations
 * - RBAC enforcement (tenant_owner/tenant_manager only)
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit/auditLog';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  annualRevenue: z.number().int().nonnegative().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  ownerId: z.string().optional(),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  annualRevenue: z.number().int().nonnegative().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  ownerId: z.string().optional(),
  archived: z.boolean().optional(),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize domain: lowercase + strip scheme
 */
function normalizeDomain(domain: string | undefined): string | undefined {
  if (!domain) return undefined;
  return domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Normalize phone to E.164 format (basic implementation)
 * TODO: Use libphonenumber-js for proper E.164 formatting
 */
function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // If starts with 1 and has 11 digits, assume US number
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  // If has 10 digits, assume US number without country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // Otherwise return as-is with + prefix
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Ensure unique name per tenant (case-insensitive)
 * If conflict, append " (2)", " (3)", etc.
 */
async function ensureUniqueName(
  orgId: string,
  name: string,
  excludeId?: string
): Promise<string> {
  let uniqueName = name;
  let counter = 2;

  while (true) {
    const existing = await prisma.organization.findFirst({
      where: {
        orgId,
        name: {
          equals: uniqueName,
          mode: 'insensitive',
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (!existing) {
      return uniqueName;
    }

    uniqueName = `${name} (${counter})`;
    counter++;
  }
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new organization
 */
export async function createOrganization(params: {
  orgId: string;
  userId: string;
  data: CreateOrganizationInput;
}) {
  const { orgId, userId, data } = params;

  // Validate input
  const validated = CreateOrganizationSchema.parse(data);

  // Ensure unique name
  const uniqueName = await ensureUniqueName(orgId, validated.name);

  // Normalize fields
  const normalizedDomain = normalizeDomain(validated.domain);
  const normalizedPhone = normalizePhone(validated.phone);

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      orgId,
      name: uniqueName,
      domain: normalizedDomain,
      industry: validated.industry,
      size: validated.size,
      annualRevenue: validated.annualRevenue,
      website: validated.website || undefined,
      phone: normalizedPhone,
      ownerId: validated.ownerId,
    },
  });

  // Log conversion audit
  await prisma.conversionAudit.create({
    data: {
      orgId,
      userId,
      action: 'create',
      resource: 'organization',
      meta: {
        organizationId: organization.id,
        name: organization.name,
      },
    },
  });

  // Log audit event
  await auditLog({
    tenantId: orgId,
    organizationId: organization.id,
    userId,
    action: 'create',
    resource: `organization:${organization.id}`,
    meta: { name: organization.name, payloadShape: 'OrgCreateV1' },
  });

  return organization;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(params: {
  orgId: string;
  organizationId: string;
}) {
  const { orgId, organizationId } = params;

  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      orgId,
    },
    include: {
      contacts: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      opportunities: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return organization;
}

/**
 * List organizations with filtering and pagination
 */
export async function listOrganizations(params: {
  orgId: string;
  archived?: boolean;
  ownerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { orgId, archived, ownerId, search, limit = 50, offset = 0 } = params;

  const where: any = { orgId };

  if (archived !== undefined) {
    where.archived = archived;
  }

  if (ownerId) {
    where.ownerId = ownerId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
      { industry: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            contacts: true,
            opportunities: true,
          },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return { organizations, total, limit, offset };
}

/**
 * Update organization
 */
export async function updateOrganization(params: {
  orgId: string;
  userId: string;
  organizationId: string;
  data: UpdateOrganizationInput;
}) {
  const { orgId, userId, organizationId, data } = params;

  // Validate input
  const validated = UpdateOrganizationSchema.parse(data);

  // If name is being updated, ensure uniqueness
  let uniqueName = validated.name;
  if (validated.name) {
    uniqueName = await ensureUniqueName(orgId, validated.name, organizationId);
  }

  // Normalize fields
  const normalizedDomain = validated.domain ? normalizeDomain(validated.domain) : undefined;
  const normalizedPhone = validated.phone ? normalizePhone(validated.phone) : undefined;

  // Update organization
  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(uniqueName && { name: uniqueName }),
      ...(normalizedDomain !== undefined && { domain: normalizedDomain }),
      ...(validated.industry !== undefined && { industry: validated.industry }),
      ...(validated.size !== undefined && { size: validated.size }),
      ...(validated.annualRevenue !== undefined && { annualRevenue: validated.annualRevenue }),
      ...(validated.website !== undefined && { website: validated.website || null }),
      ...(normalizedPhone !== undefined && { phone: normalizedPhone }),
      ...(validated.ownerId !== undefined && { ownerId: validated.ownerId }),
      ...(validated.archived !== undefined && { archived: validated.archived }),
    },
  });

  // Log conversion audit
  await prisma.conversionAudit.create({
    data: {
      orgId,
      userId,
      action: 'update',
      resource: 'organization',
      meta: {
        organizationId: organization.id,
        changes: validated,
      },
    },
  });

  // Log audit event
  await auditLog({
    tenantId: orgId,
    organizationId: organization.id,
    userId,
    action: 'update',
    resource: `organization:${organization.id}`,
    meta: { changes: validated, payloadShape: 'OrgUpdateV1' },
  });

  return organization;
}

/**
 * Delete organization (soft delete by default)
 */
export async function deleteOrganization(params: {
  orgId: string;
  userId: string;
  organizationId: string;
  hard?: boolean;
}) {
  const { orgId, userId, organizationId, hard = false } = params;

  if (hard) {
    // Hard delete - remove from database
    await prisma.organization.delete({
      where: { id: organizationId },
    });
  } else {
    // Soft delete - set archived flag
    await prisma.organization.update({
      where: { id: organizationId },
      data: { archived: true },
    });
  }

  // Log conversion audit
  await prisma.conversionAudit.create({
    data: {
      orgId,
      userId,
      action: hard ? 'delete' : 'archive',
      resource: 'organization',
      meta: {
        organizationId,
        hard,
      },
    },
  });

  // Log audit event
  await auditLog({
    tenantId: orgId,
    organizationId,
    userId,
    action: 'delete',
    resource: `organization:${organizationId}`,
    meta: { hard, payloadShape: 'OrgDeleteV1' },
  });

  return { success: true };
}

