import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateAttachmentSchema = z.object({
  entityType: z.enum(['lead', 'contact', 'organization', 'opportunity', 'workorder']),
  entityId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(100),
  storageKey: z.string().min(1),
  url: z.string().url().optional(),
});

const ListAttachmentsSchema = z.object({
  entityType: z.enum(['lead', 'contact', 'organization', 'opportunity', 'workorder']),
  entityId: z.string().min(1),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export class AttachmentService {
  /**
   * Create a new attachment record
   * Note: Actual file upload to S3/storage should happen before calling this
   */
  async create(
    orgId: string,
    userId: string,
    data: z.infer<typeof CreateAttachmentSchema>
  ) {
    const validated = CreateAttachmentSchema.parse(data);

    const attachment = await prisma.attachment.create({
      data: {
        orgId,
        userId,
        entityType: validated.entityType,
        entityId: validated.entityId,
        fileName: validated.fileName,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        storageKey: validated.storageKey,
        url: validated.url,
      },
    });

    return attachment;
  }

  /**
   * Get an attachment by ID
   */
  async getById(orgId: string, attachmentId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        orgId,
      },
    });

    return attachment;
  }

  /**
   * List attachments for an entity
   */
  async list(
    orgId: string,
    params: z.infer<typeof ListAttachmentsSchema>
  ) {
    const validated = ListAttachmentsSchema.parse(params);
    const limit = validated.limit ?? 20;
    const offset = validated.offset ?? 0;

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({
        where: {
          orgId,
          entityType: validated.entityType,
          entityId: validated.entityId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.attachment.count({
        where: {
          orgId,
          entityType: validated.entityType,
          entityId: validated.entityId,
        },
      }),
    ]);

    return {
      attachments,
      total,
      limit,
      offset,
    };
  }

  /**
   * Delete an attachment
   * Note: Actual file deletion from S3/storage should happen after this
   */
  async delete(orgId: string, attachmentId: string) {
    // Verify attachment exists and belongs to org
    const existing = await this.getById(orgId, attachmentId);
    if (!existing) {
      throw new Error('Attachment not found');
    }

    await prisma.attachment.delete({
      where: {
        id: attachmentId,
      },
    });

    return { 
      success: true,
      storageKey: existing.storageKey, // Return for cleanup
    };
  }

  /**
   * Get total storage used by an organization
   */
  async getStorageUsage(orgId: string) {
    const result = await prisma.attachment.aggregate({
      where: {
        orgId,
      },
      _sum: {
        fileSize: true,
      },
      _count: true,
    });

    return {
      totalBytes: result._sum.fileSize ?? 0,
      totalFiles: result._count,
    };
  }

  /**
   * Get storage usage by entity type
   */
  async getStorageByEntityType(orgId: string) {
    const attachments = await prisma.attachment.groupBy({
      by: ['entityType'],
      where: {
        orgId,
      },
      _sum: {
        fileSize: true,
      },
      _count: true,
    });

    return attachments.map((item: any) => ({
      entityType: item.entityType,
      totalBytes: item._sum.fileSize ?? 0,
      totalFiles: item._count,
    }));
  }
}

