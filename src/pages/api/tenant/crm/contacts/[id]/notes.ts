import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';

// Validation schema
const createNoteSchema = z.object({
  body: z.string().min(1, 'Note body is required'),
});

// Error envelope helper
function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Add withAudience middleware (Task 3)
  const orgId = req.headers['x-org-id'] as string || 'org_test';
  const userId = req.headers['x-user-id'] as string || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    return errorResponse(res, 400, 'BadRequest', 'Invalid contact ID');
  }

  if (req.method === 'POST') {
    return handlePost(req, res, orgId, userId, id);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, contactId: string) {
  try {
    // Validate request body
    const data = createNoteSchema.parse(req.body);

    // Check if contact exists
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        orgId,
      },
    });

    if (!contact) {
      return errorResponse(res, 404, 'NotFound', 'Contact not found');
    }

    // Create activity/note
    // TODO: When Activity table is created, use this:
    // const activity = await prisma.activity.create({
    //   data: {
    //     orgId,
    //     entityType: 'contact',
    //     entityId: contactId,
    //     type: 'note',
    //     body: data.body,
    //     createdBy: userId,
    //   },
    // });

    // For now, we'll use a workaround
    const noteId = `note_${Date.now()}`;
    
    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'contact_note',
      entityId: noteId,
      delta: {
        contactId,
        body: data.body,
      },
    });

    // Return success
    const response = {
      id: noteId,
      body: data.body,
      createdBy: userId,
      createdByName: 'Current User', // TODO: Fetch from User table
      createdAt: new Date().toISOString(),
    };

    return res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const field = err.path[0]?.toString() || 'unknown';
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      return errorResponse(res, 422, 'UnprocessableEntity', 'Validation failed', fieldErrors);
    }
    console.error('Error creating note:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create note');
  }
}

