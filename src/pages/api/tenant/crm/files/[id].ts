import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, orgId: string, id: string) {
  try {
    const file = await prisma.crmFile.findFirst({
      where: { orgId, id },
    });

    if (!file) {
      return errorResponse(res, 404, 'NotFound', 'File not found');
    }

    // In production, generate presigned download URL
    const downloadUrl = `https://storage.example.com/download/${file.storageKey}`;

    return res.status(200).json({
      ok: true,
      data: {
        ...file,
        downloadUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to fetch file');
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, orgId: string, userId: string, id: string) {
  try {
    // Check if file exists
    const existing = await prisma.crmFile.findFirst({
      where: { orgId, id },
    });

    if (!existing) {
      return errorResponse(res, 404, 'NotFound', 'File not found');
    }

    // Delete file record
    await prisma.crmFile.delete({
      where: { id },
    });

    // In production, also delete from storage service

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'delete',
      entityType: 'crm_file',
      entityId: id,
      delta: { filename: existing.filename, storageKey: existing.storageKey },
    });

    return res.status(200).json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to delete file');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';
  const { id } = req.query;

  if (typeof id !== 'string') {
    return errorResponse(res, 400, 'BadRequest', 'Invalid file ID');
  }

  if (req.method === 'GET') {
    return handleGet(req, res, orgId, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, orgId, userId, id);
  } else {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

