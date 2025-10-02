import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateNoteSchema = z.object({
  entityType: z.enum(['lead', 'contact', 'organization', 'opportunity', 'workorder']),
  entityId: z.string().min(1),
  body: z.string().min(1).max(10000),
  isPinned: z.boolean().optional(),
});

const UpdateNoteSchema = z.object({
  body: z.string().min(1).max(10000).optional(),
  isPinned: z.boolean().optional(),
});

const ListNotesSchema = z.object({
  entityType: z.enum(['lead', 'contact', 'organization', 'opportunity', 'workorder']),
  entityId: z.string().min(1),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export class NoteService {
  /**
   * Create a new note
   */
  async create(
    orgId: string,
    userId: string,
    data: z.infer<typeof CreateNoteSchema>
  ) {
    const validated = CreateNoteSchema.parse(data);

    const note = await prisma.note.create({
      data: {
        orgId,
        userId,
        entityType: validated.entityType,
        entityId: validated.entityId,
        body: validated.body,
        isPinned: validated.isPinned ?? false,
      },
    });

    return note;
  }

  /**
   * Get a note by ID
   */
  async getById(orgId: string, noteId: string) {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        orgId,
      },
    });

    return note;
  }

  /**
   * List notes for an entity
   */
  async list(
    orgId: string,
    params: z.infer<typeof ListNotesSchema>
  ) {
    const validated = ListNotesSchema.parse(params);
    const limit = validated.limit ?? 20;
    const offset = validated.offset ?? 0;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: {
          orgId,
          entityType: validated.entityType,
          entityId: validated.entityId,
        },
        orderBy: [
          { isPinned: 'desc' }, // Pinned notes first
          { createdAt: 'desc' }, // Then by creation date
        ],
        take: limit,
        skip: offset,
      }),
      prisma.note.count({
        where: {
          orgId,
          entityType: validated.entityType,
          entityId: validated.entityId,
        },
      }),
    ]);

    return {
      notes,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update a note
   */
  async update(
    orgId: string,
    noteId: string,
    data: z.infer<typeof UpdateNoteSchema>
  ) {
    const validated = UpdateNoteSchema.parse(data);

    // Verify note exists and belongs to org
    const existing = await this.getById(orgId, noteId);
    if (!existing) {
      throw new Error('Note not found');
    }

    const note = await prisma.note.update({
      where: {
        id: noteId,
      },
      data: validated,
    });

    return note;
  }

  /**
   * Delete a note
   */
  async delete(orgId: string, noteId: string) {
    // Verify note exists and belongs to org
    const existing = await this.getById(orgId, noteId);
    if (!existing) {
      throw new Error('Note not found');
    }

    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    return { success: true };
  }

  /**
   * Pin/unpin a note
   */
  async togglePin(orgId: string, noteId: string) {
    const existing = await this.getById(orgId, noteId);
    if (!existing) {
      throw new Error('Note not found');
    }

    const note = await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        isPinned: !existing.isPinned,
      },
    });

    return note;
  }
}

