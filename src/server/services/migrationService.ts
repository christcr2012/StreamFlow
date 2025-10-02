import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CSVImportSchema = z.object({
  entity_type: z.enum(['customer', 'contact', 'job', 'invoice', 'asset', 'vehicle']),
  file_url: z.string().url(),
  mapping: z.record(z.string()),
  validate_only: z.boolean().default(false),
});

export class MigrationService {
  /**
   * Start CSV import
   */
  async startCSVImport(
    orgId: string,
    userId: string,
    data: z.infer<typeof CSVImportSchema>
  ) {
    const validated = CSVImportSchema.parse(data);

    // Create migration record
    const migration = await prisma.syncQueue.create({
      data: {
        orgId,
        userId,
        action: 'import',
        entityType: validated.entity_type,
        status: 'pending',
        payload: JSON.stringify({
          file_url: validated.file_url,
          mapping: validated.mapping,
          validate_only: validated.validate_only,
        }),
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'start_import',
        resource: `migration:${migration.id}`,
        meta: {
          entity_type: validated.entity_type,
          validate_only: validated.validate_only,
        },
      },
    });

    return migration;
  }

  /**
   * Process migration queue item
   */
  async processMigration(migrationId: string) {
    const migration = await prisma.syncQueue.findUnique({
      where: { id: migrationId },
    });

    if (!migration) {
      throw new Error('Migration not found');
    }

    if (migration.status !== 'pending') {
      throw new Error('Migration already processed');
    }

    // Update status to processing
    await prisma.syncQueue.update({
      where: { id: migrationId },
      data: { status: 'processing' },
    });

    try {
      const payload = JSON.parse(migration.payload);
      const entityType = migration.entityType;

      // Simulate processing (in real implementation, would parse CSV and import)
      // For now, just mark as complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await prisma.syncQueue.update({
        where: { id: migrationId },
        data: {
          status: 'synced',
          syncedAt: new Date(),
          error: null,
        },
      });

      return { success: true };
    } catch (error: any) {
      await prisma.syncQueue.update({
        where: { id: migrationId },
        data: {
          status: 'failed',
          syncedAt: new Date(),
          error: error.message,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(orgId: string, migrationId: string) {
    const migration = await prisma.syncQueue.findFirst({
      where: {
        id: migrationId,
        orgId,
      },
    });

    if (!migration) {
      throw new Error('Migration not found');
    }

    return {
      id: migration.id,
      entity_type: migration.entityType,
      action: migration.action,
      status: migration.status,
      created_at: migration.createdAt,
      synced_at: migration.syncedAt,
      error: migration.error,
    };
  }

  /**
   * List migrations for org
   */
  async listMigrations(
    orgId: string,
    filters?: {
      entity_type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { orgId };

    if (filters?.entity_type) {
      where.entityType = filters.entity_type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [migrations, total] = await Promise.all([
      prisma.syncQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      prisma.syncQueue.count({ where }),
    ]);

    return {
      migrations: migrations.map((m) => ({
        id: m.id,
        entity_type: m.entityType,
        action: m.action,
        status: m.status,
        created_at: m.createdAt,
        synced_at: m.syncedAt,
      })),
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Cancel migration
   */
  async cancelMigration(orgId: string, userId: string, migrationId: string) {
    const migration = await prisma.syncQueue.findFirst({
      where: {
        id: migrationId,
        orgId,
      },
    });

    if (!migration) {
      throw new Error('Migration not found');
    }

    if (migration.status !== 'pending') {
      throw new Error('Can only cancel pending migrations');
    }

    await prisma.syncQueue.update({
      where: { id: migrationId },
      data: {
        status: 'failed',
        error: 'Cancelled by user',
        syncedAt: new Date(),
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'cancel_migration',
        resource: `migration:${migrationId}`,
        meta: {},
      },
    });

    return { success: true };
  }

  /**
   * Validate CSV mapping
   */
  async validateMapping(
    entityType: string,
    mapping: Record<string, string>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Define required fields for each entity type
    const requiredFields: Record<string, string[]> = {
      customer: ['name', 'email'],
      contact: ['first_name', 'last_name', 'email'],
      job: ['customer_id', 'title'],
      invoice: ['customer_id', 'amount'],
      asset: ['name', 'category'],
      vehicle: ['make', 'model', 'year'],
    };

    const required = requiredFields[entityType] || [];

    for (const field of required) {
      if (!mapping[field]) {
        errors.push(`Missing required field mapping: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats(orgId: string) {
    const [total, pending, synced, failed] = await Promise.all([
      prisma.syncQueue.count({ where: { orgId } }),
      prisma.syncQueue.count({ where: { orgId, status: 'pending' } }),
      prisma.syncQueue.count({ where: { orgId, status: 'synced' } }),
      prisma.syncQueue.count({ where: { orgId, status: 'failed' } }),
    ]);

    return {
      total,
      pending,
      synced,
      failed,
      success_rate: total > 0 ? (synced / total) * 100 : 0,
    };
  }
}

export const migrationService = new MigrationService();

