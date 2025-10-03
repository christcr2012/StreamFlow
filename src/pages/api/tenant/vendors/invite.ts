import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const InviteVendorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['tenant_accountant', 'tenant_it_vendor', 'tenant_auditor', 'tenant_consultant']),
  name: z.string().min(1),
  scope: z.object({
    buIds: z.array(z.string()).optional(), // Optional: limit to specific business units
    permissions: z.array(z.string()).optional(), // Optional: specific permissions
  }).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = InviteVendorSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { email, role, name, scope } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email, orgId },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'USER_EXISTS',
        message: 'User with this email already exists',
      });
    }

    // Create vendor user with new schema fields
    const vendorUser = await prisma.user.create({
      data: {
        orgId,
        email,
        name: name || email,
        role: 'STAFF', // Using existing Role enum
        status: 'pending', // Pending until they accept invitation
        roleScope: 'vendor', // Mark as vendor user
        audience: 'tenant_vendor', // JWT audience for vendor access
        metadata: {
          vendorRole: role,
          scope: scope || {},
          invitedAt: new Date().toISOString(),
        },
      },
    });

    // TODO: Send invitation email
    // await emailService.sendVendorInvitation(email, role, invitationToken);

    // Audit log
    await auditService.logBinderEvent({
      action: 'vendor.invite',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(201).json({
      ok: true,
      vendor: {
        id: vendorUser.id,
        email: vendorUser.email,
        name: vendorUser.name,
        role: vendorUser.role,
        status: vendorUser.status,
      },
      message: 'Vendor invitation sent',
    });
  } catch (error) {
    console.error('Error inviting vendor:', error);
    await auditService.logBinderEvent({
      action: 'vendor.invite.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to invite vendor',
    });
  }
}

export default withAudience('tenant', handler);

