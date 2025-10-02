import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/server/services/auditService';
import { withAudience, AUDIENCE, getUserInfo } from '@/middleware/withAudience';
import { withCostGuard, COST_GUARD } from '@/middleware/withCostGuard';

// Zod schemas for validation
const PresignRequestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  entityType: z.enum(['opportunity', 'organization', 'contact']),
  entityId: z.string(),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().min(1).max(100 * 1024 * 1024), // Max 100MB
});

// Blocked MIME types for security
const BLOCKED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
  'text/x-script',
];

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function errorResponse(res: NextApiResponse, status: number, error: string, message: string, details?: any) {
  return res.status(status).json({
    error,
    message,
    details,
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'MethodNotAllowed', 'Method not allowed');
  }

  const { orgId, email } = getUserInfo(req);
  const userId = email || 'user_test';

  try {
    const validation = PresignRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return errorResponse(res, 422, 'ValidationError', 'Invalid request body', validation.error.errors);
    }

    const { idempotencyKey, entityType, entityId, filename, mimeType, sizeBytes } = validation.data;

    // Check file size
    if (sizeBytes > MAX_FILE_SIZE) {
      return errorResponse(res, 413, 'PayloadTooLarge', 'File size exceeds 100MB limit');
    }

    // Check MIME type
    if (BLOCKED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return errorResponse(res, 415, 'UnsupportedMediaType', 'File type not allowed');
    }

    // Check idempotency
    const existing = await prisma.crmFile.findFirst({
      where: {
        orgId,
        entityType,
        entityId,
        filename,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last 60 seconds
        },
      },
    });

    if (existing) {
      // Return existing file (presigned URL would be regenerated in production)
      return res.status(200).json({
        ok: true,
        data: {
          fileId: existing.id,
          uploadUrl: `https://storage.example.com/upload/${existing.storageKey}`, // Mock URL
        },
      });
    }

    // Verify entity exists
    let entityExists = false;
    if (entityType === 'opportunity') {
      entityExists = !!(await prisma.opportunity.findFirst({ where: { orgId, id: entityId } }));
    } else if (entityType === 'organization') {
      entityExists = !!(await prisma.customer.findFirst({ where: { orgId, id: entityId } }));
    } else if (entityType === 'contact') {
      entityExists = !!(await prisma.contact.findFirst({ where: { orgId, id: entityId } }));
    }

    if (!entityExists) {
      return errorResponse(res, 404, 'NotFound', `${entityType} not found`);
    }

    // Generate storage key
    const storageKey = `${orgId}/${entityType}/${entityId}/${Date.now()}-${filename}`;

    // Create file record
    const file = await prisma.crmFile.create({
      data: {
        orgId,
        entityType,
        entityId,
        filename,
        mimeType,
        sizeBytes,
        storageKey,
      },
    });

    // In production, generate presigned URL using S3/storage service
    // For now, return a mock URL
    const uploadUrl = `https://storage.example.com/upload/${storageKey}`;

    // Audit log
    await auditLog({
      orgId,
      actorId: userId,
      action: 'create',
      entityType: 'crm_file',
      entityId: file.id,
      delta: { filename, mimeType, sizeBytes, entityType, entityId },
    });

    return res.status(201).json({
      ok: true,
      data: {
        fileId: file.id,
        uploadUrl,
      },
    });
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return errorResponse(res, 500, 'Internal', 'Failed to create presigned URL');
  }
}

// Apply both audience and cost guard (file uploads cost credits)
export default withAudience(
  AUDIENCE.CLIENT_ONLY,
  withCostGuard(COST_GUARD.FILE_UPLOAD, handler)
);

