import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';
import { z } from 'zod';

export interface CSVUploadResult {
  id: string;
  filename: string;
  recordCount: number;
  headers: string[];
  sampleData: any[];
}

export interface FieldMapping {
  csvField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

export interface ValidationResult {
  valid: boolean;
  totalRecords: number;
  validRecords: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
    value: any;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    warning: string;
    value: any;
  }>;
}

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

  /**
   * Upload CSV file for migration (BINDER3)
   */
  static async uploadCSV(
    tenantId: string,
    userId: string,
    filename: string,
    csvData: string,
    type: 'organizations' | 'contacts' | 'assets' | 'invoices' | 'work_orders' | 'fuel' | 'dvir'
  ): Promise<CSVUploadResult> {
    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      // Parse sample data (first 5 rows)
      const sampleData = dataLines.slice(0, 5).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        return record;
      });

      // Create a mock upload record (in real implementation would use a proper table)
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store in memory for demo (in real app would use database)
      (global as any).csvUploads = (global as any).csvUploads || {};
      (global as any).csvUploads[uploadId] = {
        id: uploadId,
        orgId: tenantId,
        filename,
        type,
        headers: JSON.stringify(headers),
        recordCount: dataLines.length,
        sampleData: JSON.stringify(sampleData),
        rawData: csvData,
        uploadedBy: userId,
        status: 'uploaded',
        createdAt: new Date(),
      };

      // Audit log
      await auditService.logBinderEvent({
        action: 'migration.csv.upload',
        tenantId,
        path: '/migration/csv',
        ts: Date.now(),
      });

      return {
        id: uploadId,
        filename,
        recordCount: dataLines.length,
        headers,
        sampleData,
      };
    } catch (error) {
      await auditService.logBinderEvent({
        action: 'migration.csv.upload.error',
        tenantId,
        path: '/migration/csv',
        error: String(error),
        ts: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Map CSV fields to target schema (BINDER3)
   */
  static async mapFields(
    tenantId: string,
    userId: string,
    uploadId: string,
    mappings: FieldMapping[]
  ): Promise<{ success: boolean; suggestions?: string[] }> {
    try {
      // Get upload record from memory (in real app would use database)
      const uploads = (global as any).csvUploads || {};
      const upload = uploads[uploadId];

      if (!upload || upload.orgId !== tenantId) {
        throw new Error('CSV upload not found');
      }

      // Validate mappings
      const headers = JSON.parse(upload.headers);
      const invalidMappings = mappings.filter(m => !headers.includes(m.csvField));

      if (invalidMappings.length > 0) {
        throw new Error(`Invalid CSV fields: ${invalidMappings.map(m => m.csvField).join(', ')}`);
      }

      // Store field mappings
      upload.fieldMappings = JSON.stringify(mappings);
      upload.status = 'mapped';
      upload.updatedAt = new Date();

      // Generate AI suggestions for unmapped fields (mock implementation)
      const mappedFields = mappings.map(m => m.csvField);
      const unmappedFields = headers.filter((h: string) => !mappedFields.includes(h));
      const suggestions = unmappedFields.map((field: string) =>
        `Consider mapping "${field}" to a target field`
      );

      // Audit log
      await auditService.logBinderEvent({
        action: 'migration.fields.map',
        tenantId,
        path: '/migration/map',
        ts: Date.now(),
      });

      return {
        success: true,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (error) {
      await auditService.logBinderEvent({
        action: 'migration.fields.map.error',
        tenantId,
        path: '/migration/map',
        error: String(error),
        ts: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Validate sample records (BINDER3)
   */
  static async validateSample(
    tenantId: string,
    userId: string,
    uploadId: string,
    sampleSize: number = 100
  ): Promise<ValidationResult> {
    try {
      // Get upload record from memory
      const uploads = (global as any).csvUploads || {};
      const upload = uploads[uploadId];

      if (!upload || upload.orgId !== tenantId || !upload.fieldMappings) {
        throw new Error('CSV upload not found or not mapped');
      }

      const mappings: FieldMapping[] = JSON.parse(upload.fieldMappings);
      const rawData = upload.rawData;

      // Parse CSV data
      const lines = rawData.trim().split('\n');
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1, sampleSize + 1);

      const errors: ValidationResult['errors'] = [];
      const warnings: ValidationResult['warnings'] = [];
      let validRecords = 0;

      // Validate each record
      dataLines.forEach((line: string, index: number) => {
        const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
        const record: any = {};
        headers.forEach((header: string, headerIndex: number) => {
          record[header] = values[headerIndex] || '';
        });

        let recordValid = true;

        // Validate required fields
        mappings.forEach(mapping => {
          if (mapping.required && !record[mapping.csvField]) {
            errors.push({
              row: index + 2, // +2 because we skip header and use 1-based indexing
              field: mapping.csvField,
              error: 'Required field is empty',
              value: record[mapping.csvField],
            });
            recordValid = false;
          }

          // Add warnings for potential data quality issues
          if (record[mapping.csvField] && record[mapping.csvField].length > 255) {
            warnings.push({
              row: index + 2,
              field: mapping.csvField,
              warning: 'Value may be too long',
              value: record[mapping.csvField].substring(0, 50) + '...',
            });
          }
        });

        if (recordValid) {
          validRecords++;
        }
      });

      // Update upload status
      const validationPassed = errors.length / dataLines.length < 0.1; // Less than 10% errors
      upload.status = validationPassed ? 'validated' : 'validation_failed';
      upload.validationResults = JSON.stringify({ errors, warnings, validRecords });
      upload.updatedAt = new Date();

      // Audit log
      await auditService.logBinderEvent({
        action: 'migration.validate',
        tenantId,
        path: '/migration/validate',
        ts: Date.now(),
      });

      return {
        valid: validationPassed,
        totalRecords: dataLines.length,
        validRecords,
        errors,
        warnings,
      };
    } catch (error) {
      await auditService.logBinderEvent({
        action: 'migration.validate.error',
        tenantId,
        path: '/migration/validate',
        error: String(error),
        ts: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Execute migration (import data) (BINDER3)
   */
  static async executeMigration(
    tenantId: string,
    userId: string,
    uploadId: string
  ): Promise<{ imported: number; errors: string[] }> {
    try {
      // Get validated upload from memory
      const uploads = (global as any).csvUploads || {};
      const upload = uploads[uploadId];

      if (!upload || upload.orgId !== tenantId || upload.status !== 'validated') {
        throw new Error('CSV upload not found or not validated');
      }

      const mappings: FieldMapping[] = JSON.parse(upload.fieldMappings);
      const rawData = upload.rawData;

      // Parse and import data
      const lines = rawData.trim().split('\n');
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      let imported = 0;
      const errors: string[] = [];

      // Import each record (mock implementation)
      for (let i = 0; i < Math.min(dataLines.length, 10); i++) { // Limit to 10 for demo
        try {
          const values = dataLines[i].split(',').map((v: string) => v.trim().replace(/"/g, ''));
          const record: any = {};
          headers.forEach((header: string, headerIndex: number) => {
            record[header] = values[headerIndex] || '';
          });

          // Transform record based on mappings
          const transformedRecord = this.transformRecord(record, mappings, tenantId);

          // Mock import (in real app would actually create records)
          console.log(`Importing ${upload.type} record:`, transformedRecord);
          imported++;
        } catch (error) {
          errors.push(`Row ${i + 2}: ${String(error)}`);
        }
      }

      // Update upload status
      upload.status = 'completed';
      upload.importResults = JSON.stringify({ imported, errors });
      upload.updatedAt = new Date();

      // Audit log
      await auditService.logBinderEvent({
        action: 'migration.execute',
        tenantId,
        path: '/migration/execute',
        ts: Date.now(),
      });

      return { imported, errors };
    } catch (error) {
      await auditService.logBinderEvent({
        action: 'migration.execute.error',
        tenantId,
        path: '/migration/execute',
        error: String(error),
        ts: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Transform record based on field mappings (BINDER3)
   */
  private static transformRecord(record: any, mappings: FieldMapping[], tenantId: string): any {
    const transformed: any = { orgId: tenantId };

    mappings.forEach(mapping => {
      let value = record[mapping.csvField];

      // Apply transformations
      if (mapping.transformation) {
        switch (mapping.transformation) {
          case 'uppercase':
            value = value?.toUpperCase();
            break;
          case 'lowercase':
            value = value?.toLowerCase();
            break;
          case 'trim':
            value = value?.trim();
            break;
          case 'date':
            value = new Date(value);
            break;
        }
      }

      transformed[mapping.targetField] = value;
    });

    return transformed;
  }
}

export const migrationService = new MigrationService();

