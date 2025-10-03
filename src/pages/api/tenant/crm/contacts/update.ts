import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateContactSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    contact_id: z.string(),
    patch: z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      title: z.string().optional(),
      department: z.string().optional(),
      mobile_phone: z.string().optional(),
      work_phone: z.string().optional(),
      website: z.string().optional(),
    }),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = UpdateContactSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract ID from contact_id
    const contactId = payload.contact_id.replace('CON-', '');
    if (!contactId) {
      return res.status(400).json({
        error: 'INVALID_CONTACT_ID',
        message: 'Contact ID must be in format CON-000001',
      });
    }

    // Check if contact exists
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        orgId,
        status: { not: 'archived' },
      },
    });

    if (!existingContact) {
      return res.status(404).json({
        error: 'CONTACT_NOT_FOUND',
        message: 'Contact not found or has been archived',
      });
    }

    // Check for duplicate email if being updated
    if (payload.patch.email) {
      const duplicateContact = await prisma.contact.findFirst({
        where: {
          orgId,
          id: { not: contactId },
          email: payload.patch.email,
          status: { not: 'archived' },
        },
      });

      if (duplicateContact) {
        return res.status(422).json({
          error: 'DUPLICATE_CONTACT',
          message: 'Another contact with this email already exists',
          existing_contact_id: `CON-${duplicateContact.id.substring(0, 6)}`,
        });
      }
    }

    // Update contact
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(payload.patch.name && { name: payload.patch.name }),
        ...(payload.patch.email !== undefined && { email: payload.patch.email }),
        ...(payload.patch.phone !== undefined && { phone: payload.patch.phone }),
        ...(payload.patch.title !== undefined && { title: payload.patch.title }),
        ...(payload.patch.department !== undefined && { department: payload.patch.department }),
        ...(payload.patch.mobile_phone !== undefined && { mobilePhone: payload.patch.mobile_phone }),
        ...(payload.patch.work_phone !== undefined && { workPhone: payload.patch.work_phone }),
        ...(payload.patch.website !== undefined && { website: payload.patch.website }),
      },
    });

    const contactIdFormatted = `CON-${updatedContact.id.substring(0, 6)}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.contact.update',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: contactIdFormatted,
        version: updatedContact.version,
      },
      contact: {
        id: contactIdFormatted,
        name: updatedContact.name,
        email: updatedContact.email,
        phone: updatedContact.phone,
        title: updatedContact.title,
        department: updatedContact.department,
        mobile_phone: updatedContact.mobilePhone,
        work_phone: updatedContact.workPhone,
        website: updatedContact.website,
        is_primary: updatedContact.isPrimary,
        updated_at: updatedContact.updatedAt,
      },
      audit_id: `AUD-CON-${updatedContact.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    await auditService.logBinderEvent({
      action: 'crm.contact.update.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update contact',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
