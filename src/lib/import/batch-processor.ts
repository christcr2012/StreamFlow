/**
 * Batch Processor - Process imports in batches with progress tracking
 * 
 * Features:
 * - Batch processing (100 records/batch by default)
 * - Field mapping and transformation
 * - Data validation
 * - Deduplication
 * - Error logging
 * - Progress tracking
 * - Resume on failure
 */

import { prisma } from '@/lib/prisma';
import { ImportStatus, ImportEntityType } from '@prisma/client';
import { getEntitySchema } from './schemas';

export interface BatchProcessorOptions {
  importJobId: string;
  orgId: string;
  entityType: ImportEntityType;
  records: any[];
  fieldMappings: any[];
  transformRules?: any[];
  validationRules?: any[];
  dedupeFields?: string[];
  batchSize?: number;
}

export interface BatchResult {
  success: number;
  errors: number;
  skipped: number;
  total: number;
}

/**
 * Transform a single field value
 */
function transformValue(value: any, transforms: string[]): any {
  let result = value;

  for (const transform of transforms) {
    switch (transform) {
      case 'trim':
        result = typeof result === 'string' ? result.trim() : result;
        break;
      case 'lowercase':
        result = typeof result === 'string' ? result.toLowerCase() : result;
        break;
      case 'uppercase':
        result = typeof result === 'string' ? result.toUpperCase() : result;
        break;
      case 'normalizePhone':
        result = normalizePhone(result);
        break;
      case 'parseDate':
        result = parseDate(result);
        break;
      default:
        // Unknown transform - skip
        break;
    }
  }

  return result;
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: any): string | null {
  if (!phone) return null;
  
  const str = String(phone);
  const digits = str.replace(/\D/g, '');
  
  if (digits.length === 0) return null;
  
  // US/Canada numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  
  // International numbers
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  return null;
}

/**
 * Parse date from various formats
 */
function parseDate(date: any): Date | null {
  if (!date) return null;
  
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Apply field mappings and transformations to a record
 */
function transformRecord(
  sourceRecord: any,
  fieldMappings: any[],
  transformRules?: any[]
): any {
  const transformed: any = {};

  for (const mapping of fieldMappings) {
    const { source, target, transform } = mapping;
    
    let value = sourceRecord[source];
    
    // Apply field-specific transforms
    if (transform && Array.isArray(transform)) {
      value = transformValue(value, transform);
    }
    
    transformed[target] = value;
  }

  // Apply global transform rules
  if (transformRules) {
    for (const rule of transformRules) {
      const { target, rules } = rule;
      if (transformed[target] !== undefined && Array.isArray(rules)) {
        transformed[target] = transformValue(transformed[target], rules);
      }
    }
  }

  return transformed;
}

/**
 * Validate a record against validation rules
 */
function validateRecord(
  record: any,
  validationRules?: any[]
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (!validationRules) {
    return { valid: true, errors };
  }

  for (const rule of validationRules) {
    const { target, rules } = rule;
    const value = record[target];

    for (const ruleName of rules || []) {
      switch (ruleName) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            errors.push({ field: target, message: 'Field is required' });
          }
          break;
        case 'email':
          if (value && typeof value === 'string' && !/@/.test(value)) {
            errors.push({ field: target, message: 'Invalid email format' });
          }
          break;
        case 'normalizePhone':
          if (value && !normalizePhone(value)) {
            errors.push({ field: target, message: 'Invalid phone number' });
          }
          break;
        default:
          // Unknown rule - skip
          break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if record is a duplicate
 */
async function checkDuplicate(
  orgId: string,
  entityType: ImportEntityType,
  record: any,
  dedupeFields?: string[]
): Promise<boolean> {
  if (!dedupeFields || dedupeFields.length === 0) {
    return false;
  }

  // Build where clause for deduplication
  const where: any = { orgId };
  
  for (const field of dedupeFields) {
    const value = record[field];
    if (value) {
      where[field] = value;
    }
  }

  // Check based on entity type
  let existing;
  switch (entityType) {
    case ImportEntityType.CUSTOMERS:
      existing = await prisma.customer.findFirst({ where });
      break;
    case ImportEntityType.JOBS:
      existing = await prisma.job.findFirst({ where });
      break;
    case ImportEntityType.INVOICES:
      existing = await prisma.invoice.findFirst({ where });
      break;
    default:
      return false;
  }

  return !!existing;
}

/**
 * Create a record in the database
 */
async function createRecord(
  orgId: string,
  entityType: ImportEntityType,
  record: any
): Promise<void> {
  const data = { ...record, orgId };

  switch (entityType) {
    case ImportEntityType.CUSTOMERS:
      await prisma.customer.create({ data });
      break;
    case ImportEntityType.JOBS:
      await prisma.job.create({ data });
      break;
    case ImportEntityType.INVOICES:
      await prisma.invoice.create({ data });
      break;
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

/**
 * Log an import error
 */
async function logError(
  importJobId: string,
  rowNumber: number,
  fieldName: string | null,
  errorType: string,
  errorMessage: string,
  rawData?: any
): Promise<void> {
  await prisma.importError.create({
    data: {
      importJobId,
      rowNumber,
      fieldName,
      errorType,
      errorMessage,
      rawData,
    },
  });
}

/**
 * Process a single batch of records
 */
async function processBatch(
  options: BatchProcessorOptions,
  records: any[],
  startIndex: number
): Promise<BatchResult> {
  const {
    importJobId,
    orgId,
    entityType,
    fieldMappings,
    transformRules,
    validationRules,
    dedupeFields,
  } = options;

  const result: BatchResult = {
    success: 0,
    errors: 0,
    skipped: 0,
    total: records.length,
  };

  for (let i = 0; i < records.length; i++) {
    const rowNumber = startIndex + i + 1;
    const sourceRecord = records[i];

    try {
      // 1. Transform record
      const transformed = transformRecord(sourceRecord, fieldMappings, transformRules);

      // 2. Schema validation (entity-specific)
      const schema = getEntitySchema(entityType);
      if (schema) {
        const parsed = schema.safeParse(transformed);
        if (!parsed.success) {
          result.errors++;
          for (const issue of parsed.error.issues) {
            await logError(
              importJobId,
              rowNumber,
              (issue.path && issue.path.length > 0 ? String(issue.path[0]) : null),
              'schema',
              issue.message,
              sourceRecord
            );
          }
          continue;
        }
      }

      // 3. Validate record (rule-based)
      const validation = validateRecord(transformed, validationRules);
      if (!validation.valid) {
        result.errors++;
        for (const error of validation.errors) {
          await logError(
            importJobId,
            rowNumber,
            error.field,
            'validation',
            error.message,
            sourceRecord
          );
        }
        continue;
      }

      // 4. Check for duplicates
      const isDuplicate = await checkDuplicate(orgId, entityType, transformed, dedupeFields);
      if (isDuplicate) {
        result.skipped++;
        await logError(
          importJobId,
          rowNumber,
          null,
          'duplicate',
          'Record already exists',
          sourceRecord
        );
        continue;
      }

      // 4. Create record
      await createRecord(orgId, entityType, transformed);
      result.success++;
    } catch (error: any) {
      result.errors++;
      await logError(
        importJobId,
        rowNumber,
        null,
        'processing',
        error.message || 'Unknown error',
        sourceRecord
      );
    }
  }

  return result;
}

/**
 * Process all records in batches
 */
export async function processImport(options: BatchProcessorOptions): Promise<void> {
  const { importJobId, records, batchSize = 100 } = options;

  const totalRecords = records.length;
  let processedRecords = 0;
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  // Update job status to processing
  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      status: ImportStatus.PROCESSING,
      startedAt: new Date(),
      totalRecords,
    },
  });

  // Process in batches
  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = records.slice(i, Math.min(i + batchSize, totalRecords));
    const batchResult = await processBatch(options, batch, i);

    processedRecords += batch.length;
    successCount += batchResult.success;
    errorCount += batchResult.errors;
    skipCount += batchResult.skipped;

    // Update progress
    const progressPercent = Math.round((processedRecords / totalRecords) * 100);
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        processedRecords,
        successCount,
        errorCount,
        skipCount,
        progressPercent,
      },
    });
  }

  // Mark as completed
  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      status: ImportStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

