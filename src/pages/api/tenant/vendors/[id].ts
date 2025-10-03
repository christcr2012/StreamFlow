import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['tenant_accountant', 'tenant_it_vendor', 'tenant_auditor', 'tenant_consultant']).optional(),
  status: z.enum(['active', 'pending', 'suspended', 'inactive']).optional(),
  scope: z.object({
    buIds: z.array(z.string()).optional(), // Optional: limit to specific business units
    permissions: z.array(z.string()).optional(), // Optional: specific permissions
  }).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid vendor ID' });
  }

  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id, orgId);
      case 'PATCH':
        return await handleUpdate(req, res, id, orgId, userId);
      case 'DELETE':
        return await handleDelete(req, res, id, orgId, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in vendor API:', error);
    await auditService.logBinderEvent({
      action: 'vendor.api.error',
      tenantId: orgId,
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process vendor request',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string, orgId: string) {
  // Find vendor user with roleScope='vendor'
  const vendor = await prisma.user.findFirst({
    where: {
      id,
      orgId,
      roleScope: 'vendor',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      roleScope: true,
      audience: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!vendor) {
    return res.status(404).json({
      error: 'VENDOR_NOT_FOUND',
      message: 'Vendor not found',
    });
  }

  // Audit log
  await auditService.logBinderEvent({
    action: 'vendor.get',
    tenantId: orgId,
    path: req.url,
    ts: Date.now(),
  });

  return res.status(200).json({
    ok: true,
    vendor,
  });
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse, id: string, orgId: string, userId: string) {
  // Validate request body
  const validation = UpdateVendorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: validation.error.errors,
    });
  }

  const { name, role, status, scope } = validation.data;

  // Check if vendor exists
  const existingVendor = await prisma.user.findFirst({
    where: {
      id,
      orgId,
      roleScope: 'vendor',
    },
  });

  if (!existingVendor) {
    return res.status(404).json({
      error: 'VENDOR_NOT_FOUND',
      message: 'Vendor not found',
    });
  }

  // Prepare update data
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (status !== undefined) updateData.status = status;
  
  // Update metadata with scope information
  if (scope !== undefined) {
    const currentMetadata = existingVendor.metadata as any || {};
    updateData.metadata = {
      ...currentMetadata,
      scope,
      vendorRole: role || currentMetadata.vendorRole,
    };
  }

  // Update vendor
  const updatedVendor = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      roleScope: true,
      audience: true,
      metadata: true,
      updatedAt: true,
    },
  });

  // Audit log
  await auditService.logBinderEvent({
    action: 'vendor.update',
    tenantId: orgId,
    path: req.url,
    ts: Date.now(),
  });

  return res.status(200).json({
    ok: true,
    vendor: updatedVendor,
    message: 'Vendor updated successfully',
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string, orgId: string, userId: string) {
  // Check if vendor exists
  const existingVendor = await prisma.user.findFirst({
    where: {
      id,
      orgId,
      roleScope: 'vendor',
    },
  });

  if (!existingVendor) {
    return res.status(404).json({
      error: 'VENDOR_NOT_FOUND',
      message: 'Vendor not found',
    });
  }

  // Soft delete by setting status to inactive
  const deletedVendor = await prisma.user.update({
    where: { id },
    data: {
      status: 'inactive',
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
    },
  });

  // Audit log
  await auditService.logBinderEvent({
    action: 'vendor.delete',
    tenantId: orgId,
    path: req.url,
    ts: Date.now(),
  });

  return res.status(200).json({
    ok: true,
    vendor: deletedVendor,
    message: 'Vendor deactivated successfully',
  });
}

export default withAudience('tenant', handler);
