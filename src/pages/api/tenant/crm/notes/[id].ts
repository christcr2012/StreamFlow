import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';
import { withAudience } from '@/middleware/audience';

// Zod schemas for validation
const UpdateNoteSchema = z.object({
  body: z.string().min(1).max(10000),
});

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string, id: string) {
  try {
    const note = await prisma.crmNote.findFirst({
      where: { orgId, id },
    });

    if (!note) {
      return errorResponse(res, 404, 'NotFound', 'Note not found');
    }

    return res.status(200).json({
      ok: true,
      data: note,
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch note');
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string) {
  try {
    const validation = UpdateNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const { body } = validation.data;

    // Check if note exists
    const existing = await prisma.crmNote.findFirst({
      where: { orgId, id },
    });

    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'Note not found');
    }

    // Update note
    const note = await prisma.crmNote.update({
      where: { id },
      data: { body },
    });

    // Audit log (redact PII)
    await auditService.logBinderEvent({
      action: 'crm.note.update',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      data: note,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to update note');
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string) {
  try {
    // Check if note exists
    const existing = await prisma.crmNote.findFirst({
      where: { orgId, id },
    });

    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'Note not found');
    }

    // Delete note
    await prisma.crmNote.delete({
      where: { id },
    });

    // Audit log
    await auditService.logBinderEvent({
      action: 'crm.note.delete',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to delete note');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    return errorResponse(res, 400, 'BadRequest', 'Invalid note ID');
  }

  if (req.method === 'GET') {
    return handleGet(req, res, orgId, id);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, orgId, userId, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, orgId, userId, id);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

export default withAudience('tenant', handler);

